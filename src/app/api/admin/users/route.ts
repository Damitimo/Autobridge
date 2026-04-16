import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, wallets } from '@/db/schema';
import { eq, like, or, sql, desc } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const kycStatus = searchParams.get('kycStatus') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.phone, `%${search}%`)
        )
      );
    }

    if (kycStatus && kycStatus !== 'all') {
      conditions.push(eq(users.kycStatus, kycStatus as any));
    }

    // Fetch users with wallet info
    const usersQuery = db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        kycStatus: users.kycStatus,
        signupFeePaid: users.signupFeePaid,
        isActive: users.isActive,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        walletBalance: wallets.availableBalance,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply conditions if any
    const usersList = conditions.length > 0
      ? await usersQuery.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await usersQuery;

    // Get total count
    const countQuery = db.select({ count: sql`count(*)` }).from(users);
    const totalResult = conditions.length > 0
      ? await countQuery.where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      : await countQuery;

    const total = Number(totalResult[0].count);

    return NextResponse.json({
      success: true,
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
