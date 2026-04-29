import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bidRequestHistory, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Fetch bid history with user info
    const history = await db
      .select({
        id: bidRequestHistory.id,
        bidRequestId: bidRequestHistory.bidRequestId,
        previousMaxBid: bidRequestHistory.previousMaxBid,
        newMaxBid: bidRequestHistory.newMaxBid,
        changeType: bidRequestHistory.changeType,
        notes: bidRequestHistory.notes,
        createdAt: bidRequestHistory.createdAt,
        changedByFirstName: users.firstName,
        changedByLastName: users.lastName,
        changedByEmail: users.email,
      })
      .from(bidRequestHistory)
      .leftJoin(users, eq(bidRequestHistory.changedBy, users.id))
      .where(eq(bidRequestHistory.bidRequestId, id))
      .orderBy(desc(bidRequestHistory.createdAt));

    return NextResponse.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error('Fetch bid history error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bid history' }, { status: 500 });
  }
}
