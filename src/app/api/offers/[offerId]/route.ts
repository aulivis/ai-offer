import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { extractOfferStoragePath } from '@/lib/offers/storage';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { t } from '@/copy';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import { handleValidationError } from '@/lib/errorHandling';

const offerIdParamsSchema = z.object({
  offerId: uuidSchema,
});

const normalizeUserOwnedStoragePath = (path: string, userId: string): string | null => {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const normalized = extractOfferStoragePath(trimmed) ?? trimmed.replace(/^\/+/, '');
  if (!normalized) return null;

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0 || segments[0] !== userId) {
    return null;
  }

  if (segments.some((segment) => segment === '..')) {
    return null;
  }

  return segments.join('/');
};

type RouteParams = {
  params: Promise<{
    offerId?: string;
  }>;
};

export const DELETE = withAuth(async (request: AuthenticatedNextRequest, context: RouteParams) => {
  const requestId = getRequestId(request);
  const log = createLogger(requestId);
  log.setContext({ userId: request.user.id });

  // Validate route parameters
  const resolvedParams = await context.params;
  const parsed = offerIdParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return handleValidationError(parsed.error, requestId);
  }

  const offerId = parsed.data.offerId;
  log.setContext({ userId: request.user.id, offerId });

  try {
    const sessionClient = await supabaseServer();
    const { data: offer, error: loadError } = await sessionClient
      .from('offers')
      .select('id, user_id, pdf_url, title')
      .eq('id', offerId)
      .maybeSingle();

    if (loadError) {
      log.error('Failed to load offer before deletion', loadError);
      return NextResponse.json({ error: t('errors.offer.loadFailed') }, { status: 500 });
    }

    if (!offer) {
      return NextResponse.json({ error: t('errors.offer.notFound') }, { status: 404 });
    }

    if (offer.user_id !== request.user.id) {
      log.warn('Unauthorized deletion attempt');
      return NextResponse.json({ error: t('errors.offer.unauthorizedDelete') }, { status: 403 });
    }

    const adminClient = supabaseServiceRole();

    const storagePaths = new Set<string>();
    if (offer.pdf_url) {
      const directPath = extractOfferStoragePath(offer.pdf_url);
      if (directPath) storagePaths.add(directPath);
    }
    storagePaths.add(`${offer.user_id}/${offerId}.pdf`);

    const { data: jobRows, error: jobError } = await adminClient
      .from('pdf_jobs')
      .select<{ storage_path: string | null }>('storage_path')
      .eq('offer_id', offerId)
      .eq('user_id', offer.user_id);

    if (jobError) {
      log.warn('Failed to load offer PDF job storage paths (non-blocking)', {
        error: {
          message: jobError.message,
          code: jobError.code,
          details: jobError.details,
          hint: jobError.hint,
        },
      });
    } else {
      jobRows?.forEach(({ storage_path }) => {
        const rawPath = typeof storage_path === 'string' ? storage_path.trim() : '';
        if (!rawPath) return;
        storagePaths.add(rawPath);
        const normalized = extractOfferStoragePath(rawPath);
        if (normalized) storagePaths.add(normalized);
      });
    }

    const { error: deleteError } = await adminClient.from('offers').delete().eq('id', offerId);
    if (deleteError) {
      log.error('Failed to delete offer', deleteError);
      return NextResponse.json({ error: t('errors.offer.deleteFailed') }, { status: 500 });
    }

    // Audit log the deletion
    await logAuditEvent(adminClient, {
      eventType: 'offer_deleted',
      userId: request.user.id,
      metadata: { offerId, title: offer.title ?? null },
      requestId,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    log.info('Offer deleted successfully');

    const validatedPaths = new Set<string>();
    storagePaths.forEach((rawPath) => {
      const normalizedPath = normalizeUserOwnedStoragePath(rawPath, offer.user_id);
      if (!normalizedPath) {
        log.warn('Skipping deletion for non-owned storage path', { path: rawPath });
        return;
      }
      validatedPaths.add(normalizedPath);
    });

    const storageList = Array.from(validatedPaths);
    if (storageList.length > 0) {
      const { error: storageError } = await adminClient.storage.from('offers').remove(storageList);
      if (storageError) {
        log.error('Failed to delete offer PDFs from storage', storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Unexpected error during offer deletion', error);
    return NextResponse.json({ error: t('errors.offer.deleteFailed') }, { status: 500 });
  }
});
