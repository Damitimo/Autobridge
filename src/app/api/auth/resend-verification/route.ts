import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { generateEmailVerificationCode, generateEmailVerificationToken } from '@/lib/auth';
import { sendEmailToAddress, NotificationTemplates } from '@/lib/notifications';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a new verification code has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification code
    const verificationCode = generateEmailVerificationCode();
    const verificationToken = generateEmailVerificationToken(user.id, verificationCode);

    // Send verification email
    const template = NotificationTemplates.emailVerification(verificationCode, user.firstName);
    await sendEmailToAddress(user.email, template.title, template.message);

    return NextResponse.json({
      success: true,
      verificationToken,
      message: 'A new verification code has been sent to your email.',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}
