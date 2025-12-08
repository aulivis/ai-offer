import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { checkRateLimitMiddleware, createRateLimitResponse } from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets'; // Using same bucket as brand logos
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for reference photos
const MAX_IMAGES_PER_ACTIVITY = 3;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days for reference images
type AllowedMimeType = 'image/png' | 'image/jpeg' | 'image/jpg'; // No SVG for reference photos

// Cache bucket existence check per server instance
let bucketExistsCache: { exists: boolean; timestamp: number } | null = null;
const BUCKET_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

type NormalizedImage = {
  buffer: Buffer;
  extension: 'png' | 'jpg';
  contentType: AllowedMimeType;
};

async function ensureBucketExists() {
  const now = Date.now();
  if (bucketExistsCache && now - bucketExistsCache.timestamp < BUCKET_CACHE_TTL_MS) {
    if (bucketExistsCache.exists) {
      return;
    }
  }

  const adminClient = supabaseServiceRole();
  const { data: bucket, error } = await adminClient.storage.getBucket(BUCKET_ID);

  if (error && !error.message?.toLowerCase().includes('not found')) {
    throw new Error('Nem sikerült lekérni a tárhely beállításait.');
  }

  if (!bucket) {
    const { error: createError } = await adminClient.storage.createBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(MAX_FILE_SIZE),
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'], // Keep SVG for brand logos
    });
    if (createError) {
      throw new Error('Nem sikerült létrehozni a tárhelyet.');
    }
    bucketExistsCache = { exists: true, timestamp: now };
    return;
  }

  bucketExistsCache = { exists: true, timestamp: now };
}

function detectPng(buffer: Buffer): NormalizedImage | null {
  if (buffer.length < PNG_SIGNATURE.length) return null;
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return null;

  return {
    buffer,
    extension: 'png',
    contentType: 'image/png',
  };
}

async function normalizePng(buffer: Buffer): Promise<NormalizedImage | null> {
  const detected = detectPng(buffer);
  if (!detected) return null;

  // Optimize PNG with better compression
  const normalizedBuffer = await sharp(buffer, { failOn: 'truncated' })
    .png({ compressionLevel: 9, quality: 90 })
    .toBuffer();
  return { ...detected, buffer: normalizedBuffer };
}

function detectJpeg(buffer: Buffer): NormalizedImage | null {
  if (buffer.length < 4) return null;
  if (!buffer.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) return null;
  if (!(buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9)) return null;

  return {
    buffer,
    extension: 'jpg',
    contentType: 'image/jpeg',
  };
}

async function normalizeJpeg(buffer: Buffer): Promise<NormalizedImage | null> {
  const detected = detectJpeg(buffer);
  if (!detected) return null;

  // Optimize JPEG - resize if too large, maintain quality
  let image = sharp(buffer, { failOn: 'truncated' });
  const metadata = await image.metadata();

  // Resize if width > 2000px or height > 2000px (maintain aspect ratio)
  const maxDimension = 2000;
  if (metadata.width && metadata.height) {
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      image = image.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  const normalizedBuffer = await image.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  return { ...detected, buffer: normalizedBuffer };
}

async function validateAndNormalizeImage(buffer: Buffer): Promise<NormalizedImage | null> {
  const normalizers: Array<
    (input: Buffer) => Promise<NormalizedImage | null> | NormalizedImage | null
  > = [normalizePng, normalizeJpeg];

  for (const normalize of normalizers) {
    const result = await normalize(buffer);
    if (result) {
      return result;
    }
  }

  return null;
}

export const POST = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    // Rate limiting
    const rateLimitResult = await checkRateLimitMiddleware(request, {
      maxRequests: 20, // Higher limit for reference photos
      windowMs: RATE_LIMIT_WINDOW_MS,
      keyPrefix: 'upload-activity-image',
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      log.warn('Upload rate limit exceeded', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      });
      return createRateLimitResponse(
        rateLimitResult,
        'Túl sok fájlfeltöltési kísérlet történt. Próbáld újra később.',
      );
    }

    const sb = await supabaseServer();
    const userId = request.user.id;

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const activityId = formData.get('activityId');

    if (!(fileEntry instanceof File)) {
      return createErrorResponse('Hiányzik a feltöltendő fájl.', HttpStatus.BAD_REQUEST);
    }

    if (!activityId || typeof activityId !== 'string') {
      return createErrorResponse('Hiányzik a tevékenység azonosító.', HttpStatus.BAD_REQUEST);
    }

    // Verify activity belongs to user
    const { data: activity, error: activityError } = await sb
      .from('activities')
      .select('id, reference_images')
      .eq('id', activityId)
      .eq('user_id', userId)
      .single();

    if (activityError || !activity) {
      return createErrorResponse(
        'A tevékenység nem található vagy nincs hozzáférésed hozzá.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check current image count
    const currentImages = (activity.reference_images as string[] | null) || [];
    if (currentImages.length >= MAX_IMAGES_PER_ACTIVITY) {
      return createErrorResponse(
        `Maximum ${MAX_IMAGES_PER_ACTIVITY} kép tölthető fel tevékenységenként.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return createErrorResponse(
        'A fájl mérete legfeljebb 5 MB lehet.',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    try {
      await ensureBucketExists();
    } catch (bucketError) {
      log.error('Failed to ensure bucket exists', bucketError);
      throw bucketError;
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const normalizedImage = await validateAndNormalizeImage(buffer);
    if (!normalizedImage) {
      return createErrorResponse(
        'Csak PNG vagy JPEG kép tölthető fel.',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const imageId = randomUUID();
    const path = `${userId}/activities/${activityId}/reference-${imageId}.${normalizedImage.extension}`;

    // Verify authentication
    const {
      data: { user: authUser },
    } = await sb.auth.getUser();
    if (!authUser || authUser.id !== userId) {
      log.error('Authentication mismatch in activity image upload', {
        expectedUserId: userId,
        authUserId: authUser?.id || 'none',
      });
      return createErrorResponse(
        'Hitelesítési hiba. Kérjük, jelentkezz be újra.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Upload image
    const { error: uploadError } = await sb.storage
      .from(BUCKET_ID)
      .upload(path, normalizedImage.buffer, {
        upsert: false,
        contentType: normalizedImage.contentType,
      });

    if (uploadError) {
      const errorMessage = ((uploadError as { message?: string }).message || '').toLowerCase();

      if (errorMessage.includes('not found') || errorMessage.includes('bucket')) {
        return createErrorResponse(
          'A tárhely nem elérhető. Kérjük, próbáld újra később.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        return createErrorResponse('Nincs jogosultság a fájl feltöltéséhez.', HttpStatus.FORBIDDEN);
      }

      throw uploadError;
    }

    // Generate signed URL
    const { data: signedData, error: signedError } = await sb.storage
      .from(BUCKET_ID)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      log.warn('Failed to generate signed URL', { error: signedError, path });
    }

    // Add image to activity's reference_images array
    const updatedImages = [...currentImages, path];
    const { error: updateError } = await sb
      .from('activities')
      .update({ reference_images: updatedImages })
      .eq('id', activityId)
      .eq('user_id', userId);

    if (updateError) {
      // Rollback: delete uploaded image
      await sb.storage.from(BUCKET_ID).remove([path]);
      log.error('Failed to update activity with image path', updateError);
      throw updateError;
    }

    return NextResponse.json({
      path,
      signedUrl: signedData?.signedUrl ?? null,
      imageId,
    });
  }),
);
