import { randomUUID } from 'node:crypto';

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const UPLOAD_URL_EXPIRES_SECONDS = 300;

export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

let client: S3Client | undefined;

type StorageConfig = { bucket: string; publicBaseUrl: string };

export function storageConfig(): StorageConfig | null {
  const bucket = process.env.S3_BUCKET_NAME;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (!bucket || !publicBaseUrl) {
    return null;
  }
  return { bucket, publicBaseUrl: publicBaseUrl.replace(/\/+$/, '') };
}

function s3(): S3Client {
  client ??= new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });
  return client;
}

export function placeImagePrefix(placeId: string): string {
  return `public/places/${placeId}/`;
}

export function newPlaceImageKey(placeId: string, contentType: string): string {
  return `${placeImagePrefix(placeId)}${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
}

export function isPlaceImageKey(placeId: string, key: string): boolean {
  const prefix = placeImagePrefix(placeId);
  if (!key.startsWith(prefix)) {
    return false;
  }
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key.slice(prefix.length));
}

export function publicUrl(config: StorageConfig, key: string): string {
  return `${config.publicBaseUrl}/${key}`;
}

export async function createImageUpload(config: StorageConfig, key: string, contentType: string) {
  return createPresignedPost(s3(), {
    Bucket: config.bucket,
    Key: key,
    Conditions: [
      ['content-length-range', 1, MAX_IMAGE_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: UPLOAD_URL_EXPIRES_SECONDS,
  });
}

export async function objectExists(config: StorageConfig, key: string): Promise<boolean> {
  try {
    await s3().send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) {
      return false;
    }
    throw error;
  }
}
