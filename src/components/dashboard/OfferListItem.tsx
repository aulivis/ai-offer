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
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ShareModal } from './ShareModal';
import {
  formatViewCount,
  formatAcceptanceTime,
  getShareExpiryInfo,
} from '@/lib/utils/offerMetrics';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';

export interface OfferListItemProps {
  offer: Offer;
  isUpdating: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  onMarkDecision: (offer: Offer, decision: 'accepted' | 'lost', date?: string) => void;
  onRevertToSent: (offer: Offer) => void;
  onRevertToDraft: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onDownload: (offer: Offer) => void;
}

export function OfferListItem({
  offer,
  isUpdating,
  isDownloading,
  isDeleting,
  onMarkDecision: _onMarkDecision,
  onRevertToSent,
  onRevertToDraft,
  onDelete,
  onDownload,
}: OfferListItemProps) {
  const isBusy = isUpdating || isDeleting || isDownloading;
  const isDecided = offer.status === 'accepted' || offer.status === 'lost';
  const companyName = (offer.recipient?.company_name ?? '').trim();
  const initials = useMemo(() => getInitials(companyName), [companyName]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const downloadLabel = t('dashboard.offerCard.savePdf');
  const openLabel = t('dashboard.offerCard.openPdf');
  const shareLabel = 'Megosztás';
  const deleteLabel = isDeleting
    ? t('dashboard.actions.deleting')
    : t('dashboard.actions.deleteOffer');

  const actionButtonClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-white/90 text-fg shadow-sm transition-colors hover:border-primary hover:text-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const actionButtonDisabledClass = 'cursor-not-allowed opacity-60';
  const statusTheme = STATUS_CARD_THEMES[offer.status];
  const expiryInfo = getShareExpiryInfo(offer.share_expiry_status, offer.earliest_expires_at);

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md hover:border-primary/20">
      {/* Status indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          offer.status === 'draft'
            ? 'bg-warning'
            : offer.status === 'sent'
              ? 'bg-primary'
              : offer.status === 'accepted'
                ? 'bg-success'
                : 'bg-danger'
        }`}
      />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-1 items-start gap-3 text-left transition-colors hover:bg-bg-muted/50 rounded-lg p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? t('dashboard.offerCard.collapse') : t('dashboard.offerCard.expand')
            }
          >
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-bg-muted text-sm font-bold text-primary shadow-sm">
              {initials ? (
                <span aria-hidden="true" title={companyName || undefined}>
                  {initials}
                </span>
              ) : (
                <BuildingOffice2Icon
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                  title={companyName || ''}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="truncate text-sm font-bold text-fg">{offer.title || '(névtelen)'}</p>
                <StatusBadge status={offer.status} className="flex-none" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted mb-2">
                {companyName && (
                  <>
                    <UserCircleIcon aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
                    <span className="truncate font-medium">{companyName}</span>
                  </>
                )}
                {offer.created_at && (
                  <>
                    <span className="text-fg-muted/50">•</span>
                    <CalendarDaysIcon aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
                    <span>{formatDate(offer.created_at)}</span>
                  </>
                )}
              </div>
              {/* Metrics Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                  <EyeIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">
                    {formatViewCount(offer.view_count)} megtekintés
                  </span>
                </div>
                {offer.status === 'accepted' && offer.acceptance_time_days !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <ClockIcon className="h-3.5 w-3.5 text-success" />
                    <span className="font-medium">
                      {formatAcceptanceTime(offer.acceptance_time_days)} alatt elfogadva
                    </span>
                  </div>
                )}
                {offer.share_expiry_status !== 'none' && (
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium border ${expiryInfo.bgColor} ${expiryInfo.color}`}
                  >
                    {expiryInfo.icon === 'expired' ? (
                      <ExclamationTriangleIcon className="h-3 w-3" />
                    ) : (
                      <LinkIcon className="h-3 w-3" />
                    )}
                    <span>{expiryInfo.label}</span>
                  </div>
                )}
              </div>
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 text-fg-muted transition-transform duration-200 flex-none ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {offer.pdf_url ? (
            <>
              <a
                className={`${actionButtonClass} hover:bg-primary/10 hover:border-primary/50 hover:text-primary`}
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
                className={`${actionButtonClass} hover:bg-success/10 hover:border-success/50 hover:text-success ${isBusy ? actionButtonDisabledClass : ''}`}
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
            onClick={() => setIsShareModalOpen(true)}
            disabled={isBusy}
            className={`${actionButtonClass} hover:bg-accent/10 hover:border-accent/50 hover:text-accent ${isBusy ? actionButtonDisabledClass : ''}`}
            aria-label={shareLabel}
            title={shareLabel}
          >
            <LinkIcon aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only">{shareLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(offer)}
            disabled={isBusy}
            className={`${actionButtonClass} hover:bg-danger/10 hover:border-danger/50 hover:text-danger ${isBusy ? actionButtonDisabledClass : ''}`}
            aria-label={deleteLabel}
            title={deleteLabel}
          >
            {isDeleting ? (
              <ArrowPathIcon aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="sr-only">{deleteLabel}</span>
          </button>
        </div>
      </div>

      <ShareModal
        offerId={offer.id}
        offerTitle={offer.title || 'Névtelen ajánlat'}
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {isExpanded && (
        <div className="border-t border-border/60 px-3 py-3">
          <section
            className={`flex flex-col gap-3 rounded-xl border p-4 shadow-inner ${statusTheme.container}`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] ${statusTheme.accentText}`}
            >
              <ClockIcon aria-hidden="true" className={`h-4 w-4 ${statusTheme.accentIcon}`} />
              <span>{t('dashboard.filters.sortBy.options.status')}</span>
            </div>

            <div className="space-y-3">
              <StatusTimelineItem
                title={t(STATUS_LABEL_KEYS.draft)}
                dateLabel={formatDate(offer.created_at)}
                isActive={offer.status === 'draft'}
              />

              {/* Sent Status - Removed: sent_at is no longer used */}

              <StatusTimelineItem
                title={t('dashboard.statusSteps.decision.title')}
                dateLabel={isDecided ? formatDate(offer.decided_at) : '—'}
                isActive={isDecided}
              >
                {isDecided && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      offer.status === 'accepted'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {offer.status === 'accepted'
                      ? t(DECISION_LABEL_KEYS.accepted)
                      : t(DECISION_LABEL_KEYS.lost)}
                  </span>
                )}
              </StatusTimelineItem>
            </div>
          </section>

          {(offer.status !== 'draft' || isDecided) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-fg">
              {offer.status !== 'draft' ? (
                <Button
                  onClick={() => onRevertToDraft(offer)}
                  disabled={isBusy}
                  variant="secondary"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  {t('dashboard.actions.revertToDraft')}
                </Button>
              ) : null}
              {isDecided ? (
                <Button
                  onClick={() => onRevertToSent(offer)}
                  disabled={isBusy}
                  variant="secondary"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  {t('dashboard.actions.revertDecision')}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StatusBadge({ status, className }: { status: Offer['status']; className?: string }) {
  const map: Record<Offer['status'], string> = {
    draft: 'border-warning/30 bg-warning/10 text-warning',
    sent: 'border-primary/30 bg-primary/10 text-primary',
    accepted: 'border-success/30 bg-success/10 text-success',
    lost: 'border-danger/30 bg-danger/10 text-danger',
  };

  return (
    <span
      className={`flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur text-center ${map[status]} ${className ?? ''}`}
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function StatusTimelineItem({
  title,
  dateLabel,
  children,
}: {
  title: string;
  dateLabel: string;
  isActive?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-white/80 p-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-fg">{title}</p>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-fg-muted">
            {dateLabel || '—'}
          </span>
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const STATUS_CARD_THEMES: Record<
  Offer['status'],
  { container: string; accentText: string; accentIcon: string }
> = {
  draft: {
    container: 'border-warning/30 bg-gradient-to-br from-warning/10 via-bg-muted to-warning/5',
    accentText: 'text-warning',
    accentIcon: 'text-warning',
  },
  sent: {
    container: 'border-primary/30 bg-gradient-to-br from-primary/10 via-bg-muted to-primary/5',
    accentText: 'text-primary',
    accentIcon: 'text-primary',
  },
  accepted: {
    container: 'border-success/30 bg-gradient-to-br from-success/10 via-bg-muted to-success/5',
    accentText: 'text-success',
    accentIcon: 'text-success',
  },
  lost: {
    container: 'border-danger/30 bg-gradient-to-br from-danger/10 via-bg-muted to-danger/5',
    accentText: 'text-danger',
    accentIcon: 'text-danger',
  },
};

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
