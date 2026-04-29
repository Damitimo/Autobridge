import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, bidRequestHistory, wallets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  maxBidAmount: z.number().positive(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Get the bid request
    const [bidRequest] = await db
      .select()
      .from(bidRequests)
      .where(and(
        eq(bidRequests.id, id),
        eq(bidRequests.userId, user.id)
      ));

    if (!bidRequest) {
      return NextResponse.json({ success: false, error: 'Bid request not found' }, { status: 404 });
    }

    // Can only update pending requests
    if (bidRequest.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Cannot update a bid request that is already processed'
      }, { status: 400 });
    }

    const previousMaxBid = parseFloat(bidRequest.maxBidAmount);
    const newMaxBidAmount = validated.maxBidAmount;

    // Check if the new amount is different
    if (previousMaxBid === newMaxBidAmount) {
      return NextResponse.json({
        success: false,
        error: 'New max bid amount must be different from current amount'
      }, { status: 400 });
    }

    // Calculate deposit difference
    const previousDeposit = previousMaxBid * 0.10;
    const newDeposit = newMaxBidAmount * 0.10;
    const depositDifference = newDeposit - previousDeposit;

    // Get user's wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, user.id));

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 400 });
    }

    const availableBalance = parseFloat(wallet.availableBalance || '0');
    const currentLockedBalance = parseFloat(wallet.lockedBalance || '0');

    // If increasing bid, check if user has enough funds
    if (depositDifference > 0 && availableBalance < depositDifference) {
      return NextResponse.json({
        success: false,
        error: `Insufficient wallet balance. You need an additional $${depositDifference.toFixed(2)} to increase your bid. Your available balance is $${availableBalance.toFixed(2)}.`,
        code: 'INSUFFICIENT_BALANCE',
        required: depositDifference,
        available: availableBalance,
      }, { status: 400 });
    }

    // Update wallet balances
    const newAvailableBalance = availableBalance - depositDifference;
    const newLockedBalance = currentLockedBalance + depositDifference;

    await db
      .update(wallets)
      .set({
        availableBalance: newAvailableBalance.toString(),
        lockedBalance: newLockedBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, user.id));

    // Update the bid request
    await db
      .update(bidRequests)
      .set({
        maxBidAmount: newMaxBidAmount.toString(),
        lockedAmount: newDeposit.toString(),
        notes: validated.notes || bidRequest.notes,
        updatedAt: new Date(),
      })
      .where(eq(bidRequests.id, id));

    // Record the change in history
    await db.insert(bidRequestHistory).values({
      bidRequestId: id,
      previousMaxBid: previousMaxBid.toString(),
      newMaxBid: newMaxBidAmount.toString(),
      changedBy: user.id,
      changeType: 'updated',
      notes: validated.notes || `Max bid updated from $${previousMaxBid.toLocaleString()} to $${newMaxBidAmount.toLocaleString()}`,
    });

    return NextResponse.json({
      success: true,
      message: newMaxBidAmount > previousMaxBid
        ? `Bid increased successfully. Additional $${depositDifference.toFixed(2)} has been locked.`
        : `Bid decreased successfully. $${Math.abs(depositDifference).toFixed(2)} has been unlocked.`,
      data: {
        previousMaxBid,
        newMaxBid: newMaxBidAmount,
        depositChange: depositDifference,
        newLockedAmount: newDeposit,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update bid request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update bid request' }, { status: 500 });
  }
}
