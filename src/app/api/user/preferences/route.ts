import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Default preferences if none set
    const defaultPreferences = {
      defaultCurrency: 'USD' as const,
      costIntelligence: {
        showVehiclePrice: true,
        showAuctionFee: true,
        showTowing: true,
        showShipping: true,
        showInsurance: true,
        showCustomsDuty: true,
        showPortCharges: true,
        showClearingFee: true,
        showServiceFee: true,
        showLocalDelivery: true,
        showTotal: true,
      },
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
    };

    const preferences = user.preferences || defaultPreferences;

    return NextResponse.json({
      success: true,
      preferences: {
        ...defaultPreferences,
        ...preferences,
        costIntelligence: {
          ...defaultPreferences.costIntelligence,
          ...(preferences.costIntelligence || {}),
        },
      },
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    // Merge with existing preferences
    const currentPreferences = user.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      costIntelligence: {
        ...(currentPreferences.costIntelligence || {}),
        ...(preferences.costIntelligence || {}),
      },
      notifications: {
        ...(currentPreferences.notifications || {}),
        ...(preferences.notifications || {}),
      },
    };

    await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
