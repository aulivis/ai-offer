import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { supabaseServer } from '@/app/lib/supabaseServer';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { extractOfferStoragePath } from '@/lib/offers/storage';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { getRequestId } from '@/lib/requestId';
import { createLogger } from '@/lib/logger';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

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
  offerId?: string;
};

export const DELETE = withAuth(
  async (request: AuthenticatedNextRequest, context: { params: Promise<RouteParams> }) => {
    const { offerId } = await context.params;
    const requestId = getRequestId(request);
    const log = createLogger(requestId);
    log.setContext({ userId: request.user.id, offerId });
    
    if (!offerId || typeof offerId !== 'string') {
      return NextResponse.json({ error: 'Érvénytelen ajánlat azonosító.' }, { status: 400 });
    }

    try {
      const sessionClient = await supabaseServer();
      const { data: offer, error: loadError } = await sessionClient
        .from('offers')
        .select('id, user_id, pdf_url, title')
        .eq('id', offerId)
        .maybeSingle();

      if (loadError) {
        log.error('Failed to load offer before deletion', loadError);
        return NextResponse.json(
          { error: 'Nem sikerült betölteni az ajánlatot.' },
          { status: 500 },
        );
      }

      if (!offer) {
        return NextResponse.json({ error: 'Az ajánlat nem található.' }, { status: 404 });
      }

      if (offer.user_id !== request.user.id) {
        log.warn('Unauthorized deletion attempt');
        return NextResponse.json(
          { error: 'Nincs jogosultságod az ajánlat törléséhez.' },
          { status: 403 },
        );
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
        log.warn('Failed to load offer PDF job storage paths (non-blocking)', jobError);
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
        return NextResponse.json({ error: 'Nem sikerült törölni az ajánlatot.' }, { status: 500 });
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
        const { error: storageError } = await adminClient.storage
          .from('offers')
          .remove(storageList);
        if (storageError) {
          log.error('Failed to delete offer PDFs from storage', storageError);
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      log.error('Unexpected error during offer deletion', error);
      return NextResponse.json({ error: 'Nem sikerült törölni az ajánlatot.' }, { status: 500 });
    }
  },
);
