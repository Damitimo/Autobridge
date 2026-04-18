import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { waitlist } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';

const waitlistSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string().optional(),
});

export const dynamic = 'force-dynamic';

// Add to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = waitlistSchema.parse(body);

    // Check if email already exists
    const existing = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, validated.email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      // Already on waitlist - just return success
      return NextResponse.json({
        success: true,
        message: 'You are already on the waitlist!',
      });
    }

    // Add to waitlist
    await db.insert(waitlist).values({
      email: validated.email.toLowerCase(),
      phone: validated.phone || null,
      source: validated.source || 'homepage',
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully added to waitlist!',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

// Get waitlist count (for admin)
export async function GET(request: NextRequest) {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(waitlist);

    const entries = await db
      .select()
      .from(waitlist)
      .orderBy(waitlist.createdAt);

    return NextResponse.json({
      success: true,
      count: result.count,
      entries,
    });
  } catch (error) {
    console.error('Waitlist fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}
