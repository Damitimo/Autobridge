import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/db';
import { wallets, walletTransactions, bids, shipments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { bidId } = await request.json();

    // Get bid details
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId)).limit(1);
    
    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    if (bid.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (bid.status !== 'won') {
      return NextResponse.json({ error: 'Bid is not won' }, { status: 400 });
    }

    // Get wallet
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const paymentAmount = parseFloat(bid.maxBidAmount);

    // Check sufficient balance
    if (parseFloat(wallet.availableBalance) < paymentAmount) {
      return NextResponse.json({ 
        error: 'Insufficient wallet balance',
        required: paymentAmount,
        available: parseFloat(wallet.availableBalance)
      }, { status: 400 });
    }

    // Deduct from wallet
    const newAvailable = parseFloat(wallet.availableBalance) - paymentAmount;
    const newTotal = parseFloat(wallet.totalBalance) - paymentAmount;

    await db.update(wallets)
      .set({
        availableBalance: newAvailable.toFixed(2),
        totalBalance: newTotal.toFixed(2),
      })
      .where(eq(wallets.id, wallet.id));

    // Record transaction
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      userId: user.id,
      type: 'withdrawal',
      amount: paymentAmount.toString(),
      currency: 'USD',
      usdAmount: paymentAmount.toString(),
      balanceBefore: wallet.availableBalance,
      balanceAfter: newAvailable.toFixed(2),
      bidId: bid.id,
      status: 'completed',
      description: `Payment for vehicle - Bid #${bid.id}`,
    });

    // Create shipment record
    const [shipment] = await db.insert(shipments).values({
      userId: user.id,
      bidId: bid.id,
      vehicleId: bid.vehicleId,
      status: 'payment_received',
      estimatedArrivalAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    }).returning();

    return NextResponse.json({
      success: true,
      shipment,
      message: 'Payment processed successfully',
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
