import { Buffer } from 'node:buffer';

import { NextResponse } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';

import { supabaseServer } from '@/app/lib/supabaseServer';

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

async function ensureBucketExists(sb: ReturnType<typeof supabaseServer>) {
  const { data: bucket, error } = await sb.storage.getBucket(BUCKET_ID);
  if (error && !error.message?.toLowerCase().includes('not found')) {
    throw new Error('Nem sikerült lekérni a tárhely beállításait.');
  }

  if (!bucket) {
    const { error: createError } = await sb.storage.createBucket(BUCKET_ID, {
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
    const { error: updateError } = await sb.storage.updateBucket(BUCKET_ID, {
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

  const normalizedBuffer = await sharp(buffer, { failOn: 'truncated' }).png({ compressionLevel: 9 }).toBuffer();
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

  const normalizedBuffer = await sharp(buffer, { failOn: 'truncated' }).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  return { ...detected, buffer: normalizedBuffer };
}

function sanitizeSvg(svg: string): string {
  return sanitizeHtml(svg, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'svg',
      'path',
      'g',
      'defs',
      'clipPath',
      'title',
      'desc',
      'circle',
      'ellipse',
      'line',
      'polyline',
      'polygon',
      'rect',
      'use',
      'symbol',
      'linearGradient',
      'radialGradient',
      'stop',
      'pattern',
      'mask',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      svg: ['width', 'height', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width'],
      '*': [
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-dasharray',
        'stroke-dashoffset',
        'fill-rule',
        'opacity',
        'transform',
        'clip-path',
        'id',
        'class',
        'href',
        'xlink:href',
      ],
    },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
  });
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
  const normalizers: Array<(input: Buffer) => Promise<NormalizedImage | null> | NormalizedImage | null> = [
    normalizePng,
    normalizeJpeg,
    (input) => normalizeSvg(input),
  ];

  for (const normalize of normalizers) {
    const result = await normalize(buffer);
    if (result) {
      return result;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization') ?? request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Hiányzó hitelesítési token.' }, { status: 401 });
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      return NextResponse.json({ error: 'Érvénytelen hitelesítési token.' }, { status: 401 });
    }

    const sb = supabaseServer();
    const { data: userResp, error: userError } = await sb.auth.getUser(token);
    if (userError || !userResp?.user) {
      return NextResponse.json({ error: 'A feltöltéshez be kell jelentkezni.' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Hiányzik a feltöltendő fájl.' }, { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'A fájl mérete legfeljebb 4 MB lehet.' }, { status: 413 });
    }

    await ensureBucketExists(sb);

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const normalizedImage = await validateAndNormalizeImage(buffer);
    if (!normalizedImage) {
      return NextResponse.json({ error: 'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.' }, { status: 415 });
    }

    const path = `${userResp.user.id}/brand-logo.${normalizedImage.extension}`;

    const { error: uploadError } = await sb.storage.from(BUCKET_ID).upload(path, normalizedImage.buffer, {
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
      return NextResponse.json({ error: 'Nem sikerült létrehozni a letöltési URL-t.' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt a logó feltöltésekor.';
    if (error instanceof Error) {
      console.error('Brand logo upload failed:', error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
