import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, users, vehicles, bids, shipmentPhotos, shipmentDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

// Get shipment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params;

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

// Status display names for notifications
const STATUS_DISPLAY_NAMES: Record<string, string> = {
  auction_won: 'Auction Won',
  payment_pending: 'Payment Pending',
  payment_received: 'Payment Received',
  title_received: 'Title Received',
  picked_up: 'Picked Up',
  in_transit_to_port: 'In Transit to Port',
  at_loading_port: 'At Loading Port',
  loaded_on_vessel: 'Loaded on Vessel',
  in_transit_sea: 'In Transit (Sea)',
  arrived_destination_port: 'Arrived at Port',
  customs_clearance: 'Customs Clearance',
  cleared_customs: 'Cleared Customs',
  delivered: 'Delivered',
};

// Update shipment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shipmentId } = await params;

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

    // Send notification to user about status update
    if (updates.status && updates.status !== existingShipment.status) {
      try {
        // Get vehicle info for the notification message
        const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, existingShipment.vehicleId))
          .limit(1);

        const vehicleName = vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : 'your vehicle';
        const statusDisplayName = STATUS_DISPLAY_NAMES[updates.status] || updates.status.replace(/_/g, ' ');

        await sendNotification({
          userId: existingShipment.userId,
          type: 'shipment_update',
          title: `Shipment Status Update: ${statusDisplayName}`,
          message: `Your shipment for ${vehicleName} has been updated to "${statusDisplayName}". Tap to view details.`,
          channels: ['in_app', 'email'],
          relatedEntityType: 'shipment',
          relatedEntityId: shipmentId,
        });
      } catch (notificationError) {
        console.error('Failed to send shipment status notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

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
