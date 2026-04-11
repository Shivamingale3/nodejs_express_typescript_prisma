import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { S3_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT, S3_FORCE_PATH_STYLE, S3_REGION, S3_SECRET_KEY } from '@config';

declare global {
  var s3: S3Client | undefined;
}

const createS3Client = (): S3Client | null => {
  if (!S3_BUCKET) {
    return null;
  }

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: S3_REGION,
  };

  // Use path-style for MinIO, Garage, and local development
  if (S3_FORCE_PATH_STYLE || S3_ENDPOINT) {
    config.forcePathStyle = true;
  }

  // Custom endpoint for MinIO, Garage, etc.
  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT;
  }

  // Credentials: use env vars if provided, otherwise rely on IAM role/service account
  if (S3_ACCESS_KEY && S3_SECRET_KEY) {
    config.credentials = {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    };
  }

  return new S3Client(config);
};

const s3 = globalThis.s3 ?? createS3Client();

if (process.env.NODE_ENV !== 'production') {
  globalThis.s3 = s3 ?? undefined;
}

/**
 * Health check for S3/Object Storage
 * Verifies connectivity and bucket access
 */
const checkStorageHealth = async (): Promise<{ healthy: boolean; message: string }> => {
  if (!s3) {
    return { healthy: false, message: 'Storage not configured (S3_BUCKET not set)' };
  }

  try {
    // Check if bucket exists and is accessible
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return { healthy: true, message: `Storage connected: ${S3_BUCKET}` };
  } catch (error) {
    const err = error as Error;
    // Handle specific S3 errors
    if (err.name === 'NoSuchBucket' || err.name === 'NoSuchBucketException') {
      return { healthy: false, message: `Bucket '${S3_BUCKET}' does not exist` };
    }
    if (err.name === 'AccessDenied' || err.name === 'AccessDeniedException') {
      return { healthy: false, message: `Access denied to bucket '${S3_BUCKET}'` };
    }
    return { healthy: false, message: `Storage connection failed: ${err.message}` };
  }
};

export { checkStorageHealth, s3 };
