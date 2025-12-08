import { NextResponse } from 'next/server';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { extractOfferStoragePath } from '@/lib/offers/storage';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { t } from '@/copy';
import { z } from 'zod';
import { uuidSchema } from '@/lib/validation/schemas';
import {
  HttpStatus,
  createErrorResponse,
  withAuthenticatedErrorHandling,
} from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

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

export const DELETE = withAuth(
  withAuthenticatedErrorHandling(
    async (request: AuthenticatedNextRequest, context: RouteParams) => {
      const requestId = getRequestId(request);
      const log = createLogger(requestId);
      log.setContext({ userId: request.user.id });

      // Validate route parameters
      const resolvedParams = await context.params;
      const parsed = offerIdParamsSchema.safeParse(resolvedParams);
      if (!parsed.success) {
        throw parsed.error; // Will be handled by withAuthenticatedErrorHandling
      }

      const offerId = parsed.data.offerId;
      log.setContext({ userId: request.user.id, offerId });

      const sessionClient = await supabaseServer();
      const { data: offer, error: loadError } = await sessionClient
        .from('offers')
        .select('id, user_id, pdf_url, title')
        .eq('id', offerId)
        .maybeSingle();

      if (loadError) {
        log.error('Failed to load offer for deletion', loadError);
        throw loadError; // Will be handled by withAuthenticatedErrorHandling
      }

      if (!offer) {
        log.warn('Offer not found for deletion', { offerId });
        return createErrorResponse(t('errors.offer.notFound'), HttpStatus.NOT_FOUND);
      }

      if (offer.user_id !== request.user.id) {
        log.warn('Unauthorized delete attempt', {
          offerId,
          offerUserId: offer.user_id,
          requestUserId: request.user.id,
          offerTitle: offer.title,
        });
        return createErrorResponse(t('errors.offer.unauthorizedDelete'), HttpStatus.FORBIDDEN);
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
        .select('storage_path')
        .eq('offer_id', offerId)
        .eq('user_id', offer.user_id);

      // Non-blocking: log but continue if job query fails
      if (jobError) {
        // Log warning but don't throw - this is non-critical
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
        log.error('Failed to delete offer from database', deleteError);
        throw deleteError; // Will be handled by withAuthenticatedErrorHandling
      }

      log.info('Offer deleted successfully', { offerId, title: offer.title });

      // Audit log the deletion
      await logAuditEvent(adminClient, {
        eventType: 'offer_deleted',
        userId: request.user.id,
        metadata: { offerId, title: offer.title ?? null },
        requestId,
        ipAddress: getRequestIp(request),
        userAgent: request.headers.get('user-agent'),
      });

      const validatedPaths = new Set<string>();
      storagePaths.forEach((rawPath) => {
        const normalizedPath = normalizeUserOwnedStoragePath(rawPath, offer.user_id);
        if (!normalizedPath) {
          // Skip non-owned paths silently
          return;
        }
        validatedPaths.add(normalizedPath);
      });

      const storageList = Array.from(validatedPaths);
      if (storageList.length > 0) {
        const { error: storageError } = await adminClient.storage
          .from('offers')
          .remove(storageList);
        // Non-blocking: log but don't throw if storage cleanup fails
        if (storageError) {
          // Storage cleanup failure is non-critical
        }
      }

      return NextResponse.json({ success: true });
    },
  ),
);
