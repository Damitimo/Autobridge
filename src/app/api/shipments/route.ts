import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, bids, vehicles } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

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
    
    // Get user's shipments with vehicle and bid details
    const userShipments = await db
      .select({
        shipment: shipments,
        vehicle: vehicles,
        bid: bids,
      })
      .from(shipments)
      .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
      .leftJoin(bids, eq(shipments.bidId, bids.id))
      .where(eq(shipments.userId, user.id))
      .orderBy(shipments.createdAt);
    
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
