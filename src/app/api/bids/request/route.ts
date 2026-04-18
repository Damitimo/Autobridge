import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const bidRequestSchema = z.object({
  auctionLink: z.string().url(),
  maxBidAmount: z.number().positive(),
  notes: z.string().optional(),
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
    const auctionSource = url.includes('copart.com') ? 'Copart' : 'IAAI';

    // For MVP: Store the request in a simple way
    // In production, this would go to a bid_requests table
    // For now, we'll log it and return success
    console.log('New bid request:', {
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      auctionLink: validated.auctionLink,
      auctionSource,
      maxBidAmount: validated.maxBidAmount,
      notes: validated.notes,
      createdAt: new Date().toISOString(),
    });

    // TODO: In production:
    // 1. Store in bid_requests table
    // 2. Send notification to admin
    // 3. Create a task for the operations team

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Bid request submitted successfully',
      data: {
        auctionSource,
        maxBidAmount: validated.maxBidAmount,
        status: 'pending_review',
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
