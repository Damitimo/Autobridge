import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, walletTransactions, wallets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendNotification } from '@/lib/notifications';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const SIGNUP_FEE_NGN = 100000;

export async function POST(request: NextRequest) {
  try {
    // Verify Paystack signature
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();
    
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle successful payment
    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      const userId = metadata.userId;
      
      if (metadata.type !== 'signup_fee') {
        return NextResponse.json({ status: 'ignored' });
      }

      const amountNGN = amount / 100;

      // Update user signup fee status
      await db.update(users)
        .set({
          signupFeePaid: true,
          signupFeePaidAt: new Date(),
          signupFeeAmount: amountNGN.toString(),
        })
        .where(eq(users.id, userId));

      // Record transaction in wallet
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
      
      if (wallet) {
        await db.insert(walletTransactions).values({
          walletId: wallet.id,
          userId,
          type: 'signup_fee',
          amount: amountNGN.toString(),
          currency: 'NGN',
          usdAmount: (amountNGN / 1550).toString(),
          exchangeRate: '1550',
          balanceBefore: wallet.totalBalance,
          balanceAfter: wallet.totalBalance,
          status: 'completed',
          description: 'Signup fee payment - ₦100,000',
          metadata: { reference },
        });
      }

      // Send notification
      await sendNotification({
        userId,
        type: 'signup_fee_paid',
        title: '🎉 Account Activated!',
        message: 'Your signup fee has been paid successfully. You can now start bidding!',
        channels: ['in_app', 'email', 'sms'],
      });

      console.log(`✅ Signup fee paid: ${userId} - ₦${amountNGN}`);
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Signup fee webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Manual verification endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    // Verify with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      const { amount, metadata } = data.data;
      const userId = metadata.userId;
      const amountNGN = amount / 100;

      // Update user
      await db.update(users)
        .set({
          signupFeePaid: true,
          signupFeePaidAt: new Date(),
          signupFeeAmount: amountNGN.toString(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: 'Signup fee verified and account activated',
      });
    }

    return NextResponse.json({
      error: 'Payment not successful',
    }, { status: 400 });

  } catch (error) {
    console.error('Signup fee verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
