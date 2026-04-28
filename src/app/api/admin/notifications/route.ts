import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, users } from '@/db/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get recent bid requests as notifications (last 7 days)
    const recentBidRequests = await db
      .select({
        id: bidRequests.id,
        status: bidRequests.status,
        maxBidAmount: bidRequests.maxBidAmount,
        vehicleYear: bidRequests.vehicleYear,
        vehicleMake: bidRequests.vehicleMake,
        vehicleModel: bidRequests.vehicleModel,
        createdAt: bidRequests.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(bidRequests)
      .leftJoin(users, eq(bidRequests.userId, users.id))
      .where(
        sql`${bidRequests.createdAt} > NOW() - INTERVAL '7 days'`
      )
      .orderBy(desc(bidRequests.createdAt))
      .limit(20);

    // Transform to notification format
    const notifications = recentBidRequests.map((req) => {
      const vehicleName = req.vehicleYear && req.vehicleMake
        ? `${req.vehicleYear} ${req.vehicleMake} ${req.vehicleModel || ''}`
        : 'a vehicle';

      let title = '';
      let message = '';

      switch (req.status) {
        case 'pending':
          title = 'New Bid Request';
          message = `${req.userFirstName} ${req.userLastName} submitted a bid request for ${vehicleName} - Max bid: $${parseFloat(req.maxBidAmount).toLocaleString()}`;
          break;
        case 'withdrawn':
          title = 'Bid Request Withdrawn';
          message = `${req.userFirstName} ${req.userLastName} withdrew their bid request for ${vehicleName}`;
          break;
        default:
          title = `Bid Request ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}`;
          message = `Bid request for ${vehicleName} by ${req.userFirstName} ${req.userLastName}`;
      }

      return {
        id: req.id,
        type: 'bid_request',
        title,
        message,
        createdAt: req.createdAt,
        isRead: req.status !== 'pending' && req.status !== 'withdrawn', // Unread if pending or withdrawn
      };
    });

    // Count unread (pending + withdrawn requests)
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error('Admin notifications error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
