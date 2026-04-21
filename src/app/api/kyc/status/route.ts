import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kycDocuments, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's KYC documents
    const documents = await db
      .select({
        id: kycDocuments.id,
        documentType: kycDocuments.documentType,
        fileName: kycDocuments.fileName,
        status: kycDocuments.status,
        rejectionReason: kycDocuments.rejectionReason,
        createdAt: kycDocuments.createdAt,
        reviewedAt: kycDocuments.reviewedAt,
      })
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, user.id))
      .orderBy(desc(kycDocuments.createdAt));

    return NextResponse.json({
      success: true,
      kycStatus: user.kycStatus,
      kycRejectionReason: user.kycRejectionReason,
      documents,
    });

  } catch (error) {
    console.error('KYC status error:', error);
    return NextResponse.json({ error: 'Failed to get KYC status' }, { status: 500 });
  }
}
