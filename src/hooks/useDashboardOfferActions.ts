'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { t } from '@/copy';
import { createClientLogger } from '@/lib/clientLogger';
import type { Offer } from '@/app/dashboard/types';

type UseDashboardOfferActionsOptions = {
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  userId?: string | undefined;
};

export function useDashboardOfferActions({ setOffers, userId }: UseDashboardOfferActionsOptions) {
  const sb = useSupabase();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(userId && { userId }), component: 'useDashboardOfferActions' }),
    [userId],
  );

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const applyPatch = useCallback(
    async (offer: Offer, patch: Partial<Offer>) => {
      setUpdatingId(offer.id);
      try {
        const { error } = await sb.from('offers').update(patch).eq('id', offer.id);
        if (error) throw error;
        setOffers((prev) =>
          prev.map((item) => (item.id === offer.id ? { ...item, ...patch } : item)),
        );
      } catch (error) {
        logger.error('Offer status update failed', error, { offerId: offer.id });
        const message =
          error instanceof Error
            ? error.message
            : t('toasts.offers.statusUpdateFailed.description');
        showToast({
          title: t('toasts.offers.statusUpdateFailed.title'),
          description: message || t('toasts.offers.statusUpdateFailed.description'),
          variant: 'error',
        });
      } finally {
        setUpdatingId(null);
      }
    },
    [sb, setOffers, logger, showToast],
  );

  const markDecision = useCallback(
    async (offer: Offer, decision: 'accepted' | 'lost', date?: string) => {
      const timestamp = date ? new Date(`${date}T00:00:00`) : new Date();
      if (Number.isNaN(timestamp.getTime())) return;
      const patch: Partial<Offer> = {
        status: decision,
        decision,
        decided_at: timestamp.toISOString(),
      };
      await applyPatch(offer, patch);
    },
    [applyPatch],
  );

  const markSent = useCallback(
    async (offer: Offer, _date?: string) => {
      const patch: Partial<Offer> = { status: 'sent' };
      await applyPatch(offer, patch);
    },
    [applyPatch],
  );

  const revertToSent = useCallback(
    async (offer: Offer) => {
      const patch: Partial<Offer> = { status: 'sent', decision: null, decided_at: null };
      await applyPatch(offer, patch);
    },
    [applyPatch],
  );

  const revertToDraft = useCallback(
    async (offer: Offer) => {
      const patch: Partial<Offer> = {
        status: 'draft',
        decided_at: null,
        decision: null,
      };
      await applyPatch(offer, patch);
    },
    [applyPatch],
  );

  const handleDownloadPdf = useCallback(
    async (offer: Offer) => {
      if (!offer.pdf_url) return;

      // Validate URL before fetching
      let pdfUrl: URL;
      try {
        pdfUrl = new URL(offer.pdf_url);
        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(pdfUrl.protocol)) {
          throw new Error('Invalid URL protocol');
        }
      } catch (error) {
        logger.error('Invalid PDF URL', error, { offerId: offer.id, url: offer.pdf_url });
        showToast({
          title: t('toasts.offers.downloadFailed.title'),
          description: t('toasts.offers.downloadFailed.description'),
          variant: 'error',
        });
        return;
      }

      setDownloadingId(offer.id);
      try {
        const response = await fetch(pdfUrl.toString(), { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = createOfferPdfFileName(offer);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        logger.error('Failed to download offer PDF', error, { offerId: offer.id });
        showToast({
          title: t('toasts.offers.downloadFailed.title'),
          description: t('toasts.offers.downloadFailed.description'),
          variant: 'error',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [showToast, logger],
  );

  const handleRegeneratePdf = useCallback(
    async (offer: Offer) => {
      setRegeneratingId(offer.id);
      try {
        const { fetchWithSupabaseAuth } = await import('@/lib/api');
        const response = await fetchWithSupabaseAuth(`/api/offers/${offer.id}/regenerate-pdf`, {
          method: 'POST',
          defaultErrorMessage: t('toasts.offers.regeneratePdfFailed.description'),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || t('toasts.offers.regeneratePdfFailed.description'));
        }

        showToast({
          title: t('toasts.offers.regeneratePdfStarted.title'),
          description: t('toasts.offers.regeneratePdfStarted.description'),
          variant: 'success',
        });
      } catch (error) {
        logger.error('Failed to regenerate PDF', error, { offerId: offer.id });
        showToast({
          title: t('toasts.offers.error.title'),
          description:
            error instanceof Error
              ? error.message
              : t('toasts.offers.regeneratePdfFailed.description'),
          variant: 'error',
        });
      } finally {
        setRegeneratingId(null);
      }
    },
    [showToast, logger],
  );

  return {
    updatingId,
    downloadingId,
    regeneratingId,
    markDecision,
    markSent,
    revertToSent,
    revertToDraft,
    handleDownloadPdf,
    handleRegeneratePdf,
  };
}

function createOfferPdfFileName(offer: Offer): string {
  const base = (offer.title || '').trim().toLowerCase();
  const normalized = base
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  const safeBase = normalized || 'ajanlat';
  return `${safeBase}.pdf`;
}
