import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get or create a conversation for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId));

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check for existing conversation with this user
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, params.userId));

    // If no conversation exists, create one
    if (!conversation) {
      [conversation] = await db
        .insert(conversations)
        .values({
          userId: params.userId,
          subject: `Conversation with ${user.firstName} ${user.lastName}`,
          status: 'open',
          relatedEntityType: 'general',
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      conversation,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Error getting user conversation:', error);
    return NextResponse.json({ success: false, error: 'Failed to get conversation' }, { status: 500 });
  }
}
