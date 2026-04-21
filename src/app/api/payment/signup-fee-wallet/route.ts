import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/db';
import { users, wallets, walletTransactions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getWallet } from '@/lib/wallet';

const SIGNUP_FEE_NGN = 100000; // ₦100,000
const EXCHANGE_RATE = 1500; // Approximate NGN to USD rate
const SIGNUP_FEE_USD = Math.ceil(SIGNUP_FEE_NGN / EXCHANGE_RATE); // ~$67

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

    // Check if already paid
    if (user.signupFeePaid) {
      return NextResponse.json({
        error: 'Signup fee already paid',
      }, { status: 400 });
    }

    // Get wallet balance
    const wallet = await getWallet(user.id);
    if (!wallet) {
      return NextResponse.json({
        error: 'Wallet not found',
      }, { status: 400 });
    }

    const availableBalance = parseFloat(wallet.availableBalance);

    // Check if sufficient balance
    if (availableBalance < SIGNUP_FEE_USD) {
      return NextResponse.json({
        error: `Insufficient balance. You need $${SIGNUP_FEE_USD} but have $${availableBalance.toFixed(2)}`,
        requiredAmount: SIGNUP_FEE_USD,
        currentBalance: availableBalance,
      }, { status: 400 });
    }

    // Deduct from wallet
    const balanceBefore = availableBalance;
    const balanceAfter = availableBalance - SIGNUP_FEE_USD;

    await db.update(wallets)
      .set({
        totalBalance: sql`${wallets.totalBalance} - ${SIGNUP_FEE_USD}`,
        availableBalance: sql`${wallets.availableBalance} - ${SIGNUP_FEE_USD}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Record transaction
    await db.insert(walletTransactions).values({
      walletId: wallet.id,
      userId: user.id,
      type: 'withdrawal',
      amount: SIGNUP_FEE_USD.toString(),
      currency: 'USD',
      usdAmount: SIGNUP_FEE_USD.toString(),
      balanceBefore: balanceBefore.toString(),
      balanceAfter: balanceAfter.toString(),
      status: 'completed',
      description: 'Signup fee payment',
    });

    // Mark signup fee as paid
    await db.update(users)
      .set({
        signupFeePaid: true,
        signupFeePaidAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Signup fee paid successfully from wallet',
      newBalance: balanceAfter,
    });

  } catch (error) {
    console.error('Signup fee wallet payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
