import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, bidRequests, messages, users } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all conversations for the user with latest message
    const userConversations = await db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        status: conversations.status,
        relatedEntityType: conversations.relatedEntityType,
        relatedEntityId: conversations.relatedEntityId,
        lastMessageAt: conversations.lastMessageAt,
        lastMessageBy: conversations.lastMessageBy,
        unreadByUser: conversations.unreadByUser,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.lastMessageAt));

    // For each conversation, get the bid request data if it's related to one
    const conversationsWithData = await Promise.all(
      userConversations.map(async (conv) => {
        let bidRequest = null;
        let lastMessage = null;

        // Get bid request data if related
        if (conv.relatedEntityType === 'bid_request' && conv.relatedEntityId) {
          const [br] = await db
            .select({
              id: bidRequests.id,
              vehicleYear: bidRequests.vehicleYear,
              vehicleMake: bidRequests.vehicleMake,
              vehicleModel: bidRequests.vehicleModel,
              vehicleImageUrl: bidRequests.vehicleImageUrl,
              maxBidAmount: bidRequests.maxBidAmount,
              status: bidRequests.status,
              lotNumber: bidRequests.lotNumber,
            })
            .from(bidRequests)
            .where(eq(bidRequests.id, conv.relatedEntityId));

          bidRequest = br || null;
        }

        // Get the last message
        const [lastMsg] = await db
          .select({
            content: messages.content,
            createdAt: messages.createdAt,
            senderRole: users.role,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        lastMessage = lastMsg || null;

        return {
          ...conv,
          bidRequest,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isFromAdmin: lastMessage.senderRole === 'admin',
          } : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithData,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
