/**
 * Bid Workflow for Scraper-Based MVP
 * 
 * IMPORTANT: Since scraping cannot place actual bids on Copart,
 * you need one of these workflows:
 * 
 * OPTION A: Manual Bidding (Recommended for MVP)
 * - Users place "intent to bid" in your system
 * - You manually log into Copart and place the bid
 * - Update bid status in your system
 * 
 * OPTION B: Direct Users to Copart
 * - Show vehicle details in your platform
 * - Provide "Bid on Copart" button
 * - Track which users clicked (for analytics)
 * 
 * OPTION C: Hybrid (Best for MVP)
 * - Collect bids with payment
 * - Batch place bids on Copart portal
 * - Automated notifications

 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, vehicles, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createBidSchema = z.object({
  vehicleId: z.string(),
  maxBidAmount: z.number().positive(),
  manualPlacement: z.boolean().default(true), // For MVP
});

/**
 * POST /api/bids - Place a bid (MVP version)
 * 
 * This collects the bid intent but doesn't place it on Copart automatically
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // 2. Check KYC
    if (user.kycStatus !== 'verified') {
      return NextResponse.json(
        { error: 'KYC verification required before bidding' },
        { status: 403 }
      );
    }
    
    // 3. Parse request
    const body = await request.json();
    const validated = createBidSchema.parse(body);
    
    // 4. Get vehicle
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, validated.vehicleId))
      .limit(1);
    
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    
    // 5. Check auction hasn't ended - DISABLED FOR TESTING
    // if (vehicle.auctionDate && new Date(vehicle.auctionDate) < new Date()) {
    //   return NextResponse.json(
    //     { error: 'Auction has already ended' },
    //     { status: 400 }
    //   );
    // }
    
    // ========================================
    // MVP APPROACH: Save bid for manual placement
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
          status: 'pending',
          externalSource: 'copart',
          // Note: externalBidId will be set when manually placed
        })
        .returning();
    }
    
    // Send notification
    await sendNotification({
      userId: user.id,
      type: 'bid_placed',
      title: 'Bid Request Received',
      message: `We've received your bid of $${validated.maxBidAmount.toLocaleString()} for ${vehicle.year} ${vehicle.make} ${vehicle.model}. We'll place it on Copart shortly and notify you of the result.`,
      channels: ['in_app', 'email'],
      relatedEntityType: 'bid',
      relatedEntityId: savedBid.id,
    });
    
    // TODO: Send alert to admin to manually place bid on Copart
    await notifyAdminOfNewBid(savedBid, vehicle, user);
    
    return NextResponse.json({
      success: true,
      data: savedBid,
      message: 'Bid received! We will place it on Copart within 30 minutes.',
      instructions: {
        nextSteps: [
          'Payment will be processed if bid wins',
          'You\'ll receive notifications via email and SMS',
          'Track bid status in your dashboard',
        ],
        timeline: 'Bid will be placed within 30 minutes',
      },
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

/**
 * Notify admin of new bid that needs manual placement
 */
async function notifyAdminOfNewBid(bid: any, vehicle: any, user: any) {
  // Get admin users
  const admins = await db
    .select()
    .from(users)
    .where(eq(users.role, 'admin'));
  
  for (const admin of admins) {
    await sendNotification({
      userId: admin.id,
      type: 'admin_bid_pending',
      title: '🔔 New Bid Needs Placement',
      message: `${user.firstName} ${user.lastName} bid $${bid.maxBidAmount} on ${vehicle.year} ${vehicle.make} ${vehicle.model} (Lot ${vehicle.lotNumber})`,
      channels: ['in_app', 'email', 'sms'],
      relatedEntityType: 'bid',
      relatedEntityId: bid.id,
    });
  }
  
  console.log(`📧 Notified ${admins.length} admin(s) of new bid ${bid.id}`);
}

/**
 * GET /api/bids/pending - Get all bids that need manual placement (Admin only)
 */
export async function GET_PENDING_BIDS(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get all pending bids that don't have externalBidId yet
    const pendingBids = await db
      .select({
        bid: bids,
        vehicle: vehicles,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(bids)
      .leftJoin(vehicles, eq(bids.vehicleId, vehicles.id))
      .leftJoin(users, eq(bids.userId, users.id))
      .where(
        and(
          eq(bids.status, 'pending'),
          eq(bids.externalBidId, null as any)
        )
      )
      .orderBy(bids.createdAt);
    
    return NextResponse.json({
      success: true,
      data: pendingBids,
      count: pendingBids.length,
      instructions: {
        steps: [
          '1. Log into Copart.com with company account',
          '2. Navigate to each lot number',
          '3. Place bid up to max amount',
          '4. Mark as placed using PUT /api/bids/{id}/placed endpoint',
        ],
      },
    });
    
  } catch (error) {
    console.error('Failed to get pending bids:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/bids/{id}/placed - Mark bid as manually placed (Admin only)
 */
export async function PUT_BID_PLACED(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const body = await request.json();
    const { copartBidId, notes } = body;
    
    // Update bid status
    const [updatedBid] = await db
      .update(bids)
      .set({
        externalBidId: copartBidId || `MANUAL-${Date.now()}`,
        externalStatus: 'placed',
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bids.id, params.id))
      .returning();
    
    if (!updatedBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }
    
    // Notify user
    await sendNotification({
      userId: updatedBid.userId,
      type: 'bid_active',
      title: 'Your Bid is Active!',
      message: 'We\'ve successfully placed your bid on Copart. You\'ll be notified of the auction result.',
      channels: ['in_app', 'email', 'sms'],
    });
    
    return NextResponse.json({
      success: true,
      data: updatedBid,
      message: 'Bid marked as placed',
    });
    
  } catch (error) {
    console.error('Failed to update bid:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper function to generate Copart lot URL
 */
export function getCopartLotUrl(lotNumber: string): string {
  return `https://www.copart.com/lot/${lotNumber}`;
}
