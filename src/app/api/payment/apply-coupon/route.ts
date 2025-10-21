import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/db';
import { users, walletTransactions, wallets } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_COUPONS = {
  'NOKINGS': {
    description: 'Waive signup fee',
    discount: 100, // 100% discount
  },
};

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

    const { couponCode } = await request.json();

    if (!couponCode) {
      return NextResponse.json({
        error: 'Coupon code is required',
      }, { status: 400 });
    }

    // Validate coupon code
    const upperCoupon = couponCode.toUpperCase();
    const coupon = VALID_COUPONS[upperCoupon as keyof typeof VALID_COUPONS];

    if (!coupon) {
      return NextResponse.json({
        error: 'Invalid coupon code',
      }, { status: 400 });
    }

    // Apply coupon - mark signup fee as paid
    await db.update(users)
      .set({
        signupFeePaid: true,
        signupFeePaidAt: new Date(),
        signupFeeAmount: '0', // Waived
      })
      .where(eq(users.id, user.id));

    // Record transaction in wallet (for tracking)
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
    
    if (wallet) {
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId: user.id,
        type: 'signup_fee',
        amount: '0',
        currency: 'NGN',
        usdAmount: '0',
        balanceBefore: wallet.totalBalance,
        balanceAfter: wallet.totalBalance,
        status: 'completed',
        description: `Signup fee waived with coupon: ${upperCoupon}`,
        metadata: { couponCode: upperCoupon, couponDescription: coupon.description },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully! Account activated.',
    });

  } catch (error) {
    console.error('Coupon application error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
