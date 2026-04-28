import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, bidRequests, shipments } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and, count, inArray, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get total bids count (bids + bid requests)
    const totalBidsResult = await db
      .select({ count: count() })
      .from(bids)
      .where(eq(bids.userId, user.id));

    const totalBidRequestsResult = await db
      .select({ count: count() })
      .from(bidRequests)
      .where(eq(bidRequests.userId, user.id));

    // Get won bids count (bids + bid requests with status 'won')
    const wonBidsResult = await db
      .select({ count: count() })
      .from(bids)
      .where(and(eq(bids.userId, user.id), eq(bids.status, 'won')));

    const wonBidRequestsResult = await db
      .select({ count: count() })
      .from(bidRequests)
      .where(and(eq(bidRequests.userId, user.id), eq(bidRequests.status, 'won')));

    // Get active shipments count (not delivered)
    const activeShipmentsResult = await db
      .select({ count: count() })
      .from(shipments)
      .where(
        and(
          eq(shipments.userId, user.id),
          // Not delivered status
          inArray(shipments.status, [
            'auction_won',
            'payment_received',
            'pickup_scheduled',
            'in_transit_to_port',
            'at_us_port',
            'loaded_on_vessel',
            'vessel_departed',
            'vessel_in_transit',
            'vessel_arrived_nigeria',
            'customs_clearance',
            'customs_cleared',
            'ready_for_pickup',
            'in_transit_to_customer',
          ])
        )
      );

    // Get delivered vehicles count
    const deliveredResult = await db
      .select({ count: count() })
      .from(shipments)
      .where(and(eq(shipments.userId, user.id), eq(shipments.status, 'delivered')));

    return NextResponse.json({
      success: true,
      stats: {
        totalBids: (totalBidsResult[0]?.count || 0) + (totalBidRequestsResult[0]?.count || 0),
        wonBids: (wonBidsResult[0]?.count || 0) + (wonBidRequestsResult[0]?.count || 0),
        activeShipments: activeShipmentsResult[0]?.count || 0,
        deliveredVehicles: deliveredResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
