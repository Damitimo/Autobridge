import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, walletTransactions, wallets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

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

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { data } = event;
      const { reference, amount, metadata, customer } = data;

      // Amount is in kobo, convert to Naira
      const amountNGN = amount / 100;
      const amountUSD = amountNGN / 1550; // Convert to USD

      if (metadata.type === 'signup_fee') {
        // Handle signup fee payment
        await db.update(users)
          .set({
            signupFeePaid: true,
            signupFeePaidAt: new Date(),
            signupFeeAmount: amountNGN.toString(),
          })
          .where(eq(users.id, metadata.userId));

        // Record in wallet transactions
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, metadata.userId)).limit(1);
        
        if (wallet) {
          await db.insert(walletTransactions).values({
            walletId: wallet.id,
            userId: metadata.userId,
            type: 'signup_fee',
            amount: amountNGN.toString(),
            currency: 'NGN',
            usdAmount: amountUSD.toFixed(2),
            balanceBefore: wallet.totalBalance,
            balanceAfter: wallet.totalBalance,
            status: 'completed',
            description: 'Signup fee payment',
            reference,
            metadata: { paystackReference: reference },
          });
        }

        console.log(`Signup fee paid: User ${metadata.userId}, Amount: ₦${amountNGN}`);
      }

      if (metadata.type === 'wallet_funding') {
        // Handle wallet funding
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, metadata.userId)).limit(1);
        
        if (wallet) {
          const newBalance = parseFloat(wallet.totalBalance) + amountUSD;
          const newAvailable = parseFloat(wallet.availableBalance) + amountUSD;

          // Update wallet balance
          await db.update(wallets)
            .set({
              totalBalance: newBalance.toFixed(2),
              availableBalance: newAvailable.toFixed(2),
              lastFundedAt: new Date(),
            })
            .where(eq(wallets.id, wallet.id));

          // Record transaction
          await db.insert(walletTransactions).values({
            walletId: wallet.id,
            userId: metadata.userId,
            type: 'deposit',
            amount: amountNGN.toString(),
            currency: 'NGN',
            usdAmount: amountUSD.toFixed(2),
            balanceBefore: wallet.totalBalance,
            balanceAfter: newBalance.toFixed(2),
            status: 'completed',
            description: 'Wallet funding via Paystack',
            reference,
            metadata: { paystackReference: reference },
          });

          console.log(`Wallet funded: User ${metadata.userId}, Amount: $${amountUSD.toFixed(2)}`);
        }
      }
    }

    return NextResponse.json({ message: 'Webhook processed' });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
