import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, bids, vehicles } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

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

    // Get user's invoices with related data
    const userInvoices = await db
      .select({
        invoice: invoices,
        bid: bids,
        vehicle: vehicles,
      })
      .from(invoices)
      .leftJoin(bids, eq(invoices.bidId, bids.id))
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .where(eq(invoices.userId, user.id))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({
      success: true,
      data: userInvoices.map(({ invoice, bid, vehicle }) => ({
        ...invoice,
        bid: bid ? {
          id: bid.id,
          maxBidAmount: bid.maxBidAmount,
          finalBidAmount: bid.finalBidAmount,
          status: bid.status,
        } : null,
        vehicle: vehicle ? {
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          imageUrl: vehicle.thumbnailUrl || (vehicle.images && vehicle.images[0]) || null,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
