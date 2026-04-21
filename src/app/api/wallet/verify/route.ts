import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { addFunds } from '@/lib/wallet';
import { z } from 'zod';

const verifySchema = z.object({
  reference: z.string(),
});

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

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

    const body = await request.json();
    const validated = verifySchema.parse(body);

    // Verify with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${validated.reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      );
    }

    // Check if this is a wallet funding transaction
    const metadata = paystackData.data.metadata || {};
    if (metadata.type !== 'wallet_funding') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Check if user matches
    if (metadata.userId !== user.id) {
      return NextResponse.json(
        { error: 'Transaction user mismatch' },
        { status: 400 }
      );
    }

    // Add funds to wallet
    const amountNGN = paystackData.data.amount / 100; // Convert from kobo
    const amountUSD = parseFloat(metadata.usdAmount) || amountNGN / 1550;

    await addFunds(
      user.id,
      amountUSD,
      'NGN',
      amountNGN,
      1550,
      validated.reference
    );

    return NextResponse.json({
      success: true,
      message: 'Wallet funded successfully',
      amount: amountUSD,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Wallet verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
