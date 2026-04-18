import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found', isAdmin: false },
        { status: 404 }
      );
    }

    const foundUser = user[0];

    // Check if user is admin
    if (foundUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized as admin', isAdmin: false },
        { status: 403 }
      );
    }

    // Generate admin JWT token
    const token = jwt.sign(
      {
        userId: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        isAdmin: true,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      isAdmin: true,
      token,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: foundUser.role,
      },
    });
  } catch (error) {
    console.error('Admin Google verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed', isAdmin: false },
      { status: 500 }
    );
  }
}
