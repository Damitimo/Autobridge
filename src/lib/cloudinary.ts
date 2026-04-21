import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadFolder = 'kyc' | 'shipment-photos' | 'shipment-documents' | 'profiles';

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  resourceType: 'image' | 'raw' = 'image'
): Promise<UploadResult> {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
      folder: `autobridge/${folder}`,
      resource_type: resourceType,
      allowed_formats: resourceType === 'image'
        ? ['jpg', 'jpeg', 'png', 'webp', 'gif']
        : ['pdf', 'doc', 'docx'],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: UploadFolder,
  resourceType: 'image' | 'raw' = 'image'
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadFile(file, folder, resourceType))
  );
  return results;
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Generate a signed URL for secure access (optional, for private files)
 */
export function getSignedUrl(publicId: string, expiresIn: number = 3600): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });
}

export default cloudinary;
