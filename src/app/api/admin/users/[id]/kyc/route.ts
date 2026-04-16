import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromToken } from '@/lib/auth';

// Approve or reject KYC
export async function POST(
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
    const { action, rejectionReason } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update KYC status
    const updateData: Record<string, any> = {
      kycStatus: action === 'approve' ? 'verified' : 'rejected',
      kycReviewedBy: admin.id,
      kycReviewedAt: new Date(),
      updatedAt: new Date(),
    };

    if (action === 'reject') {
      updateData.kycRejectionReason = rejectionReason;
    } else {
      updateData.kycRejectionReason = null;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // TODO: Send notification to user about KYC status
    // await sendKycStatusNotification(user, action, rejectionReason);

    return NextResponse.json({
      success: true,
      message: `KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Admin KYC update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update KYC status' },
      { status: 500 }
    );
  }
}
