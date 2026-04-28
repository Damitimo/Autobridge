import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequests, wallets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Can only cancel pending requests
    if (bidRequest.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel a bid request that is already processed'
      }, { status: 400 });
    }

    // Update status to withdrawn
    await db
      .update(bidRequests)
      .set({
        status: 'withdrawn',
        updatedAt: new Date()
      })
      .where(eq(bidRequests.id, id));

    // Unlock the deposit if there was one
    if (bidRequest.lockedAmount && parseFloat(bidRequest.lockedAmount) > 0) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, user.id));

      if (wallet) {
        const newLockedBalance = parseFloat(wallet.lockedBalance || '0') - parseFloat(bidRequest.lockedAmount);
        await db
          .update(wallets)
          .set({
            lockedBalance: Math.max(0, newLockedBalance).toString(),
            updatedAt: new Date()
          })
          .where(eq(wallets.userId, user.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bid request cancelled successfully. Your deposit has been unlocked.',
    });

  } catch (error) {
    console.error('Cancel bid request error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel bid request' }, { status: 500 });
  }
}
