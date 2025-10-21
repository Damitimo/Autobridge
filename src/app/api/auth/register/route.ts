import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { generateReferralCode } from '@/lib/utils';
import { createWallet } from '@/lib/wallet';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Check phone number
    const existingPhone = await db
      .select()
      .from(users)
      .where(eq(users.phone, validated.phone))
      .limit(1);
    
    if (existingPhone.length > 0) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(validated.password);
    
    // Generate unique referral code
    let referralCode = generateReferralCode();
    let isUnique = false;
    
    while (!isUnique) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);
      
      if (existing.length === 0) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }
    
    // Find referrer if referral code provided
    let referrerId: string | undefined;
    if (validated.referralCode) {
      const referrer = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, validated.referralCode))
        .limit(1);
      
      if (referrer.length > 0) {
        referrerId = referrer[0].id;
      }
    }
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        phone: validated.phone,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        referralCode,
        referredBy: referrerId,
      })
      .returning();
    
    // Auto-create wallet for new user
    await createWallet(newUser.id);
    
    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    
    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Account created successfully! Wallet initialized.',
      nextStep: 'Pay ₦100,000 signup fee to start bidding',
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
