import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shipmentPhotos, shipments } from '@/db/schema';
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
    const stage = formData.get('stage') as string | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!stage) {
      return NextResponse.json({ error: 'Photo stage required' }, { status: 400 });
    }

    // Upload to Cloudinary
    const result = await uploadFile(file, 'shipment-photos', 'image');

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 500 });
    }

    // Save to database
    const [newPhoto] = await db.insert(shipmentPhotos).values({
      shipmentId: params.id,
      stage,
      fileUrl: result.url!,
      caption: caption || null,
      uploadedBy: admin.id,
    }).returning();

    return NextResponse.json({
      success: true,
      photo: newPhoto,
    });

  } catch (error) {
    console.error('Photo upload error:', error);
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

    // Get photos
    const photos = await db
      .select()
      .from(shipmentPhotos)
      .where(eq(shipmentPhotos.shipmentId, params.id));

    return NextResponse.json({
      success: true,
      photos,
    });

  } catch (error) {
    console.error('Photos fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
