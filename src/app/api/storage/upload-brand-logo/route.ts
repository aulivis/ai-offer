import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { sanitizeSvgMarkup } from '@/lib/sanitizeSvg';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { checkRateLimitMiddleware, createRateLimitResponse } from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets';
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;

// Cache bucket existence check per server instance
// Cache expires after 1 hour to handle bucket deletion scenarios
let bucketExistsCache: { exists: boolean; timestamp: number } | null = null;
const BUCKET_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

type NormalizedImage = {
  buffer: Buffer;
  extension: 'png' | 'jpg' | 'svg';
  contentType: AllowedMimeType;
};

async function ensureBucketExists() {
  // Check cache first
  const now = Date.now();
  if (bucketExistsCache && now - bucketExistsCache.timestamp < BUCKET_CACHE_TTL_MS) {
    if (!bucketExistsCache.exists) {
      // If cache says bucket doesn't exist, still try to create it
      // (bucket might have been created by another instance)
    } else {
      // Cache says bucket exists, skip check
      return;
    }
  }

  const adminClient = supabaseServiceRole();
  const { data: bucket, error } = await adminClient.storage.getBucket(BUCKET_ID);

  if (error && !error.message?.toLowerCase().includes('not found')) {
    // Don't cache errors - retry next time
    throw new Error('Nem sikerült lekérni a tárhely beállításait.');
  }

  if (!bucket) {
    const { error: createError } = await adminClient.storage.createBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(MAX_FILE_SIZE),
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    if (createError) {
      // Don't cache creation errors
      throw new Error('Nem sikerült létrehozni a tárhelyet.');
    }
    // Cache successful creation
    bucketExistsCache = { exists: true, timestamp: now };
    return;
  }

  const allowedSet = new Set(bucket.allowed_mime_types ?? []);
  const needsUpdate =
    bucket.public ||
    Number(bucket.file_size_limit ?? MAX_FILE_SIZE) !== MAX_FILE_SIZE ||
    ALLOWED_MIME_TYPES.some((type) => !allowedSet.has(type));

  if (needsUpdate) {
    const { error: updateError } = await adminClient.storage.updateBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(MAX_FILE_SIZE),
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    if (updateError) {
      throw new Error('Nem sikerült frissíteni a tárhely beállításait.');
    }
  }

  // Cache successful check
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

  const normalizedBuffer = await sharp(buffer, { failOn: 'truncated' })
    .png({ compressionLevel: 9 })
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

  const normalizedBuffer = await sharp(buffer, { failOn: 'truncated' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  return { ...detected, buffer: normalizedBuffer };
}

function sanitizeSvg(svg: string): string {
  return sanitizeSvgMarkup(svg);
}

function normalizeSvg(buffer: Buffer): NormalizedImage | null {
  const text = buffer.toString('utf-8');
  if (!text.toLowerCase().includes('<svg')) {
    return null;
  }

  const sanitized = sanitizeSvg(text).trim();
  const svgIndex = sanitized.toLowerCase().indexOf('<svg');
  if (svgIndex === -1) {
    return null;
  }

  const safeSvg = sanitized.slice(svgIndex);
  if (!safeSvg.startsWith('<svg')) {
    return null;
  }

  return {
    buffer: Buffer.from(safeSvg, 'utf-8'),
    extension: 'svg',
    contentType: 'image/svg+xml',
  };
}

async function validateAndNormalizeImage(buffer: Buffer): Promise<NormalizedImage | null> {
  const normalizers: Array<
    (input: Buffer) => Promise<NormalizedImage | null> | NormalizedImage | null
  > = [normalizePng, normalizeJpeg, (input) => normalizeSvg(input)];

  for (const normalize of normalizers) {
    const result = await normalize(buffer);
    if (result) {
      return result;
    }
  }

  return null;
}

export const POST = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  // Rate limiting for file upload endpoint
  const rateLimitResult = await checkRateLimitMiddleware(request, {
    maxRequests: 10, // Limit uploads per user
    windowMs: RATE_LIMIT_WINDOW_MS, // 1 minute window
    keyPrefix: 'upload-brand-logo',
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

  try {
    const sb = await supabaseServer();
    const userId = request.user.id;

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Hiányzik a feltöltendő fájl.' }, { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'A fájl mérete legfeljebb 4 MB lehet.' }, { status: 413 });
    }

    try {
      await ensureBucketExists();
    } catch (bucketError) {
      log.error('Failed to ensure bucket exists', bucketError);
      return NextResponse.json(
        { error: 'Nem sikerült inicializálni a tárhelyet. Próbáld újra később.' },
        { status: 500 },
      );
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const normalizedImage = await validateAndNormalizeImage(buffer);
    if (!normalizedImage) {
      return NextResponse.json(
        { error: 'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.' },
        { status: 415 },
      );
    }

    // Validate userId doesn't contain path traversal characters
    // This is a defense-in-depth measure (userId should already be validated by auth)
    if (userId.includes('..') || userId.includes('/') || userId.includes('\\')) {
      log.error('Invalid user ID format detected', { userId });
      return NextResponse.json({ error: 'Érvénytelen felhasználói azonosító.' }, { status: 400 });
    }

    const path = `${userId}/brand-logo.${normalizedImage.extension}`;

    // Verify the Supabase client has user context
    // The supabaseServer() function should include the access token from cookies
    // but we need to ensure it's properly authenticated
    const {
      data: { user: authUser },
    } = await sb.auth.getUser();
    if (!authUser || authUser.id !== userId) {
      log.error('Authentication mismatch in logo upload', {
        expectedUserId: userId,
        authUserId: authUser?.id || 'none',
      });
      return NextResponse.json(
        { error: 'Hitelesítési hiba. Kérjük, jelentkezz be újra.' },
        { status: 401 },
      );
    }

    const { error: uploadError } = await sb.storage
      .from(BUCKET_ID)
      .upload(path, normalizedImage.buffer, {
        upsert: true,
        contentType: normalizedImage.contentType,
        // Explicitly set owner metadata to ensure RLS policies work correctly
        // Note: Supabase Storage should automatically set owner to auth.uid(),
        // but we're being explicit here for clarity
      });
    if (uploadError) {
      // Serialize Supabase error properly for logging
      const errorMessageRaw = (uploadError as { message?: string }).message || 'Unknown error';
      const errorDetails = {
        message: errorMessageRaw,
        name: (uploadError as Error).name || 'StorageError',
      };

      const errorForLogging =
        uploadError instanceof Error
          ? uploadError
          : new Error(errorMessageRaw || 'Storage upload failed');

      log.error('Logo upload failed', errorForLogging, {
        path,
        userId,
        errorDetails,
        contentType: normalizedImage.contentType,
        fileSize: normalizedImage.buffer.length,
      });

      // Provide more specific error messages
      const errorMessage = errorMessageRaw.toLowerCase();
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('bucket') ||
        errorMessage.includes('does not exist')
      ) {
        return NextResponse.json(
          { error: 'A tárhely nem elérhető. Kérjük, próbáld újra később.' },
          { status: 503 },
        );
      }

      // Check for permission errors
      if (
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('403')
      ) {
        return NextResponse.json(
          {
            error:
              'Nincs jogosultság a fájl feltöltéséhez. Kérjük, lépj kapcsolatba az ügyfélszolgálattal.',
          },
          { status: 403 },
        );
      }

      // Check for file size errors
      if (
        errorMessage.includes('too large') ||
        errorMessage.includes('file size') ||
        errorMessage.includes('413') ||
        errorMessage.includes('payload too large')
      ) {
        return NextResponse.json(
          { error: 'A fájl mérete túl nagy. Maximum 4 MB.' },
          { status: 413 },
        );
      }

      return NextResponse.json(
        { error: 'Nem sikerült feltölteni a logót. Kérjük, próbáld újra.' },
        { status: 500 },
      );
    }

    // Generate signed URL for immediate preview/display
    const { data: signedData, error: signedError } = await sb.storage
      .from(BUCKET_ID)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      log.warn('Failed to generate signed URL', { error: signedError, path });
      // Still return the path even if signed URL generation fails - upload was successful
    }

    // Return both path (for storage) and signed URL (for immediate use)
    // The path should be stored in brand_logo_path column
    // The signed URL is for immediate UI preview
    return NextResponse.json({
      path,
      signedUrl: signedData?.signedUrl ?? null,
    });
  } catch (error) {
    // Log full error details for debugging
    const errorMessage =
      error instanceof Error ? error.message : 'Ismeretlen hiba történt a logó feltöltésekor.';
    const errorStack = error instanceof Error ? error.stack : undefined;

    log.error(
      'Brand logo upload failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorMessage,
        errorStack: process.env.NODE_ENV === 'production' ? undefined : errorStack,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      },
    );

    // Check for specific error types
    if (error instanceof Error) {
      // Sharp/image processing errors
      if (error.message.includes('sharp') || error.message.includes('image')) {
        return NextResponse.json(
          {
            error: 'Nem sikerült feldolgozni a képet. Kérjük, ellenőrizd, hogy érvényes képfájl-e.',
          },
          { status: 415 },
        );
      }

      // Buffer/array buffer errors
      if (error.message.includes('buffer') || error.message.includes('ArrayBuffer')) {
        return NextResponse.json(
          { error: 'Nem sikerült beolvasni a fájlt. Kérjük, próbáld újra.' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
