import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, bids, shipments, invoices, walletTransactions } from '@/db/schema';
import { eq, count, sql, and, gte } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      totalUsersResult,
      pendingKycResult,
      verifiedKycResult,
      totalBidsResult,
      activeBidsResult,
      wonBidsResult,
      totalShipmentsResult,
      activeShipmentsResult,
      deliveredShipmentsResult,
      recentUsersResult,
      recentBidsResult,
      recentShipmentsResult,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(users),

      // Pending KYC
      db.select({ count: count() }).from(users).where(eq(users.kycStatus, 'pending')),

      // Verified KYC
      db.select({ count: count() }).from(users).where(eq(users.kycStatus, 'verified')),

      // Total bids
      db.select({ count: count() }).from(bids),

      // Active bids (pending)
      db.select({ count: count() }).from(bids).where(eq(bids.status, 'pending')),

      // Won bids
      db.select({ count: count() }).from(bids).where(eq(bids.status, 'won')),

      // Total shipments
      db.select({ count: count() }).from(shipments),

      // Active shipments (not delivered)
      db.select({ count: count() }).from(shipments).where(
        sql`${shipments.status} != 'delivered'`
      ),

      // Delivered shipments
      db.select({ count: count() }).from(shipments).where(eq(shipments.status, 'delivered')),

      // Recent users (last 7 days)
      db.select({ count: count() }).from(users).where(
        gte(users.createdAt, sevenDaysAgo)
      ),

      // Recent bids (last 7 days)
      db.select({ count: count() }).from(bids).where(
        gte(bids.createdAt, sevenDaysAgo)
      ),

      // Recent shipments (last 30 days)
      db.select({ count: count() }).from(shipments).where(
        gte(shipments.createdAt, thirtyDaysAgo)
      ),
    ]);

    // Get recent activity
    const recentUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        kycStatus: users.kycStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(5);

    const recentBidsData = await db
      .select({
        id: bids.id,
        status: bids.status,
        maxBidAmount: bids.maxBidAmount,
        createdAt: bids.createdAt,
        userId: bids.userId,
      })
      .from(bids)
      .orderBy(sql`${bids.createdAt} DESC`)
      .limit(5);

    // Get shipments by status for chart
    const shipmentsByStatus = await db
      .select({
        status: shipments.status,
        count: count(),
      })
      .from(shipments)
      .groupBy(shipments.status);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsersResult[0].count,
          pendingKyc: pendingKycResult[0].count,
          verifiedKyc: verifiedKycResult[0].count,
          newThisWeek: recentUsersResult[0].count,
        },
        bids: {
          total: totalBidsResult[0].count,
          active: activeBidsResult[0].count,
          won: wonBidsResult[0].count,
          newThisWeek: recentBidsResult[0].count,
        },
        shipments: {
          total: totalShipmentsResult[0].count,
          active: activeShipmentsResult[0].count,
          delivered: deliveredShipmentsResult[0].count,
          newThisMonth: recentShipmentsResult[0].count,
          byStatus: shipmentsByStatus,
        },
      },
      recentActivity: {
        users: recentUsers,
        bids: recentBidsData,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
