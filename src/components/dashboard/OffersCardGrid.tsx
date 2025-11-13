'use client';

import OfferCard from '@/components/dashboard/OfferCard';
import type { Offer } from '@/app/dashboard/types';
import { t } from '@/copy';

type OffersCardGridProps = {
  offers: Offer[];
  updatingId: string | null;
  downloadingId: string | null;
  deletingId: string | null;
  regeneratingId?: string | null;
  onMarkSent: (offer: Offer, date?: string) => void;
  onMarkDecision: (offer: Offer, decision: 'accepted' | 'lost', date?: string) => void;
  onRevertToSent: (offer: Offer) => void;
  onRevertToDraft: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onDownload: (offer: Offer) => void;
  onRegeneratePdf?: (offer: Offer) => void;
};

/**
 * OffersCardGrid - Card grid with enhanced accessibility
 *
 * Provides a grid layout for offer cards with proper ARIA attributes
 * and keyboard navigation support. Cards contain multiple interactive
 * elements, so focus management is handled within each card.
 */
export function OffersCardGrid({
  offers,
  updatingId,
  downloadingId,
  deletingId,
  regeneratingId = null,
  onMarkSent,
  onMarkDecision,
  onRevertToSent,
  onRevertToDraft,
  onDelete,
  onDownload,
  onRegeneratePdf,
}: OffersCardGridProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start"
      data-offers-section
      role="list"
      aria-label={t('dashboard.offersList.label') || 'Offers list'}
      aria-busy={updatingId !== null || deletingId !== null}
    >
      {offers.map((offer, index) => (
        <div key={offer.id} role="listitem" aria-posinset={index + 1} aria-setsize={offers.length}>
          <OfferCard
            offer={offer}
            isUpdating={updatingId === offer.id}
            isDownloading={downloadingId === offer.id}
            isDeleting={deletingId === offer.id}
            isRegenerating={regeneratingId === offer.id}
            onMarkSent={onMarkSent}
            onMarkDecision={onMarkDecision}
            onRevertToSent={onRevertToSent}
            onRevertToDraft={onRevertToDraft}
            onDelete={onDelete}
            onDownload={onDownload}
            onRegeneratePdf={onRegeneratePdf}
          />
        </div>
      ))}
    </div>
  );
}
