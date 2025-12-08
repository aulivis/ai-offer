import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets';

export const DELETE = withAuth(async (request: AuthenticatedNextRequest) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  try {
    const sb = await supabaseServer();
    const userId = request.user.id;

    const body = await request.json();
    const { activityId, imagePath } = body;

    if (!activityId || typeof activityId !== 'string') {
      return NextResponse.json(
        { error: 'HiĂˇnyzik a tevĂ©kenysĂ©g azonosĂ­tĂł.' },
        { status: 400 },
      );
    }

    if (!imagePath || typeof imagePath !== 'string') {
      return NextResponse.json({ error: 'HiĂˇnyzik a kĂ©p elĂ©rĂ©si Ăştja.' }, { status: 400 });
    }

    // Verify activity belongs to user
    const { data: activity, error: activityError } = await sb
      .from('activities')
      .select('id, reference_images')
      .eq('id', activityId)
      .eq('user_id', userId)
      .single();

    if (activityError || !activity) {
      return NextResponse.json(
        { error: 'A tevĂ©kenysĂ©g nem talĂˇlhatĂł vagy nincs hozzĂˇfĂ©rĂ©sed hozzĂˇ.' },
        { status: 404 },
      );
    }

    // Remove image from array
    const currentImages = (activity.reference_images as string[] | null) || [];
    const updatedImages = currentImages.filter((path) => path !== imagePath);

    // Update activity
    const { error: updateError } = await sb
      .from('activities')
      .update({ reference_images: updatedImages })
      .eq('id', activityId)
      .eq('user_id', userId);

    if (updateError) {
      log.error('Failed to update activity after image deletion', updateError);
      return NextResponse.json(
        { error: 'Nem sikerĂĽlt frissĂ­teni a tevĂ©kenysĂ©get.' },
        { status: 500 },
      );
    }

    // Delete image from storage
    const { error: deleteError } = await sb.storage.from(BUCKET_ID).remove([imagePath]);

    if (deleteError) {
      log.warn('Failed to delete image from storage', { error: deleteError, imagePath });
      // Don't fail the request if storage deletion fails - the DB update succeeded
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba tĂ¶rtĂ©nt.';
    log.error(
      'Activity image deletion failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
