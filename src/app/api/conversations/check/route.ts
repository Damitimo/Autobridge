import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const bidRequestId = searchParams.get('bidRequestId');

    if (!bidRequestId) {
      return NextResponse.json({ error: 'bidRequestId is required' }, { status: 400 });
    }

    // Check if conversation exists for this bid request
    const [existingConversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, user.id),
          eq(conversations.relatedEntityType, 'bid_request'),
          eq(conversations.relatedEntityId, bidRequestId)
        )
      )
      .limit(1);

    return NextResponse.json({
      exists: !!existingConversation,
      conversationId: existingConversation?.id || null,
    });

  } catch (error) {
    console.error('Check conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
