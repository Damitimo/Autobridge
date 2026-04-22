import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Scraper service URL (Railway)
const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3001';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'your-secret-key';

async function getAuthenticatedUser(request: NextRequest) {
  // Try JWT token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token !== 'null' && token !== 'undefined') {
      const user = await getUserFromToken(token);
      if (user) return user;
    }
  }

  // Try NextAuth session cookie
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value ||
                         cookieStore.get('__Secure-next-auth.session-token')?.value;

    if (sessionToken) {
      const decoded = jwt.decode(sessionToken) as any;
      if (decoded?.email) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, decoded.email))
          .limit(1);

        if (dbUser.length > 0) return dbUser[0];
      }
    }
  } catch (error) {
    console.error('Session decode error:', error);
  }

  // Try cookie header directly
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const sessionMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
    if (sessionMatch) {
      try {
        const decoded = jwt.decode(sessionMatch[1]) as any;
        if (decoded?.email) {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, decoded.email))
            .limit(1);

          if (dbUser.length > 0) return dbUser[0];
        }
      } catch (e) {
        // Continue
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in again.' }, { status: 401 });
    }

    const body = await request.json();
    const { auctionLink } = body;

    if (!auctionLink) {
      return NextResponse.json({ error: 'Auction link is required' }, { status: 400 });
    }

    const url = auctionLink.toLowerCase();
    const isCopart = url.includes('copart.com');
    const isIaai = url.includes('iaai.com');

    if (!isCopart && !isIaai) {
      return NextResponse.json(
        { error: 'Please provide a valid Copart or IAAI link' },
        { status: 400 }
      );
    }

    // Extract lot number from URL
    let lotNumber = '';
    if (isCopart) {
      const match = auctionLink.match(/lot\/(\d+)/i);
      lotNumber = match ? match[1] : '';
    } else {
      const match = auctionLink.match(/itemID=(\d+)/i) || auctionLink.match(/\/(\d+)(?:\?|$)/);
      lotNumber = match ? match[1] : '';
    }

    if (!lotNumber) {
      return NextResponse.json(
        { error: 'Could not extract lot number from URL' },
        { status: 400 }
      );
    }

    let vehicle;
    if (isCopart) {
      console.log('Calling scraper service for lot:', lotNumber);

      // Call external scraper service
      const scraperResponse = await fetch(`${SCRAPER_URL}/scrape/copart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': SCRAPER_API_KEY,
        },
        body: JSON.stringify({ url: auctionLink }),
      });

      const scraperData = await scraperResponse.json();

      if (!scraperResponse.ok) {
        console.error('Scraper error:', scraperData);
        return NextResponse.json(
          { error: scraperData.error || 'Failed to fetch vehicle details' },
          { status: scraperResponse.status }
        );
      }

      vehicle = scraperData.vehicle;
      console.log('Scrape complete:', vehicle.title);
      console.log('Auction date:', vehicle.auctionDate, '| DateTime:', vehicle.auctionDateTime);
      console.log('Location:', vehicle.location);
    } else {
      return NextResponse.json(
        { error: 'IAAI lookup coming soon. Please use Copart links for now.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle,
      message: 'Vehicle details fetched successfully',
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle details. Please try again.' },
      { status: 500 }
    );
  }
}
