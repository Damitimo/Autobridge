import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, bids, vehicles } from '@/db/schema';
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
        id: transactions.id,
        amount: transactions.amount,
        currency: transactions.currency,
        paymentMethod: transactions.paymentMethod,
        paymentStatus: transactions.paymentStatus,
        paymentReference: transactions.paymentReference,
        vehiclePrice: transactions.vehiclePrice,
        auctionFees: transactions.auctionFees,
        platformFee: transactions.platformFee,
        shippingCost: transactions.shippingCost,
        customsDuty: transactions.customsDuty,
        otherFees: transactions.otherFees,
        paidAt: transactions.paidAt,
        createdAt: transactions.createdAt,
        // User info
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        // Bid info
        bidId: bids.id,
        bidStatus: bids.status,
        // Vehicle info
        vehicleYear: vehicles.year,
        vehicleMake: vehicles.make,
        vehicleModel: vehicles.model,
        vehicleVin: vehicles.vin,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(bids, eq(transactions.bidId, bids.id))
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(transactions.paymentStatus, status as any));
    }

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(transactions.paymentReference, `%${search}%`),
          like(vehicles.vin, `%${search}%`)
        )
      );
    }

    const transactionsList = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(transactions);
    const total = Number(countResult[0].count);

    // Get stats
    const stats = await db
      .select({
        status: transactions.paymentStatus,
        count: sql`count(*)`,
        total: sql`sum(${transactions.amount})`,
      })
      .from(transactions)
      .groupBy(transactions.paymentStatus);

    return NextResponse.json({
      success: true,
      transactions: transactionsList,
      stats: stats.reduce((acc, s) => ({
        ...acc,
        [s.status]: { count: Number(s.count), total: Number(s.total) || 0 },
      }), {}),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin payments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
