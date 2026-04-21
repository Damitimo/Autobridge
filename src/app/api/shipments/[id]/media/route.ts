import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipments, shipmentPhotos, shipmentDocuments } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify user owns this shipment
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(and(eq(shipments.id, params.id), eq(shipments.userId, user.id)))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Fetch photos and documents
    const photos = await db
      .select()
      .from(shipmentPhotos)
      .where(eq(shipmentPhotos.shipmentId, params.id));

    const documents = await db
      .select()
      .from(shipmentDocuments)
      .where(eq(shipmentDocuments.shipmentId, params.id));

    return NextResponse.json({
      success: true,
      data: {
        photos: photos.map(p => ({
          id: p.id,
          stage: p.stage,
          fileUrl: p.fileUrl,
          caption: p.caption,
          createdAt: p.createdAt,
        })),
        documents: documents.map(d => ({
          id: d.id,
          documentType: d.documentType,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          createdAt: d.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Shipment media fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
