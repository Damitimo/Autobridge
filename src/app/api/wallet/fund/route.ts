import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { z } from 'zod';

const fundSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['NGN', 'USD']),
});

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';

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
    const validated = fundSchema.parse(body);

    if (validated.currency === 'NGN') {
      // Initialize Paystack payment
      const reference = `WALLET-${user.id}-${Date.now()}`;
      const amountInKobo = validated.amount * 100; // Convert to kobo

      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?payment=success`,
          metadata: {
            userId: user.id,
            type: 'wallet_funding',
            currency: 'NGN',
            usdAmount: (validated.amount / 1550).toFixed(2),
          },
        }),
      });

      const paystackData = await paystackResponse.json();

      if (paystackData.status) {
        return NextResponse.json({
          success: true,
          authorizationUrl: paystackData.data.authorization_url,
          reference,
        });
      } else {
        return NextResponse.json({
          error: paystackData.message || 'Failed to initialize payment',
        }, { status: 400 });
      }
    }

    if (validated.currency === 'USD') {
      // Generate wire transfer instructions
      const reference = `WIRE-${user.id}-${Date.now()}`;
      
      return NextResponse.json({
        success: true,
        instructions: {
          bankName: 'Chase Bank',
          accountName: 'AutoBridge Inc',
          accountNumber: '1234567890',
          routingNumber: '021000021',
          swiftCode: 'CHASUS33',
          reference,
          amount: validated.amount,
          note: 'Please include the reference number in your transfer notes',
        },
        message: 'Transfer pending manual verification. Funds will be credited within 1-2 business days.',
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Fund wallet error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
