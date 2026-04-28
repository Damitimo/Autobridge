import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, users, shipments, vehicles, bids } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const [bidRequest] = await db
      .select({
        id: bidRequests.id,
        auctionLink: bidRequests.auctionLink,
        auctionSource: bidRequests.auctionSource,
        maxBidAmount: bidRequests.maxBidAmount,
        notes: bidRequests.notes,
        status: bidRequests.status,
        adminNotes: bidRequests.adminNotes,
        rejectionReason: bidRequests.rejectionReason,
        vehicleYear: bidRequests.vehicleYear,
        vehicleMake: bidRequests.vehicleMake,
        vehicleModel: bidRequests.vehicleModel,
        vehicleVin: bidRequests.vehicleVin,
        lotNumber: bidRequests.lotNumber,
        bidId: bidRequests.bidId,
        createdAt: bidRequests.createdAt,
        updatedAt: bidRequests.updatedAt,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(bidRequests)
      .leftJoin(users, eq(bidRequests.userId, users.id))
      .where(eq(bidRequests.id, id));

    if (!bidRequest) {
      return NextResponse.json({ success: false, error: 'Bid request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, bidRequest });
  } catch (error) {
    console.error('Error fetching bid request:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bid request' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      adminNotes,
      rejectionReason,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleVin,
      lotNumber,
    } = body;

    // Get the current bid request
    const [currentRequest] = await db
      .select()
      .from(bidRequests)
      .where(eq(bidRequests.id, id));

    if (!currentRequest) {
      return NextResponse.json({ success: false, error: 'Bid request not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (vehicleYear !== undefined) updateData.vehicleYear = vehicleYear;
    if (vehicleMake !== undefined) updateData.vehicleMake = vehicleMake;
    if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel;
    if (vehicleVin !== undefined) updateData.vehicleVin = vehicleVin;
    if (lotNumber !== undefined) updateData.lotNumber = lotNumber;

    // Update the bid request
    const [updated] = await db
      .update(bidRequests)
      .set(updateData)
      .where(eq(bidRequests.id, id))
      .returning();

    // Send notification and create records based on status change
    const statusChanged = status && status !== currentRequest.status;
    const isWonAndNeedsProcessing = status === 'won' && !currentRequest.bidId;

    console.log('Bid request update:', {
      id,
      status,
      currentStatus: currentRequest.status,
      bidId: currentRequest.bidId,
      statusChanged,
      isWonAndNeedsProcessing
    });

    if (statusChanged || isWonAndNeedsProcessing) {
      const vehicleName = `${currentRequest.vehicleYear || ''} ${currentRequest.vehicleMake || ''} ${currentRequest.vehicleModel || ''}`.trim() || 'your vehicle';
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'bid_placed':
          notificationTitle = 'Bid Placed Successfully';
          notificationMessage = `We have placed your bid for ${vehicleName}. We'll notify you once the auction ends.`;
          break;
        case 'won':
          console.log('Processing won status for bid request:', id);
          notificationTitle = 'Congratulations! You Won the Auction';
          notificationMessage = `Great news! Your bid for ${vehicleName} was successful. Check your dashboard for next steps.`;

          // Check if already processed (has a bidId)
          if (currentRequest.bidId) {
            console.log('Bid request already processed as won, skipping vehicle/bid/shipment creation');
            break;
          }

          console.log('Creating vehicle, bid, and shipment...');
          // Create a vehicle record for the shipment
          const [newVehicle] = await db.insert(vehicles).values({
            auctionSource: currentRequest.auctionSource || 'copart',
            lotNumber: currentRequest.lotNumber || 'N/A',
            vin: currentRequest.vehicleVin || 'N/A',
            year: currentRequest.vehicleYear || 0,
            make: currentRequest.vehicleMake || 'Unknown',
            model: currentRequest.vehicleModel || 'Unknown',
          }).returning();

          // Create a bid record (required for shipment FK constraint)
          const [newBid] = await db.insert(bids).values({
            userId: currentRequest.userId,
            vehicleId: newVehicle.id,
            maxBidAmount: currentRequest.maxBidAmount,
            status: 'won',
            finalBidAmount: currentRequest.maxBidAmount,
            wonAt: new Date(),
          }).returning();

          // Link the bid request to the bid
          await db.update(bidRequests).set({
            bidId: newBid.id
          }).where(eq(bidRequests.id, id));

          // Create shipment
          const [newShipment] = await db.insert(shipments).values({
            userId: currentRequest.userId,
            vehicleId: newVehicle.id,
            bidId: newBid.id,
            status: 'auction_won',
            trackingHistory: [{
              status: 'auction_won',
              location: '',
              timestamp: new Date().toISOString(),
              notes: 'Auction won - awaiting payment',
            }],
          }).returning();
          console.log('Created shipment:', newShipment.id);
          break;
        case 'lost':
          notificationTitle = 'Auction Result: Outbid';
          notificationMessage = `Unfortunately, we were outbid on ${vehicleName}. You can submit another bid request.`;
          break;
        case 'rejected':
          notificationTitle = 'Bid Request Rejected';
          notificationMessage = `Your bid request for ${vehicleName} has been rejected. Reason: ${rejectionReason || 'Not specified'}`;
          break;
      }

      // Only send notification if status actually changed (not on retry)
      if (notificationTitle && statusChanged) {
        await sendNotification({
          userId: currentRequest.userId,
          type: 'bid_request_update',
          title: notificationTitle,
          message: notificationMessage,
          channels: ['in_app', 'email'],
          relatedEntityType: 'bid_request',
          relatedEntityId: id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      bidRequest: updated,
      message: 'Bid request updated successfully',
    });
  } catch (error) {
    console.error('Error updating bid request:', error);
    return NextResponse.json({ success: false, error: 'Failed to update bid request' }, { status: 500 });
  }
}
