import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { kycDocuments, users } from '@/db/schema';
import { getUserFromToken } from '@/lib/auth';
import { uploadFile } from '@/lib/cloudinary';
import { sendAdminEmail } from '@/lib/notifications';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const REQUIRED_DOCUMENTS = ['id_document', 'proof_of_address', 'selfie'];

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

    // Check if user already has verified KYC
    if (user.kycStatus === 'verified') {
      return NextResponse.json({ error: 'KYC already verified' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();

    const documents: { type: string; file: File }[] = [];

    // Collect all document files
    for (const docType of REQUIRED_DOCUMENTS) {
      const file = formData.get(docType) as File | null;
      if (file && file.size > 0) {
        documents.push({ type: docType, file });
      }
    }

    // Also check for optional BVN document
    const bvnFile = formData.get('bvn_slip') as File | null;
    if (bvnFile && bvnFile.size > 0) {
      documents.push({ type: 'bvn_slip', file: bvnFile });
    }

    if (documents.length < REQUIRED_DOCUMENTS.length) {
      return NextResponse.json({
        error: 'Please upload all required documents: ID, Proof of Address, and Selfie'
      }, { status: 400 });
    }

    // Upload each document to Cloudinary and save to database
    const uploadedDocs = [];

    for (const doc of documents) {
      const result = await uploadFile(doc.file, 'kyc', 'image');

      if (!result.success) {
        return NextResponse.json({
          error: `Failed to upload ${doc.type}: ${result.error}`
        }, { status: 500 });
      }

      // Save to database
      const [savedDoc] = await db.insert(kycDocuments).values({
        userId: user.id,
        documentType: doc.type,
        fileUrl: result.url!,
        fileName: doc.file.name,
        status: 'pending',
      }).returning();

      uploadedDocs.push(savedDoc);
    }

    // Update user KYC status to pending
    await db.update(users)
      .set({ kycStatus: 'pending', updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Notify admin
    await sendAdminEmail(
      'New KYC Submission',
      `<p>A new KYC submission requires review:</p>
      <ul>
        <li><strong>User:</strong> ${user.firstName} ${user.lastName}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Documents:</strong> ${uploadedDocs.length} files uploaded</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users">Review in Admin Portal</a></p>`
    );

    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully. We will review within 24-48 hours.',
      documents: uploadedDocs.map(d => ({
        id: d.id,
        type: d.documentType,
        status: d.status,
      })),
    });

  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
  }
}
