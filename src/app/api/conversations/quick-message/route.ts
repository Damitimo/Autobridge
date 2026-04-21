import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendAdminEmail, NotificationTemplates } from '@/lib/notifications';

const quickMessageSchema = z.object({
  bidRequestId: z.string(),
  message: z.string().min(1),
  vehicleTitle: z.string().optional(),
});

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

    const body = await request.json();
    const validated = quickMessageSchema.parse(body);

    // Check if conversation already exists for this bid request
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, user.id),
          eq(conversations.relatedEntityType, 'bid_request'),
          eq(conversations.relatedEntityId, validated.bidRequestId)
        )
      )
      .limit(1);

    let conversationId: string;

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id;
    } else {
      // Create new conversation with vehicle name as subject
      const subject = validated.vehicleTitle || 'Bid Request Inquiry';

      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: user.id,
          subject,
          status: 'open',
          relatedEntityType: 'bid_request',
          relatedEntityId: validated.bidRequestId,
          unreadByAdmin: 1,
          unreadByUser: 0,
        })
        .returning();

      conversationId = newConversation.id;
    }

    // Create the message
    await db.insert(messages).values({
      conversationId,
      senderId: user.id,
      content: validated.message,
      isRead: false,
    });

    // Update conversation's last message time and unread count
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        unreadByAdmin: existingConversation
          ? (existingConversation.unreadByAdmin || 0) + 1
          : 1,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Send email notification to admin
    const emailSubject = validated.vehicleTitle || 'Bid Request Inquiry';
    const userName = `${user.firstName} ${user.lastName}`;
    const template = NotificationTemplates.newMessageFromUser(
      userName,
      emailSubject,
      validated.message
    );
    sendAdminEmail(template.title, template.message).catch(console.error);

    return NextResponse.json({
      success: true,
      conversationId,
      message: 'Message sent successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Quick message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
