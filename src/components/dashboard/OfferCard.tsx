'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ArrowDownTrayIcon from '@heroicons/react/24/outline/ArrowDownTrayIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import BuildingOffice2Icon from '@heroicons/react/24/outline/BuildingOffice2Icon';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import UserCircleIcon from '@heroicons/react/24/outline/UserCircleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { useEffect, useMemo, useState } from 'react';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import { ShareModal } from './ShareModal';

export interface OfferCardProps {
  offer: Offer;
  isUpdating: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  isRegenerating?: boolean;
  onMarkSent: (offer: Offer, date?: string) => void;
  onMarkDecision: (offer: Offer, decision: 'accepted' | 'lost', date?: string) => void;
  onRevertToSent: (offer: Offer) => void;
  onRevertToDraft: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  onDownload: (offer: Offer) => void;
  onRegeneratePdf?: (offer: Offer) => void;
}

type TimelineKey = 'draft' | 'sent' | 'decision';
type TimelineStatus = 'complete' | 'current' | 'upcoming';

export function OfferCard({
  offer,
  isUpdating,
  isDownloading,
  isDeleting,
  isRegenerating = false,
  onMarkSent,
  onMarkDecision,
  onRevertToSent,
  onRevertToDraft,
  onDelete,
  onDownload,
  onRegeneratePdf,
}: OfferCardProps) {
  const isBusy = isUpdating || isDeleting || isDownloading || isRegenerating;
  const isDecided = offer.status === 'accepted' || offer.status === 'lost';
  const companyName = (offer.recipient?.company_name ?? '').trim();
  const initials = useMemo(() => getInitials(companyName), [companyName]);
  const [decisionDate, setDecisionDate] = useState<string>(() => isoDateInput(offer.decided_at));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const timelineStates: Record<TimelineKey, TimelineStatus> = {
    draft: getTimelineStatus('draft', offer.status),
    sent: getTimelineStatus('sent', offer.status),
    decision: getTimelineStatus('decision', offer.status),
  };
  const statusTheme = STATUS_CARD_THEMES[offer.status];
  const showRevertToDraft = offer.status !== 'draft';
  const showRevertDecision = isDecided;
  const downloadLabel = t('dashboard.offerCard.savePdf');
  const openLabel = t('dashboard.offerCard.openPdf');
  const shareLabel = 'Megosztás';
  const regenerateLabel = 'PDF újragenerálása';
  const deleteLabel = isDeleting
    ? t('dashboard.actions.deleting')
    : t('dashboard.actions.deleteOffer');

  useEffect(() => {
    setDecisionDate(isoDateInput(offer.decided_at));
  }, [offer.decided_at]);

  const actionButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/90 text-fg shadow-sm transition-colors hover:border-primary hover:text-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const actionButtonDisabledClass = 'cursor-not-allowed opacity-60';

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/90 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg hover:border-primary/30">
      {/* Enhanced Header with Status Indicator */}
      <div className="relative">
        {/* Status indicator bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            offer.status === 'draft'
              ? 'bg-amber-400'
              : offer.status === 'sent'
                ? 'bg-blue-400'
                : offer.status === 'accepted'
                  ? 'bg-emerald-400'
                  : 'bg-rose-400'
          }`}
        />

        <div className="flex items-start gap-2 p-4 pt-5">
          <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-sky-100 text-sm font-bold text-primary shadow-sm shrink-0">
            {initials ? (
              <span aria-hidden="true" title={companyName || undefined}>
                {initials}
              </span>
            ) : (
              <BuildingOffice2Icon
                aria-hidden="true"
                className="h-4 w-4 text-primary"
                title={companyName || t('dashboard.offerCard.industryUnknown')}
              />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-start gap-2 mb-1.5">
              <p
                className="truncate text-sm font-bold text-fg leading-tight flex-1 min-w-0"
                title={offer.title || undefined}
              >
                {offer.title || '(névtelen)'}
              </p>
              <StatusBadge status={offer.status} className="flex-none shrink-0 mt-0.5" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              {companyName && (
                <>
                  <UserCircleIcon aria-hidden="true" className="h-3.5 w-3.5 flex-none shrink-0" />
                  <span className="truncate font-medium max-w-[140px]" title={companyName}>
                    {companyName}
                  </span>
                </>
              )}
              {offer.created_at && (
                <>
                  <span className="text-fg-muted/50 shrink-0">•</span>
                  <CalendarDaysIcon aria-hidden="true" className="h-3.5 w-3.5 flex-none shrink-0" />
                  <span className="whitespace-nowrap shrink-0">{formatDate(offer.created_at)}</span>
                </>
              )}
              {offer.industry && (
                <>
                  <span className="text-fg-muted/50 shrink-0">•</span>
                  <Squares2X2Icon aria-hidden="true" className="h-3.5 w-3.5 flex-none shrink-0" />
                  <span className="truncate max-w-[120px]" title={offer.industry}>
                    {offer.industry}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {offer.pdf_url ? (
              <>
                <a
                  className={`${actionButtonClass} hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600`}
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
                  className={`${actionButtonClass} hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 ${isBusy ? actionButtonDisabledClass : ''}`}
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
            ) : (
              onRegeneratePdf && (
                <button
                  type="button"
                  onClick={() => onRegeneratePdf(offer)}
                  disabled={isBusy}
                  className={`${actionButtonClass} hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 ${isBusy ? actionButtonDisabledClass : ''}`}
                  aria-label={regenerateLabel}
                  title={regenerateLabel}
                >
                  {isRegenerating ? (
                    <ArrowPathIcon aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <DocumentTextIcon aria-hidden="true" className="h-4 w-4" />
                  )}
                  <span className="sr-only">{regenerateLabel}</span>
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              disabled={isBusy}
              className={`${actionButtonClass} hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 ${isBusy ? actionButtonDisabledClass : ''}`}
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
              className={`${actionButtonClass} hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 ${isBusy ? actionButtonDisabledClass : ''}`}
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
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`${actionButtonClass} hover:bg-bg-muted`}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? t('dashboard.offerCard.collapse') : t('dashboard.offerCard.expand')
              }
            >
              <ChevronDownIcon
                className={`h-4 w-4 text-fg-muted transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content - Collapsible - Compact Design */}
      {isExpanded && (
        <div className="border-t border-border/60 px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Compact Status Timeline */}
            <section className={`rounded-lg border p-3 ${statusTheme.container}`}>
              <div className="space-y-2">
                {/* Draft Status - Always shown */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        timelineStates.draft === 'complete'
                          ? 'bg-primary'
                          : timelineStates.draft === 'current'
                            ? 'bg-primary ring-2 ring-primary/30'
                            : 'bg-border/60'
                      }`}
                    />
                    <span className="text-xs font-semibold text-fg truncate">
                      {t(STATUS_LABEL_KEYS.draft)}
                    </span>
                  </div>
                  <span className="text-xs text-fg-muted whitespace-nowrap">
                    {formatDate(offer.created_at)}
                  </span>
                </div>

                {/* Sent Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        timelineStates.sent === 'complete'
                          ? 'bg-primary'
                          : timelineStates.sent === 'current'
                            ? 'bg-primary ring-2 ring-primary/30'
                            : 'bg-border/60'
                      }`}
                    />
                    <span className="text-xs font-semibold text-fg truncate">
                      {t('dashboard.statusSteps.sent.title')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {offer.sent_at ? (
                      <>
                        <span className="text-xs text-fg-muted whitespace-nowrap">
                          {formatDate(offer.sent_at)}
                        </span>
                        <CompactDatePicker
                          label=""
                          value={isoDateInput(offer.sent_at)}
                          onChange={(value) => onMarkSent(offer, value)}
                          disabled={isBusy}
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => onMarkSent(offer)}
                          disabled={isBusy}
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2 text-xs rounded-lg"
                          title={t('dashboard.statusSteps.sent.markToday')}
                        >
                          {t('dashboard.statusSteps.sent.markToday')}
                        </Button>
                        <CompactDatePicker
                          label=""
                          value=""
                          onChange={(value) => onMarkSent(offer, value)}
                          disabled={isBusy}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        timelineStates.decision === 'complete'
                          ? 'bg-primary'
                          : timelineStates.decision === 'current'
                            ? 'bg-primary ring-2 ring-primary/30'
                            : 'bg-border/60'
                      }`}
                    />
                    <span className="text-xs font-semibold text-fg truncate">
                      {t('dashboard.statusSteps.decision.title')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isDecided ? (
                      <>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                            offer.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {offer.status === 'accepted'
                            ? t(DECISION_LABEL_KEYS.accepted)
                            : t(DECISION_LABEL_KEYS.lost)}
                        </span>
                        <span className="text-xs text-fg-muted whitespace-nowrap">
                          {formatDate(offer.decided_at)}
                        </span>
                        <CompactDatePicker
                          label=""
                          value={isoDateInput(offer.decided_at)}
                          onChange={(value) =>
                            onMarkDecision(offer, offer.status as 'accepted' | 'lost', value)
                          }
                          disabled={isBusy}
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <CompactDatePicker
                          label=""
                          value={decisionDate}
                          onChange={setDecisionDate}
                          disabled={isBusy}
                        />
                        <Button
                          onClick={() =>
                            onMarkDecision(offer, 'accepted', decisionDate || undefined)
                          }
                          disabled={isBusy}
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-0"
                          aria-label={t('dashboard.statusSteps.decision.markAccepted')}
                          title={t('dashboard.statusSteps.decision.markAccepted')}
                        >
                          <CheckIcon aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => onMarkDecision(offer, 'lost', decisionDate || undefined)}
                          disabled={isBusy}
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 rounded-lg border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 p-0"
                          aria-label={t('dashboard.statusSteps.decision.markLost')}
                          title={t('dashboard.statusSteps.decision.markLost')}
                        >
                          <XMarkIcon aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Info - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-2 py-1.5">
                <CalendarDaysIcon className="h-3.5 w-3.5 text-fg-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                    {t('dashboard.offerCard.created')}
                  </p>
                  <p className="text-xs font-semibold text-fg truncate">
                    {formatDate(offer.created_at)}
                  </p>
                </div>
              </div>
              {offer.industry && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-2 py-1.5">
                  <Squares2X2Icon className="h-3.5 w-3.5 text-fg-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                      {t('dashboard.offerCard.industry')}
                    </p>
                    <p className="text-xs font-semibold text-fg truncate">{offer.industry}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Compact */}
            {(showRevertToDraft || showRevertDecision) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {showRevertToDraft && (
                  <Button
                    onClick={() => onRevertToDraft(offer)}
                    disabled={isBusy}
                    variant="secondary"
                    size="sm"
                    className="h-7 px-3 text-xs rounded-lg"
                  >
                    {t('dashboard.actions.revertToDraft')}
                  </Button>
                )}
                {showRevertDecision && (
                  <Button
                    onClick={() => onRevertToSent(offer)}
                    disabled={isBusy}
                    variant="secondary"
                    size="sm"
                    className="h-7 px-3 text-xs rounded-lg"
                  >
                    {t('dashboard.actions.revertDecision')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ShareModal
        offerId={offer.id}
        offerTitle={offer.title || 'Névtelen ajánlat'}
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </Card>
  );
}

export default OfferCard;

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
const STATUS_CARD_THEMES: Record<
  Offer['status'],
  { container: string; accentText: string; accentIcon: string }
> = {
  draft: {
    container: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/40',
    accentText: 'text-amber-600',
    accentIcon: 'text-amber-500',
  },
  sent: {
    container: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/40',
    accentText: 'text-sky-600',
    accentIcon: 'text-sky-500',
  },
  accepted: {
    container: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40',
    accentText: 'text-emerald-700',
    accentIcon: 'text-emerald-600',
  },
  lost: {
    container: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100/40',
    accentText: 'text-rose-700',
    accentIcon: 'text-rose-600',
  },
};

function CompactDatePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border/60 bg-white/90 px-2 text-xs font-medium text-fg shadow-sm hover:border-primary/60 transition-colors">
      {label && <span className="text-[10px] text-fg-muted">{label}</span>}
      <input
        type="date"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) return;
          onChange(next);
        }}
        disabled={disabled}
        className="w-auto min-w-[100px] border-none bg-transparent p-0 text-xs font-semibold text-fg outline-none focus-visible:outline-none"
        title={value || 'Válassz dátumot'}
      />
    </label>
  );
}

function getTimelineStatus(step: TimelineKey, status: Offer['status']): TimelineStatus {
  switch (step) {
    case 'draft':
      return status === 'draft' ? 'current' : 'complete';
    case 'sent':
      if (status === 'draft') return 'upcoming';
      if (status === 'sent') return 'current';
      return 'complete';
    case 'decision':
      if (status === 'accepted' || status === 'lost') return 'complete';
      if (status === 'sent') return 'current';
      return 'upcoming';
    default:
      return 'upcoming';
  }
}

function isoDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
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
