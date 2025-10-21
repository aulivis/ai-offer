import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';

const BUCKET_ID = 'brand-assets';

export async function POST() {
  try {
    const sb = supabaseServer();
    const { data: bucket, error: getError } = await sb.storage.getBucket(BUCKET_ID);
    if (getError && !getError.message?.toLowerCase().includes('not found')) {
      throw new Error(getError.message);
    }

    if (!bucket) {
      const { error: createError } = await sb.storage.createBucket(BUCKET_ID, {
        public: true,
        fileSizeLimit: String(4 * 1024 * 1024),
      });
      if (createError) {
        throw new Error(createError.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba a tárhely előkészítésekor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
