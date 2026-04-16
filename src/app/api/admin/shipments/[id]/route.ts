import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, users, vehicles, bids, shipmentPhotos, shipmentDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

// Get shipment details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const shipmentId = params.id;

    // Fetch shipment with related data
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    // Fetch user
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, shipment.userId))
      .limit(1);

    // Fetch vehicle
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, shipment.vehicleId))
      .limit(1);

    // Fetch bid
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, shipment.bidId))
      .limit(1);

    // Fetch photos
    const photos = await db
      .select()
      .from(shipmentPhotos)
      .where(eq(shipmentPhotos.shipmentId, shipmentId));

    // Fetch documents
    const documents = await db
      .select()
      .from(shipmentDocuments)
      .where(eq(shipmentDocuments.shipmentId, shipmentId));

    return NextResponse.json({
      success: true,
      shipment,
      user,
      vehicle,
      bid,
      photos,
      documents,
    });
  } catch (error) {
    console.error('Admin shipment detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipment details' },
      { status: 500 }
    );
  }
}

// Update shipment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const shipmentId = params.id;
    const updates = await request.json();

    // Check if shipment exists
    const [existingShipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    if (!existingShipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    // Allowed fields to update
    const allowedFields = [
      'status',
      'shippingMethod',
      'vesselName',
      'bookingNumber',
      'containerNumber',
      'billOfLading',
      'departurePort',
      'departedAt',
      'estimatedArrivalAt',
      'arrivedAt',
      'customsClearedAt',
      'deliveredAt',
      'notes',
    ];

    const sanitizedUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // Track status change
    if (updates.status && updates.status !== existingShipment.status) {
      sanitizedUpdates.statusUpdatedBy = admin.id;
      sanitizedUpdates.statusUpdatedAt = new Date();

      // Add to tracking history
      const history = existingShipment.trackingHistory || [];
      history.push({
        status: updates.status,
        location: updates.currentLocation || '',
        timestamp: new Date().toISOString(),
        notes: updates.statusNotes || `Status updated by admin`,
      });
      sanitizedUpdates.trackingHistory = history;
    }

    sanitizedUpdates.updatedAt = new Date();

    await db
      .update(shipments)
      .set(sanitizedUpdates)
      .where(eq(shipments.id, shipmentId));

    // TODO: Send notification to user about status update
    // await sendShipmentStatusNotification(existingShipment.userId, updates.status);

    return NextResponse.json({
      success: true,
      message: 'Shipment updated successfully',
    });
  } catch (error) {
    console.error('Admin shipment update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update shipment' },
      { status: 500 }
    );
  }
}
