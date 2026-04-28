import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vehicleLookups } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3001';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'your-secret-key';

// POST - Refresh a vehicle lookup (re-scrape to get updated bid)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the lookup
    const [lookup] = await db
      .select()
      .from(vehicleLookups)
      .where(
        and(
          eq(vehicleLookups.id, params.id),
          eq(vehicleLookups.userId, user.id)
        )
      )
      .limit(1);

    if (!lookup) {
      return NextResponse.json({ error: 'Lookup not found' }, { status: 404 });
    }

    // Call scraper to get fresh data
    const scraperEndpoint = lookup.source === 'copart' ? '/scrape/copart' : '/scrape/iaai';

    const scraperResponse = await fetch(`${SCRAPER_URL}${scraperEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SCRAPER_API_KEY,
      },
      body: JSON.stringify({ url: lookup.auctionUrl }),
    });

    if (!scraperResponse.ok) {
      const errorData = await scraperResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to refresh vehicle data' },
        { status: scraperResponse.status }
      );
    }

    const scraperData = await scraperResponse.json();
    const vehicle = scraperData.vehicle;

    // Update the lookup with fresh data
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
      .where(eq(vehicleLookups.id, params.id));

    // Fetch updated record
    const [updated] = await db
      .select()
      .from(vehicleLookups)
      .where(eq(vehicleLookups.id, params.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Vehicle data refreshed',
      lookup: updated,
    });
  } catch (error) {
    console.error('Refresh vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh vehicle data' },
      { status: 500 }
    );
  }
}
