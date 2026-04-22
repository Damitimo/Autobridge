import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, wallets } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { lockFundsForBidRequest } from '@/lib/wallet';
import { eq } from 'drizzle-orm';
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

    // Check wallet balance - users need funds to cover their max bid (escrow model)
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id))
      .limit(1);

    const availableBalance = parseFloat(wallet?.availableBalance || '0');
    const maxBidAmount = validated.maxBidAmount;
    const depositRequired = maxBidAmount * 0.10; // 10% deposit

    if (availableBalance < depositRequired) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You need at least $${depositRequired.toLocaleString()} (10% deposit) to place this bid. Your available balance is $${availableBalance.toLocaleString()}. Please fund your wallet first.`,
          code: 'INSUFFICIENT_BALANCE',
          required: depositRequired,
          available: availableBalance,
        },
        { status: 400 }
      );
    }

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

    // Lock 10% deposit in user's wallet
    let lockedAmount = depositRequired;
    try {
      const result = await lockFundsForBidRequest(user.id, newRequest.id, maxBidAmount);
      lockedAmount = result.lockedAmount;
    } catch (lockError) {
      // If locking fails, delete the bid request and return error
      await db.delete(bidRequests).where(eq(bidRequests.id, newRequest.id));
      console.error('Failed to lock funds:', lockError);
      return NextResponse.json(
        { error: 'Failed to lock deposit. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Bid request submitted successfully. $${lockedAmount.toFixed(2)} (10% deposit) has been locked in your wallet.`,
      data: {
        id: newRequest.id,
        auctionSource: auctionSource.toUpperCase(),
        maxBidAmount: validated.maxBidAmount,
        lockedAmount: lockedAmount,
        depositPercentage: 10,
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
