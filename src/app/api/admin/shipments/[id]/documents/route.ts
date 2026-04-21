import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentDocuments, shipments } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudinary';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check shipment exists
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, params.id))
      .limit(1);

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'Document type required' }, { status: 400 });
    }

    // Upload to Cloudinary
    const result = await uploadFile(file, 'shipment-documents', 'raw');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 500 });
    }

    // Save to database
    const [newDoc] = await db.insert(shipmentDocuments).values({
      shipmentId: params.id,
      documentType,
      fileUrl: result.url!,
      fileName: file.name,
      uploadedBy: admin.id,
    }).returning();

    return NextResponse.json({
      success: true,
      document: newDoc,
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get documents
    const documents = await db
      .select()
      .from(shipmentDocuments)
      .where(eq(shipmentDocuments.shipmentId, params.id));

    return NextResponse.json({
      success: true,
      documents,
    });

  } catch (error) {
    console.error('Documents fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
