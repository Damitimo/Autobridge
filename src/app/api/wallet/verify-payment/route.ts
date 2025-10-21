import { NextRequest, NextResponse } from 'next/server';
import { addFunds } from '@/lib/wallet';
import { sendNotification } from '@/lib/notifications';
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

    // Handle successful payment
    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      const userId = metadata.userId;
      const currency = metadata.currency || 'NGN';
      const usdAmount = parseFloat(metadata.usdAmount);
      
      // Convert kobo to naira
      const amountNGN = amount / 100;
      
      // Calculate exchange rate
      const exchangeRate = amountNGN / usdAmount;

      // Add funds to wallet
      await addFunds(
        userId,
        usdAmount,
        currency,
        amountNGN,
        exchangeRate,
        reference
      );

      // Send notification
      await sendNotification({
        userId,
        type: 'wallet_funded',
        title: 'Wallet Funded Successfully',
        message: `Your wallet has been credited with $${usdAmount.toFixed(2)} (₦${amountNGN.toLocaleString()})`,
        channels: ['in_app', 'email'],
      });

      console.log(`✅ Wallet funded: ${userId} - $${usdAmount} (₦${amountNGN})`);
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Also allow GET for manual verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ error: 'Reference required' }, { status: 400 });
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      const { amount, metadata } = data.data;
      const userId = metadata.userId;
      const currency = metadata.currency || 'NGN';
      const usdAmount = parseFloat(metadata.usdAmount);
      const amountNGN = amount / 100;
      const exchangeRate = amountNGN / usdAmount;

      // Add funds
      await addFunds(
        userId,
        usdAmount,
        currency,
        amountNGN,
        exchangeRate,
        reference
      );

      return NextResponse.json({
        success: true,
        message: 'Payment verified and wallet funded',
        amount: usdAmount,
      });
    }

    return NextResponse.json({
      error: 'Payment not successful',
    }, { status: 400 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
