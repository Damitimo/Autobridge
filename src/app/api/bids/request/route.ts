import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { z } from 'zod';

const bidRequestSchema = z.object({
  auctionLink: z.string().url(),
  maxBidAmount: z.number().positive(),
  notes: z.string().optional(),
  // Vehicle data from scraper
  vehicleData: z.object({
    year: z.number().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
    vin: z.string().optional(),
    lotNumber: z.string().optional(),
    imageUrl: z.string().optional(),
    location: z.string().optional(),
    damageType: z.string().optional(),
    currentBid: z.number().optional(),
  }).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // Check signup fee
    if (!user.signupFeePaid) {
      return NextResponse.json(
        { error: 'Please pay the ₦100,000 signup fee to start requesting bids' },
        { status: 403 }
      );
    }

    // Parse request
    const body = await request.json();
    const validated = bidRequestSchema.parse(body);

    // Validate auction link is from Copart or IAAI
    const url = validated.auctionLink.toLowerCase();
    if (!url.includes('copart.com') && !url.includes('iaai.com')) {
      return NextResponse.json(
        { error: 'Please provide a valid Copart or IAAI auction link' },
        { status: 400 }
      );
    }

    // Determine auction source
    const auctionSource = url.includes('copart.com') ? 'copart' : 'iaai';

    // Store the bid request in the database with vehicle data
    const vehicleData = validated.vehicleData;
    const [newRequest] = await db.insert(bidRequests).values({
      userId: user.id,
      auctionLink: validated.auctionLink,
      auctionSource,
      maxBidAmount: validated.maxBidAmount.toString(),
      notes: validated.notes || null,
      status: 'pending',
      // Vehicle info from scraper
      vehicleYear: vehicleData?.year || null,
      vehicleMake: vehicleData?.make || null,
      vehicleModel: vehicleData?.model || null,
      vehicleVin: vehicleData?.vin || null,
      lotNumber: vehicleData?.lotNumber || null,
      vehicleImageUrl: vehicleData?.imageUrl || null,
      vehicleLocation: vehicleData?.location || null,
      vehicleDamageType: vehicleData?.damageType || null,
      currentBid: vehicleData?.currentBid?.toString() || null,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'Bid request submitted successfully',
      data: {
        id: newRequest.id,
        auctionSource: auctionSource.toUpperCase(),
        maxBidAmount: validated.maxBidAmount,
        status: 'pending',
        estimatedResponse: '2-4 hours',
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Bid request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
