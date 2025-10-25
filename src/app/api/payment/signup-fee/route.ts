import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const SIGNUP_FEE_NGN = 100000; // ₦100,000

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

    // Initialize Paystack payment for ₦100,000
    const reference = `SIGNUP-${user.id}-${Date.now()}`;
    const amountInKobo = SIGNUP_FEE_NGN * 100; // Convert to kobo

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
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?signup_fee=success`,
        metadata: {
          userId: user.id,
          type: 'signup_fee',
          amount: SIGNUP_FEE_NGN,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (paystackData.status) {
      return NextResponse.json({
        success: true,
        authorizationUrl: paystackData.data.authorization_url,
        reference,
        amount: SIGNUP_FEE_NGN,
      });
    } else {
      return NextResponse.json({
        error: paystackData.message || 'Failed to initialize payment',
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Signup fee payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
