import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyEmailVerificationToken, generateToken } from '@/lib/auth';
import { sendEmailToAddress, sendAdminEmail, NotificationTemplates } from '@/lib/notifications';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  verificationToken: z.string(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { verificationToken, code } = verifyEmailSchema.parse(body);

    // Verify the token and code
    const result = verifyEmailVerificationToken(verificationToken, code);

    if (!result) {
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user as verified
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Send welcome email
    const welcomeTemplate = NotificationTemplates.welcome(user.firstName);
    await sendEmailToAddress(user.email, welcomeTemplate.title, welcomeTemplate.message);

    // Notify admin
    await sendAdminEmail(
      'New Verified User',
      `<p>A new user has verified their email:</p>
      <ul>
        <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Phone:</strong> ${user.phone}</li>
      </ul>`
    );

    // Generate auth token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: { ...userWithoutPassword, emailVerified: true },
      token,
      message: 'Email verified successfully!',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      );
    }

    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
