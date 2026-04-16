import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, users, vehicles, bids } from '@/db/schema';
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
        id: shipments.id,
        status: shipments.status,
        shippingMethod: shipments.shippingMethod,
        vesselName: shipments.vesselName,
        bookingNumber: shipments.bookingNumber,
        estimatedArrivalAt: shipments.estimatedArrivalAt,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        statusUpdatedAt: shipments.statusUpdatedAt,
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
        // Bid info
        bidAmount: bids.finalBidAmount,
      })
      .from(shipments)
      .leftJoin(users, eq(shipments.userId, users.id))
      .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
      .leftJoin(bids, eq(shipments.bidId, bids.id))
      .orderBy(desc(shipments.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(shipments.status, status as any));
    }

    if (search) {
      conditions.push(
        or(
          like(vehicles.vin, `%${search}%`),
          like(users.email, `%${search}%`),
          like(shipments.bookingNumber, `%${search}%`)
        )
      );
    }

    const shipmentsList = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await query;

    // Get total count
    const countResult = await db.select({ count: sql`count(*)` }).from(shipments);
    const total = Number(countResult[0].count);

    return NextResponse.json({
      success: true,
      shipments: shipmentsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin shipments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}
