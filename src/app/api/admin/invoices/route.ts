import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users, bids, vehicles } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(invoices.status, status as any));
    }

    if (type) {
      conditions.push(eq(invoices.type, type as any));
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get invoices with user and vehicle info
    const invoicesList = await db
      .select({
        invoice: invoices,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        vehicle: {
          year: vehicles.year,
          make: vehicles.make,
          model: vehicles.model,
          vin: vehicles.vin,
        },
      })
      .from(invoices)
      .leftJoin(users, eq(invoices.userId, users.id))
      .leftJoin(bids, eq(invoices.bidId, bids.id))
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    // Get stats
    const [stats] = await db
      .select({
        total: count(),
        pending: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'pending')`,
        paid: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'paid')`,
        overdue: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'overdue')`,
        cancelled: sql<number>`COUNT(*) FILTER (WHERE ${invoices.status} = 'cancelled')`,
        totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        paidAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
      })
      .from(invoices);

    return NextResponse.json({
      success: true,
      invoices: invoicesList,
      stats: {
        total: stats.total,
        pending: Number(stats.pending),
        paid: Number(stats.paid),
        overdue: Number(stats.overdue),
        cancelled: Number(stats.cancelled),
        totalAmount: Number(stats.totalAmount),
        paidAmount: Number(stats.paidAmount),
      },
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit),
      },
    });
  } catch (error) {
    console.error('Admin invoices fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// Create invoice
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userId, type, amount, currency, description, lineItems, dueDate, bidId, shipmentId } = body;

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [invoice] = await db
      .insert(invoices)
      .values({
        userId,
        type,
        amount: amount.toString(),
        currency: currency || 'USD',
        description,
        lineItems,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        bidId,
        shipmentId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Admin invoice create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
