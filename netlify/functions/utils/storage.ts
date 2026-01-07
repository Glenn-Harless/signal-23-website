import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET || 'signal23-racks';

// S3-compatible client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Pack ID to file mapping
// Update this when adding new packs
export const PACK_FILES: Record<string, string> = {
  'arps': 'Arps.zip',
  'audio-fx': 'Audio Effect Rack.zip',
  'bass': 'Bass.zip',
  'keys': 'Keys.zip',
};

interface SignedUrlResult {
  downloadUrl: string;
  expiresAt: string;
  packTitle: string;
}

/**
 * Generate a time-limited signed URL for a pack download
 * @param packId - The pack identifier (e.g., 'S23-01')
 * @param expiresInSeconds - URL expiry time (default: 30 minutes)
 */
export async function generateSignedUrl(
  packId: string,
  expiresInSeconds: number = 1800 // 30 minutes
): Promise<SignedUrlResult> {
  const fileName = PACK_FILES[packId];

  if (!fileName) {
    throw new Error(`Unknown pack ID: ${packId}`);
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    downloadUrl: signedUrl,
    expiresAt,
    packTitle: packId,
  };
}

/**
 * Check if a pack file exists in the R2 bucket
 */
export async function packExists(packId: string): Promise<boolean> {
  const fileName = PACK_FILES[packId];

  if (!fileName) {
    return false;
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    // File doesn't exist or other error
    return false;
  }
}
