import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, messages, users } from '@/db/schema';
import { eq, desc, sql, like, or, count, and } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get conversations with user info
    let query = db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        status: conversations.status,
        relatedEntityType: conversations.relatedEntityType,
        relatedEntityId: conversations.relatedEntityId,
        lastMessageAt: conversations.lastMessageAt,
        lastMessageBy: conversations.lastMessageBy,
        unreadByAdmin: conversations.unreadByAdmin,
        unreadByUser: conversations.unreadByUser,
        createdAt: conversations.createdAt,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(conversations)
      .leftJoin(users, eq(conversations.userId, users.id))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    // Build where conditions
    const whereConditions = [];

    if (status && status !== 'all') {
      whereConditions.push(eq(conversations.status, status as any));
    }

    if (search) {
      whereConditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(conversations.subject, `%${search}%`)
        )
      );
    }

    // Apply where clause if there are conditions
    const convos = whereConditions.length > 0
      ? await query.where(and(...whereConditions))
      : await query;

    // Get total count
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(conversations);

    // Get unread count
    const [{ count: unreadCount }] = await db
      .select({ count: count() })
      .from(conversations)
      .where(sql`${conversations.unreadByAdmin} > 0`);

    return NextResponse.json({
      success: true,
      conversations: convos,
      unreadCount: Number(unreadCount),
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
