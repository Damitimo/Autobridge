import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleLookups } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch user's vehicle lookup history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const lookups = await db
      .select()
      .from(vehicleLookups)
      .where(eq(vehicleLookups.userId, user.id))
      .orderBy(desc(vehicleLookups.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      lookups,
    });
  } catch (error) {
    console.error('Vehicle lookups fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle lookups' },
      { status: 500 }
    );
  }
}

// POST - Save a new vehicle lookup
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { vehicle, auctionUrl } = body;

    if (!vehicle || !auctionUrl) {
      return NextResponse.json(
        { error: 'Vehicle data and auction URL are required' },
        { status: 400 }
      );
    }

    // Check if this lot was already looked up by this user
    const existing = await db
      .select()
      .from(vehicleLookups)
      .where(eq(vehicleLookups.userId, user.id))
      .limit(100);

    const existingLookup = existing.find(
      l => l.lotNumber === vehicle.lotNumber && l.source === vehicle.source
    );

    if (existingLookup) {
      // Update existing lookup with fresh data
      await db
        .update(vehicleLookups)
        .set({
          title: vehicle.title,
          currentBid: vehicle.currentBid?.toString(),
          imageUrl: vehicle.imageUrl || vehicle.images?.[0],
          images: vehicle.images,
          location: vehicle.location,
          damageType: vehicle.damageType,
          odometer: vehicle.odometer,
          auctionDate: vehicle.auctionDate,
          auctionDateTime: vehicle.auctionDateTime ? new Date(vehicle.auctionDateTime) : null,
          vehicleData: vehicle,
          updatedAt: new Date(),
        })
        .where(eq(vehicleLookups.id, existingLookup.id));

      return NextResponse.json({
        success: true,
        message: 'Lookup updated',
        lookupId: existingLookup.id,
      });
    }

    // Create new lookup
    const [newLookup] = await db
      .insert(vehicleLookups)
      .values({
        userId: user.id,
        lotNumber: vehicle.lotNumber,
        source: vehicle.source || 'copart',
        auctionUrl,
        title: vehicle.title,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
        imageUrl: vehicle.imageUrl || vehicle.images?.[0],
        images: vehicle.images,
        currentBid: vehicle.currentBid?.toString(),
        location: vehicle.location,
        damageType: vehicle.damageType,
        odometer: vehicle.odometer,
        titleStatus: vehicle.titleStatus,
        auctionDate: vehicle.auctionDate,
        auctionDateTime: vehicle.auctionDateTime ? new Date(vehicle.auctionDateTime) : null,
        vehicleData: vehicle,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Lookup saved',
      lookupId: newLookup.id,
    });
  } catch (error) {
    console.error('Save vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to save vehicle lookup' },
      { status: 500 }
    );
  }
}
