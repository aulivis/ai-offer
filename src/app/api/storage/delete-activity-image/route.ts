import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets';

export const DELETE = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    const sb = await supabaseServer();
    const userId = request.user.id;

    const body = await request.json();
    const { activityId, imagePath } = body;

    if (!activityId || typeof activityId !== 'string') {
      return createErrorResponse('Hiányzik a tevékenység azonosító.', HttpStatus.BAD_REQUEST);
    }

    if (!imagePath || typeof imagePath !== 'string') {
      return createErrorResponse('Hiányzik a kép elérési útja.', HttpStatus.BAD_REQUEST);
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
        'A tevékenység nem található vagy nincs hozzáférése hozzá.',
        HttpStatus.NOT_FOUND,
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
      throw updateError;
    }

    // Delete image from storage
    const { error: deleteError } = await sb.storage.from(BUCKET_ID).remove([imagePath]);

    if (deleteError) {
      log.warn('Failed to delete image from storage', { error: deleteError, imagePath });
      // Don't fail the request if storage deletion fails - the DB update succeeded
    }

    return NextResponse.json({ ok: true });
  }),
);
