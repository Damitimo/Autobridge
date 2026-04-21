import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentDocuments } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    // Verify admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const admin = await getUserFromToken(token);

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete the document
    const result = await db
      .delete(shipmentDocuments)
      .where(
        and(
          eq(shipmentDocuments.id, params.docId),
          eq(shipmentDocuments.shipmentId, params.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted',
    });

  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
