import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get user's conversation (create if doesn't exist)
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

    // Get user's conversation
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id));

    // If no conversation exists, create one
    if (!conversation) {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId: user.id,
          subject: `Conversation with ${user.firstName} ${user.lastName}`,
          status: 'open',
          relatedEntityType: 'general',
        })
        .returning();
    }

    // Get all messages in the conversation
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        attachments: messages.attachments,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderId: users.id,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(messages.createdAt);

    // Mark messages from admin as read
    const adminMessages = conversationMessages.filter(m => m.senderRole === 'admin' && !m.isRead);
    if (adminMessages.length > 0) {
      for (const msg of adminMessages) {
        await db
          .update(messages)
          .set({ isRead: true, readAt: new Date() })
          .where(eq(messages.id, msg.id));
      }
      // Reset unread count for user
      await db
        .update(conversations)
        .set({ unreadByUser: 0 })
        .where(eq(conversations.id, conversation.id));
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages: conversationMessages,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// Send a message (user side)
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    // Get or create user's conversation
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id));

    if (!conversation) {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId: user.id,
          subject: `Conversation with ${user.firstName} ${user.lastName}`,
          status: 'open',
          relatedEntityType: 'general',
        })
        .returning();
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        senderId: user.id,
        content: content.trim(),
        attachments: attachments || null,
      })
      .returning();

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessageBy: 'user',
        unreadByAdmin: conversation.unreadByAdmin + 1,
        updatedAt: new Date(),
        // Reopen if closed
        status: 'open',
      })
      .where(eq(conversations.id, conversation.id));

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
