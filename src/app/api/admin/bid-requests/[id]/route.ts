import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .where(eq(bidRequests.id, params.id));

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
  { params }: { params: { id: string } }
) {
  try {
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
      .where(eq(bidRequests.id, params.id));

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
      .where(eq(bidRequests.id, params.id))
      .returning();

    // Send notification to user based on status change
    if (status && status !== currentRequest.status) {
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'bid_placed':
          notificationTitle = 'Bid Placed Successfully';
          notificationMessage = `We have placed your bid. We'll notify you once the auction ends.`;
          break;
        case 'won':
          notificationTitle = 'Congratulations! You Won the Auction';
          notificationMessage = `Great news! Your bid was successful. Check your dashboard for next steps.`;
          break;
        case 'lost':
          notificationTitle = 'Auction Result: Outbid';
          notificationMessage = `Unfortunately, we were outbid on this vehicle. You can submit another bid request.`;
          break;
        case 'rejected':
          notificationTitle = 'Bid Request Rejected';
          notificationMessage = `Your bid request has been rejected. Reason: ${rejectionReason || 'Not specified'}`;
          break;
      }

      if (notificationTitle) {
        await db.insert(notifications).values({
          userId: currentRequest.userId,
          type: 'bid_request_update',
          title: notificationTitle,
          message: notificationMessage,
          relatedEntityType: 'bid_request',
          relatedEntityId: params.id,
          channels: ['in_app', 'email'],
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
