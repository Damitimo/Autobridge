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

    // Get pending and withdrawn bid requests only (actionable items for admin)
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
        or(
          eq(bidRequests.status, 'pending'),
          eq(bidRequests.status, 'withdrawn')
        )
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

      if (req.status === 'pending') {
        title = 'New Bid Request';
        message = `${req.userFirstName} ${req.userLastName} submitted a bid request for ${vehicleName} - Max bid: $${parseFloat(req.maxBidAmount).toLocaleString()}`;
      } else if (req.status === 'withdrawn') {
        title = 'Bid Request Withdrawn';
        message = `${req.userFirstName} ${req.userLastName} withdrew their bid request for ${vehicleName}`;
      }

      return {
        id: req.id,
        type: 'bid_request',
        title,
        message,
        createdAt: req.createdAt,
        isRead: false,
      };
    });

    // All are unread since they're actionable
    const unreadCount = notifications.length;

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
