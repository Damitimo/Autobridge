import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users, bids, vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const [result] = await db
      .select({
        invoice: invoices,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
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
      .where(eq(invoices.id, params.id))
      .limit(1);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Admin invoice fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, notes, paidAt } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'paid' && !paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt);
    }

    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice: updated,
    });
  } catch (error) {
    console.error('Admin invoice update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
