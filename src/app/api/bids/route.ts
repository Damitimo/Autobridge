import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, vehicles, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { checkBidEligibility, lockDepositForBid } from '@/lib/wallet';
import { sendNotification, NotificationTemplates } from '@/lib/notifications';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createBidSchema = z.object({
  vehicleId: z.string(),
  maxBidAmount: z.number().positive(),
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
        { error: 'Please pay ₦100,000 signup fee to start bidding', message: 'Signup fee required' },
        { status: 403 }
      );
    }
    
    // Check KYC status (optional for MVP - comment out if not ready)
    // if (user.kycStatus !== 'verified') {
    //   return NextResponse.json(
    //     { error: 'KYC verification required before bidding' },
    //     { status: 403 }
    //   );
    // }
    
    // Parse request
    const body = await request.json();
    const validated = createBidSchema.parse(body);
    
    // Get vehicle
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, validated.vehicleId))
      .limit(1);
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }
    
    // Check if auction is still active - DISABLED FOR TESTING
    // if (vehicle.auctionDate && new Date(vehicle.auctionDate) < new Date()) {
    //   return NextResponse.json(
    //     { error: 'Auction has already ended' },
    //     { status: 400 }
    //   );
    // }
    
    // Check wallet eligibility (10% deposit rule)
    const eligibility = await checkBidEligibility(user.id, validated.maxBidAmount);
    if (!eligibility.eligible) {
      return NextResponse.json({
        error: `Insufficient wallet balance. Need $${eligibility.requiredDeposit.toFixed(2)} deposit (10%), you have $${eligibility.availableBalance.toFixed(2)}. Please fund your wallet.`,
        message: 'Insufficient balance',
        required: eligibility.requiredDeposit,
        available: eligibility.availableBalance,
        shortfall: eligibility.shortfall,
      }, { status: 403 });
    }
    
    // Check if user already has a bid on this vehicle
    const existingBid = await db
      .select()
      .from(bids)
      .where(
        and(
          eq(bids.userId, user.id),
          eq(bids.vehicleId, validated.vehicleId),
          eq(bids.status, 'pending')
        )
      )
      .limit(1);
    
    if (existingBid.length > 0) {
      // Update existing bid
      const [updatedBid] = await db
        .update(bids)
        .set({
          maxBidAmount: validated.maxBidAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(bids.id, existingBid[0].id))
        .returning();
      
      return NextResponse.json({
        success: true,
        data: updatedBid,
        message: 'Bid updated successfully',
      });
    }
    
    // Create new bid
    const [newBid] = await db
      .insert(bids)
      .values({
        userId: user.id,
        vehicleId: validated.vehicleId,
        maxBidAmount: validated.maxBidAmount.toString(),
        currentBidAmount: vehicle.currentBid,
        status: 'pending',
      })
      .returning();
    
    // Lock 10% deposit in wallet
    try {
      await lockDepositForBid(user.id, newBid.id, validated.maxBidAmount);
    } catch (walletError) {
      // If deposit locking fails, delete the bid
      await db.delete(bids).where(eq(bids.id, newBid.id));
      throw walletError;
    }
    
    // Send notification
    await sendNotification({
      userId: user.id,
      type: 'bid_placed',
      title: 'Bid Placed Successfully',
      message: `Your bid of $${validated.maxBidAmount.toLocaleString()} has been placed for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      channels: ['in_app', 'email'],
      relatedEntityType: 'bid',
      relatedEntityId: newBid.id,
    });
    
    return NextResponse.json({
      success: true,
      data: newBid,
      message: 'Bid placed successfully',
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Bid creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    // Get user's bids with vehicle details
    const userBids = await db
      .select({
        bid: bids,
        vehicle: vehicles,
      })
      .from(bids)
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .where(eq(bids.userId, user.id))
      .orderBy(bids.createdAt);
    
    return NextResponse.json({
      success: true,
      data: userBids,
    });
    
  } catch (error) {
    console.error('Bids fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
