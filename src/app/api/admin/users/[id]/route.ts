import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, wallets, bids, shipments, kycDocuments } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;

    // Fetch user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch wallet
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    // Fetch KYC documents
    const documents = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, userId));

    // Fetch stats
    const [bidsCount] = await db
      .select({ count: count() })
      .from(bids)
      .where(eq(bids.userId, userId));

    const [shipmentsCount] = await db
      .select({ count: count() })
      .from(shipments)
      .where(eq(shipments.userId, userId));

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        passwordHash: undefined, // Don't expose password hash
      },
      wallet,
      kycDocuments: documents,
      stats: {
        totalBids: bidsCount.count,
        totalShipments: shipmentsCount.count,
      },
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// Update user (e.g., deactivate account)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id;
    const updates = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = ['isActive', 'role'];
    const sanitizedUpdates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    sanitizedUpdates.updatedAt = new Date();

    await db
      .update(users)
      .set(sanitizedUpdates)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
