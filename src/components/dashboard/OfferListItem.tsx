'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ArrowDownTrayIcon from '@heroicons/react/24/outline/ArrowDownTrayIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import BuildingOffice2Icon from '@heroicons/react/24/outline/BuildingOffice2Icon';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import UserCircleIcon from '@heroicons/react/24/outline/UserCircleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import type { Offer } from '@/app/dashboard/types';
import { STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { useMemo } from 'react';

export interface OfferListItemProps {
  offer: Offer;
  isUpdating: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  onDelete: (offer: Offer) => void;
  onDownload: (offer: Offer) => void;
}

export function OfferListItem({
  offer,
  isUpdating,
  isDownloading,
  isDeleting,
  onDelete,
  onDownload,
}: OfferListItemProps) {
  const isBusy = isUpdating || isDeleting || isDownloading;
  const companyName = (offer.recipient?.company_name ?? '').trim();
  const initials = useMemo(() => getInitials(companyName), [companyName]);
  const downloadLabel = t('dashboard.offerCard.savePdf');
  const openLabel = t('dashboard.offerCard.openPdf');
  const deleteLabel = isDeleting
    ? t('dashboard.actions.deleting')
    : t('dashboard.actions.deleteOffer');

  const actionButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-white/90 text-fg shadow-sm transition-colors hover:border-primary hover:text-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const actionButtonDisabledClass = 'cursor-not-allowed opacity-60';

  return (
    <Card className="group flex items-center gap-4 overflow-hidden rounded-xl border border-border/60 bg-white/90 p-4 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-sky-100 text-sm font-semibold text-primary">
        {initials ? (
          <span aria-hidden="true" title={companyName || undefined}>
            {initials}
          </span>
        ) : (
          <BuildingOffice2Icon
            aria-hidden="true"
            className="h-5 w-5 text-primary"
            title={companyName || t('dashboard.offerCard.industryUnknown')}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-fg">
            {offer.title || '(névtelen)'}
          </p>
          <StatusBadge status={offer.status} className="flex-none" />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          <div className="flex items-center gap-1">
            <UserCircleIcon aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="truncate">{companyName || '—'}</span>
          </div>
          <span className="text-fg-muted/70">•</span>
          <div className="flex items-center gap-1">
            <CalendarDaysIcon aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{formatDate(offer.created_at)}</span>
          </div>
          {offer.industry && (
            <>
              <span className="text-fg-muted/70">•</span>
              <div className="flex items-center gap-1">
                <Squares2X2Icon aria-hidden="true" className="h-3.5 w-3.5" />
                <span>{offer.industry}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {offer.pdf_url ? (
          <>
            <a
              className={actionButtonClass}
              href={offer.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openLabel}
              title={openLabel}
            >
              <DocumentTextIcon aria-hidden="true" className="h-4 w-4" />
              <span className="sr-only">{openLabel}</span>
            </a>
            <button
              type="button"
              onClick={() => onDownload(offer)}
              disabled={isBusy}
              className={`${actionButtonClass} ${isBusy ? actionButtonDisabledClass : ''}`}
              aria-label={downloadLabel}
              title={downloadLabel}
            >
              {isDownloading ? (
                <ArrowPathIcon aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="sr-only">{downloadLabel}</span>
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onDelete(offer)}
          disabled={isBusy}
          className={`${actionButtonClass} ${isBusy ? actionButtonDisabledClass : ''}`}
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          {isDeleting ? (
            <ArrowPathIcon aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <TrashIcon aria-hidden="true" className="h-4 w-4 text-rose-500" />
          )}
          <span className="sr-only">{deleteLabel}</span>
        </button>
      </div>
    </Card>
  );
}

function StatusBadge({ status, className }: { status: Offer['status']; className?: string }) {
  const map: Record<Offer['status'], string> = {
    draft: 'border-amber-200 bg-amber-100/70 text-amber-700',
    sent: 'border-blue-200 bg-blue-100/70 text-blue-700',
    accepted: 'border-emerald-300 bg-emerald-100/70 text-emerald-800',
    lost: 'border-rose-200 bg-rose-100/70 text-rose-700',
  };

  return (
    <span
      className={`flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur text-center ${map[status]} ${className ?? ''}`}
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  if (!name) {
    return '';
  }
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return '';
  }
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

