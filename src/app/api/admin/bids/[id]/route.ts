import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, users, vehicles, shipments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification, NotificationTemplates } from '@/lib/notifications';

// Get bid details
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

    const bidId = params.id;

    // Fetch bid
    const [bid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!bid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
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
      .where(eq(users.id, bid.userId))
      .limit(1);

    // Fetch vehicle
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, bid.vehicleId))
      .limit(1);

    return NextResponse.json({
      success: true,
      bid,
      user,
      vehicle,
    });
  } catch (error) {
    console.error('Admin bid detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bid details' },
      { status: 500 }
    );
  }
}

// Update bid
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

    const bidId = params.id;
    const updates = await request.json();

    // Check if bid exists
    const [existingBid] = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!existingBid) {
      return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
    }

    // Allowed fields to update
    const allowedFields = [
      'status',
      'finalBidAmount',
      'currentBidAmount',
      'externalBidId',
      'externalSource',
      'externalStatus',
      'depositLocked',
    ];

    const sanitizedUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    // Get vehicle info for notifications
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, existingBid.vehicleId))
      .limit(1);

    const vehicleName = vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : 'your vehicle';

    // Handle status change to 'placed'
    if (updates.status === 'placed' && existingBid.status !== 'placed') {
      const template = NotificationTemplates.bidPlaced(
        vehicleName,
        parseFloat(existingBid.maxBidAmount || '0')
      );

      await sendNotification({
        userId: existingBid.userId,
        type: template.type,
        title: template.title,
        message: template.message,
        channels: ['in_app', 'email'],
        relatedEntityType: 'bid',
        relatedEntityId: existingBid.id,
      });
    }

    // Handle status change to 'won'
    if (updates.status === 'won' && existingBid.status !== 'won') {
      sanitizedUpdates.wonAt = new Date();

      // Create shipment when bid is won
      const [newShipment] = await db
        .insert(shipments)
        .values({
          userId: existingBid.userId,
          vehicleId: existingBid.vehicleId,
          bidId: existingBid.id,
          status: 'auction_won',
          trackingHistory: [{
            status: 'auction_won',
            location: '',
            timestamp: new Date().toISOString(),
            notes: 'Auction won - shipment created',
          }],
        })
        .returning();

      // Send notification to user about won bid
      const template = NotificationTemplates.bidWon(
        vehicleName,
        parseFloat(updates.finalBidAmount || existingBid.maxBidAmount || '0')
      );

      await sendNotification({
        userId: existingBid.userId,
        type: template.type,
        title: template.title,
        message: template.message,
        channels: ['in_app', 'email'],
        relatedEntityType: 'bid',
        relatedEntityId: existingBid.id,
      });
    }

    // Handle status change to 'lost'
    if (updates.status === 'lost' && existingBid.status !== 'lost') {
      const template = NotificationTemplates.bidLost(vehicleName);

      await sendNotification({
        userId: existingBid.userId,
        type: template.type,
        title: template.title,
        message: template.message,
        channels: ['in_app', 'email'],
        relatedEntityType: 'bid',
        relatedEntityId: existingBid.id,
      });
    }

    sanitizedUpdates.updatedAt = new Date();

    await db
      .update(bids)
      .set(sanitizedUpdates)
      .where(eq(bids.id, bidId));

    return NextResponse.json({
      success: true,
      message: 'Bid updated successfully',
    });
  } catch (error) {
    console.error('Admin bid update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update bid' },
      { status: 500 }
    );
  }
}
