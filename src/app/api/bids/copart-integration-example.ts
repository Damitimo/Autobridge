/**
 * Example: Integrating Your Existing Bid API with Copart
 * 
 * This shows how to modify your existing /api/bids/route.ts
 * to place real bids on Copart using your account credentials.
 * 
 * Copy the relevant parts into your actual route.ts file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, vehicles, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Import your Copart client (once you've configured it)
// import { createCopartClient } from '@/lib/copart-api';

const createBidSchema = z.object({
  vehicleId: z.string(),
  maxBidAmount: z.number().positive(),
});

/**
 * UPDATED POST Handler - Places real bids on Copart
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (existing code)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // 2. Check KYC status (existing code)
    if (user.kycStatus !== 'verified') {
      return NextResponse.json(
        { error: 'KYC verification required before bidding' },
        { status: 403 }
      );
    }
    
    // 3. Parse and validate request (existing code)
    const body = await request.json();
    const validated = createBidSchema.parse(body);
    
    // 4. Get vehicle from database (existing code)
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, validated.vehicleId))
      .limit(1);
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    // 5. Check auction hasn't ended (existing code)
    if (vehicle.auctionDate && new Date(vehicle.auctionDate) < new Date()) {
      return NextResponse.json(
        { error: 'Auction has already ended' },
        { status: 400 }
      );
    }
    
    // ========================================
    // NEW: Place bid on Copart
    // ========================================
    
    let copartBidId: string | null = null;
    let bidStatus: 'pending' | 'active' | 'failed';
    let errorMessage: string | null = null;
    
    // Initialize bidStatus
    bidStatus = 'pending';
    
    try {
      // Initialize Copart client with your credentials
      // Uncomment this once you have copart-api.ts configured:
      /*
      const copartClient = createCopartClient();
      
      // Place the bid on Copart
      const copartResult = await copartClient.placeBid({
        lotNumber: vehicle.lotNumber,
        maxBidAmount: validated.maxBidAmount,
        clientId: user.id, // Your internal reference
        proxyBid: true,
      });
      
      copartBidId = copartResult.bidId;
      bidStatus = copartResult.status as 'pending' | 'active' | 'failed';
      
      console.log('✅ Bid placed on Copart:', copartResult);
      */
      
      // TEMPORARY: For testing before API is ready
      // Remove this when you have real API access
      console.log('⚠️  DEMO MODE: Would place bid on Copart:', {
        lotNumber: vehicle.lotNumber,
        amount: validated.maxBidAmount,
        userId: user.id,
      });
      
      // Simulate success for demo
      copartBidId = `DEMO-${Date.now()}`;
      bidStatus = 'pending';
      
    } catch (error) {
      console.error('❌ Failed to place bid on Copart:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      bidStatus = 'failed';
      
      // Decide: Do you want to continue and save to DB even if Copart fails?
      // Option A: Fail the entire request
      return NextResponse.json(
        { 
          error: 'Failed to place bid with auction house',
          details: errorMessage 
        },
        { status: 500 }
      );
      
      // Option B: Save to DB anyway and retry later
      // (Comment out the return above and continue)
    }
    
    // ========================================
    // 6. Save bid to YOUR database
    // ========================================
    
    // Check for existing bid
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
    
    let savedBid;
    
    if (existingBid.length > 0) {
      // Update existing bid
      [savedBid] = await db
        .update(bids)
        .set({
          maxBidAmount: validated.maxBidAmount.toString(),
          // NEW: Store Copart's bid ID for tracking
          // You'll need to add this column to your schema:
          // externalBidId: copartBidId,
          // externalSource: 'copart',
          status: bidStatus,
          updatedAt: new Date(),
        })
        .where(eq(bids.id, existingBid[0].id))
        .returning();
      
    } else {
      // Create new bid
      [savedBid] = await db
        .insert(bids)
        .values({
          userId: user.id,
          vehicleId: validated.vehicleId,
          maxBidAmount: validated.maxBidAmount.toString(),
          currentBidAmount: vehicle.currentBid,
          status: bidStatus,
          // NEW: Store Copart reference
          // externalBidId: copartBidId,
          // externalSource: 'copart',
        })
        .returning();
    }
    
    // 7. Send notifications
    if (bidStatus === 'pending' || bidStatus === 'active') {
      await sendNotification({
        userId: user.id,
        type: 'bid_placed',
        title: 'Bid Placed Successfully',
        message: `Your bid of $${validated.maxBidAmount.toLocaleString()} has been placed on Copart for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        channels: ['in_app', 'email', 'sms'],
        relatedEntityType: 'bid',
        relatedEntityId: savedBid.id,
      });
    } else {
      await sendNotification({
        userId: user.id,
        type: 'bid_failed',
        title: 'Bid Placement Failed',
        message: `We couldn't place your bid. Please try again or contact support. Error: ${errorMessage}`,
        channels: ['in_app', 'email'],
      });
    }
    
    // 8. Return response
    const isSuccess = bidStatus === 'pending' || bidStatus === 'active';
    return NextResponse.json({
      success: isSuccess,
      data: {
        ...savedBid,
        copartBidId,
        copartStatus: bidStatus,
      },
      message: isSuccess
        ? 'Bid placed successfully on Copart'
        : 'Bid placement failed',
    }, { status: isSuccess ? 201 : 500 });
    
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

/**
 * Helper: Get bid status from Copart
 * Call this periodically to check if bid won/lost
 */
export async function checkCopartBidStatus(bidId: string) {
  try {
    // Uncomment when API is ready:
    /*
    const copartClient = createCopartClient();
    const status = await copartClient.getBidStatus(bidId);
    return status;
    */
    
    // Demo mode
    console.log('Would check bid status for:', bidId);
    return {
      bidId,
      status: 'pending',
      currentBid: 0,
    };
    
  } catch (error) {
    console.error('Failed to check bid status:', error);
    throw error;
  }
}

/**
 * Background Job: Check all pending bids
 * Run this every 5-10 minutes
 */
export async function syncBidStatuses() {
  console.log('🔄 Checking bid statuses with Copart...');
  
  // Get all pending bids with external IDs
  const pendingBids = await db
    .select()
    .from(bids)
    .where(eq(bids.status, 'pending'));
    // Add: and(eq(bids.externalBidId, not(null)))
  
  for (const bid of pendingBids) {
    // Skip if no external ID
    // if (!bid.externalBidId) continue;
    
    try {
      // Check status with Copart
      // const copartStatus = await checkCopartBidStatus(bid.externalBidId);
      
      // Update if status changed
      /*
      if (copartStatus.status !== bid.status) {
        await db.update(bids)
          .set({
            status: copartStatus.status,
            finalBidAmount: copartStatus.currentBid.toString(),
            updatedAt: new Date(),
          })
          .where(eq(bids.id, bid.id));
        
        // Notify user
        if (copartStatus.status === 'won') {
          await sendNotification({
            userId: bid.userId,
            type: 'auction_won',
            title: '🎉 You Won!',
            message: `Congratulations! You won the auction for $${copartStatus.currentBid}`,
            channels: ['in_app', 'email', 'sms', 'whatsapp'],
          });
        } else if (copartStatus.status === 'lost') {
          await sendNotification({
            userId: bid.userId,
            type: 'auction_lost',
            title: 'Auction Ended',
            message: 'Unfortunately, you didn\'t win this auction.',
            channels: ['in_app', 'email'],
          });
        }
      }
      */
      
      console.log(`Checked bid ${bid.id}`);
      
    } catch (error) {
      console.error(`Failed to check bid ${bid.id}:`, error);
      // Continue with other bids
    }
  }
  
  console.log('✅ Bid status sync complete');
}
