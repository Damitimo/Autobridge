import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { uploadFile, UploadFolder } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as UploadFolder | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!folder || !['kyc', 'shipment-photos', 'shipment-documents', 'profiles'].includes(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max size is 10MB' }, { status: 400 });
    }

    // Determine resource type and validate file type
    let resourceType: 'image' | 'raw' = 'image';

    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      resourceType = 'image';
    } else if (ALLOWED_DOC_TYPES.includes(file.type)) {
      resourceType = 'raw';
    } else {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, PDF, DOC, DOCX'
      }, { status: 400 });
    }

    // Upload to Cloudinary
    const result = await uploadFile(file, folder, resourceType);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
