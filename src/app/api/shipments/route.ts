import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, bids, vehicles } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Check for limit parameter
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get user's shipments with vehicle and bid details
    // Sort by updatedAt descending so recently updated shipments appear first
    let query = db
      .select({
        id: shipments.id,
        status: shipments.status,
        shippingMethod: shipments.shippingMethod,
        vesselName: shipments.vesselName,
        bookingNumber: shipments.bookingNumber,
        containerNumber: shipments.containerNumber,
        billOfLading: shipments.billOfLading,
        departurePort: shipments.departurePort,
        departedAt: shipments.departedAt,
        estimatedArrivalAt: shipments.estimatedArrivalAt,
        arrivedAt: shipments.arrivedAt,
        customsClearedAt: shipments.customsClearedAt,
        deliveredAt: shipments.deliveredAt,
        trackingHistory: shipments.trackingHistory,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        vehicle: {
          id: vehicles.id,
          year: vehicles.year,
          make: vehicles.make,
          model: vehicles.model,
          vin: vehicles.vin,
          lotNumber: vehicles.lotNumber,
        },
        bid: {
          id: bids.id,
          maxBidAmount: bids.maxBidAmount,
          finalBidAmount: bids.finalBidAmount,
          status: bids.status,
        },
      })
      .from(shipments)
      .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
      .leftJoin(bids, eq(shipments.bidId, bids.id))
      .where(eq(shipments.userId, user.id))
      .orderBy(desc(shipments.updatedAt));

    // Apply limit if specified
    const userShipments = limit ? await query.limit(limit) : await query;

    return NextResponse.json({
      success: true,
      data: userShipments,
    });
    
  } catch (error) {
    console.error('Shipments fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
