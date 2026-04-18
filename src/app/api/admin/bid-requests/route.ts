import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, users } from '@/db/schema';
import { eq, desc, sql, like, or, count } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query with user info
    let query = db
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
        // User info
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(bidRequests)
      .leftJoin(users, eq(bidRequests.userId, users.id))
      .orderBy(desc(bidRequests.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(bidRequests.status, status as any));
    }

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(bidRequests.auctionLink, `%${search}%`),
          like(bidRequests.vehicleVin, `%${search}%`),
          like(bidRequests.lotNumber, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(sql`${conditions.reduce((acc, cond, i) => i === 0 ? cond : sql`${acc} AND ${cond}`, sql`TRUE`)}`);
    }

    const requests = await query;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: count() })
      .from(bidRequests);

    const [{ count: total }] = await totalQuery;

    // Get stats by status
    const statsQuery = await db
      .select({
        status: bidRequests.status,
        count: count(),
      })
      .from(bidRequests)
      .groupBy(bidRequests.status);

    const stats = statsQuery.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      requests,
      stats,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching bid requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bid requests' },
      { status: 500 }
    );
  }
}
