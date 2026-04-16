import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, users, vehicles } from '@/db/schema';
import { eq, desc, sql, like, or } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

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

    // Build base query
    let query = db
      .select({
        id: bids.id,
        status: bids.status,
        maxBidAmount: bids.maxBidAmount,
        currentBidAmount: bids.currentBidAmount,
        finalBidAmount: bids.finalBidAmount,
        depositAmount: bids.depositAmount,
        depositLocked: bids.depositLocked,
        externalBidId: bids.externalBidId,
        externalSource: bids.externalSource,
        externalStatus: bids.externalStatus,
        wonAt: bids.wonAt,
        createdAt: bids.createdAt,
        updatedAt: bids.updatedAt,
        // User info
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        // Vehicle info
        vehicleId: vehicles.id,
        vehicleYear: vehicles.year,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
        vehicleVin: vehicles.vin,
        lotNumber: vehicles.lotNumber,
        auctionDate: vehicles.auctionDate,
      })
      .from(bids)
      .leftJoin(users, eq(bids.userId, users.id))
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .orderBy(desc(bids.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(bids.status, status as any));
    }

    if (search) {
      conditions.push(
        or(
          like(vehicles.vin, `%${search}%`),
          like(users.email, `%${search}%`),
          like(bids.externalBidId, `%${search}%`),
          like(vehicles.lotNumber, `%${search}%`)
        )
      );
    }

    const bidsList = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(bids);
    const total = Number(countResult[0].count);

    return NextResponse.json({
      success: true,
      bids: bidsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin bids fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}
