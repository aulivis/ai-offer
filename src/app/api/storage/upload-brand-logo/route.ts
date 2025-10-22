import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseServer';

const BUCKET_ID = 'brand-assets';
const MAX_FILE_SIZE = 4 * 1024 * 1024;

async function ensureBucketExists(sb: ReturnType<typeof supabaseServer>) {
  const { data: bucket, error } = await sb.storage.getBucket(BUCKET_ID);
  if (error && !error.message?.toLowerCase().includes('not found')) {
    throw new Error(error.message);
  }

  if (!bucket) {
    const { error: createError } = await sb.storage.createBucket(BUCKET_ID, {
      public: true,
      fileSizeLimit: String(MAX_FILE_SIZE),
    });
    if (createError) {
      throw new Error(createError.message);
    }
  }
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

    const originalName = typeof fileEntry.name === 'string' && fileEntry.name ? fileEntry.name : 'brand-logo.png';
    const safeExt = (originalName.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${userResp.user.id}/brand-logo.${safeExt}`;
    const arrayBuffer = await fileEntry.arrayBuffer();

    const { error: uploadError } = await sb.storage.from(BUCKET_ID).upload(path, arrayBuffer, {
      upsert: true,
      contentType: fileEntry.type || 'application/octet-stream',
    });
    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicData } = sb.storage.from(BUCKET_ID).getPublicUrl(path);
    const publicUrl = typeof publicData?.publicUrl === 'string' ? publicData.publicUrl : null;
    if (!publicUrl) {
      return NextResponse.json({ error: 'Nem sikerült létrehozni a publikus URL-t.' }, { status: 500 });
    }

    return NextResponse.json({ publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt a logó feltöltésekor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
