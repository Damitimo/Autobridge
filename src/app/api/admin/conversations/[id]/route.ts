import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';
import { sendNotification, NotificationTemplates } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Get a single conversation with all messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get conversation with user info
    const [conversation] = await db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        status: conversations.status,
        relatedEntityType: conversations.relatedEntityType,
        relatedEntityId: conversations.relatedEntityId,
        lastMessageAt: conversations.lastMessageAt,
        unreadByAdmin: conversations.unreadByAdmin,
        createdAt: conversations.createdAt,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id))
      .where(eq(conversations.id, params.id));

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
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
        senderEmail: users.email,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, params.id))
      .orderBy(messages.createdAt);

    // Mark messages as read by admin
    await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(messages.conversationId, params.id));

    // Reset unread count for admin
    await db
      .update(conversations)
      .set({ unreadByAdmin: 0 })
      .where(eq(conversations.id, params.id));

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

// Send a message in a conversation (admin side)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { content, attachments } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
    }

    // Check conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, params.id));

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: params.id,
        senderId: admin.id,
        content: content.trim(),
        attachments: attachments || null,
      })
      .returning();

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessageBy: 'admin',
        unreadByUser: conversation.unreadByUser + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, params.id));

    // Send email notification to user
    const template = NotificationTemplates.newMessageFromAdmin(
      conversation.subject || 'AutoBridge Support',
      content.trim()
    );
    sendNotification({
      userId: conversation.userId,
      type: template.type,
      title: template.title,
      message: template.message,
      channels: ['email', 'in_app'],
      relatedEntityType: 'conversation',
      relatedEntityId: params.id,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

// Close or reopen a conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['open', 'closed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const [updated] = await db
      .update(conversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(conversations.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ success: false, error: 'Failed to update conversation' }, { status: 500 });
  }
}
