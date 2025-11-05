import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { sanitizeSvgMarkup } from '@/lib/sanitizeSvg';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import {
  checkRateLimitMiddleware,
  createRateLimitResponse,
} from '@/lib/rateLimitMiddleware';
import { RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimiting';

const BUCKET_ID = 'brand-assets';
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

type NormalizedImage = {
  buffer: Buffer;
  extension: 'png' | 'jpg' | 'svg';
  contentType: AllowedMimeType;
};

async function ensureBucketExists() {
  const adminClient = supabaseServiceRole();
  const { data: bucket, error } = await adminClient.storage.getBucket(BUCKET_ID);
  if (error && !error.message?.toLowerCase().includes('not found')) {
    throw new Error('Nem sikerült lekérni a tárhely beállításait.');
  }

  if (!bucket) {
    const { error: createError } = await adminClient.storage.createBucket(BUCKET_ID, {
      public: false,
      fileSizeLimit: String(MAX_FILE_SIZE),
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    });
    if (createError) {
      throw new Error('Nem sikerült létrehozni a tárhelyet.');
    }
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
  const requestId = randomUUID();
  
  // Rate limiting for file upload endpoint
  const rateLimitResult = await checkRateLimitMiddleware(request, {
    maxRequests: 10, // Limit uploads per user
    windowMs: RATE_LIMIT_WINDOW_MS, // 1 minute window
    keyPrefix: 'upload-brand-logo',
  });

  if (rateLimitResult && !rateLimitResult.allowed) {
    console.warn('Upload rate limit exceeded', {
      requestId,
      userId: request.user.id,
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

    await ensureBucketExists();

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const normalizedImage = await validateAndNormalizeImage(buffer);
    if (!normalizedImage) {
      return NextResponse.json(
        { error: 'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.' },
        { status: 415 },
      );
    }

    const path = `${userId}/brand-logo.${normalizedImage.extension}`;

    const { error: uploadError } = await sb.storage
      .from(BUCKET_ID)
      .upload(path, normalizedImage.buffer, {
        upsert: true,
        contentType: normalizedImage.contentType,
      });
    if (uploadError) {
      throw new Error('Nem sikerült feltölteni a logót.');
    }

    const { data: signedData, error: signedError } = await sb.storage
      .from(BUCKET_ID)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: 'Nem sikerült létrehozni a letöltési URL-t.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Ismeretlen hiba történt a logó feltöltésekor.';
    if (error instanceof Error) {
      console.error('Brand logo upload failed:', error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
