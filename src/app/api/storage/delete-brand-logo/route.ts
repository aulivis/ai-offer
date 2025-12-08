import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const BUCKET_ID = 'brand-assets';

/**
 * DELETE /api/storage/delete-brand-logo
 *
 * Deletes a user's brand logo from storage.
 * Used for cleanup when upload succeeds but profile save fails.
 */
export const DELETE = withAuth(
  withAuthenticatedErrorHandling(async (request: AuthenticatedNextRequest) => {
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id });

    const sb = await supabaseServer();
    const userId = request.user.id;

    // Try to delete logo files with common extensions
    const extensions = ['png', 'jpg', 'jpeg', 'svg'];
    const deletePromises = extensions.map(async (ext) => {
      const path = `${userId}/brand-logo.${ext}`;
      const { error } = await sb.storage.from(BUCKET_ID).remove([path]);
      if (error && !error.message?.toLowerCase().includes('not found')) {
        log.warn('Failed to delete logo file', { error, path });
      }
    });

    await Promise.allSettled(deletePromises);

    return NextResponse.json({ success: true });
  }),
);
