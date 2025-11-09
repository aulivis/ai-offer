import { NextResponse } from 'next/server';

import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets';
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export const POST = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  try {
    const sb = supabaseServiceRole();
    const { data: bucket, error: getError } = await sb.storage.getBucket(BUCKET_ID);
    if (getError && !getError.message?.toLowerCase().includes('not found')) {
      throw new Error('Nem sikerült lekérni a tárhely beállításait.');
    }

    if (!bucket) {
      const { error: createError } = await sb.storage.createBucket(BUCKET_ID, {
        public: false,
        fileSizeLimit: String(MAX_FILE_SIZE),
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      if (createError) {
        throw new Error('Nem sikerült létrehozni a tárhelyet.');
      }
      return NextResponse.json({ ok: true });
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
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      if (updateError) {
        throw new Error('Nem sikerült frissíteni a tárhely beállításait.');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Ismeretlen hiba a tárhely előkészítésekor.';
    log.error('Bucket ensure failed', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
