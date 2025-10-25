import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { db } from '@/db';
import { bids } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const { bidId, status } = await request.json();

    // Update bid status
    const [updatedBid] = await db
      .update(bids)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(bids.id, bidId), eq(bids.userId, user.id)))
      .returning();

    if (!updatedBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bid: updatedBid,
    });

  } catch (error) {
    console.error('Update bid status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
