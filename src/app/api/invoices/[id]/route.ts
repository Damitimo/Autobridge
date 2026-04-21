import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, bids, vehicles, shipments } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get invoice with related data
    const [result] = await db
      .select({
        invoice: invoices,
        bid: bids,
        vehicle: vehicles,
        shipment: shipments,
      })
      .from(invoices)
      .leftJoin(bids, eq(invoices.bidId, bids.id))
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .leftJoin(shipments, eq(invoices.shipmentId, shipments.id))
      .where(and(eq(invoices.id, params.id), eq(invoices.userId, user.id)))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const { invoice, bid, vehicle, shipment } = result;

    return NextResponse.json({
      success: true,
      data: {
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
          lotNumber: vehicle.lotNumber,
        } : null,
        shipment: shipment ? {
          id: shipment.id,
          status: shipment.status,
        } : null,
      },
    });
  } catch (error) {
    console.error('Invoice fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
