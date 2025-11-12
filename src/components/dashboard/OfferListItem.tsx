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
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ShareModal } from './ShareModal';

export interface OfferListItemProps {
  offer: Offer;
  isUpdating: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  onMarkSent: (offer: Offer, date?: string) => void;
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
  onMarkSent,
  onMarkDecision,
  onRevertToSent,
  onRevertToDraft,
  onDelete,
  onDownload,
}: OfferListItemProps) {
  const isBusy = isUpdating || isDeleting || isDownloading;
  const isDecided = offer.status === 'accepted' || offer.status === 'lost';
  const companyName = (offer.recipient?.company_name ?? '').trim();
  const initials = useMemo(() => getInitials(companyName), [companyName]);
  const [decisionDate, setDecisionDate] = useState<string>(() => isoDateInput(offer.decided_at));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setDecisionDate(isoDateInput(offer.decided_at));
  }, [offer.decided_at]);

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

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white/90 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md hover:border-primary/20">
      {/* Status indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${
          offer.status === 'draft'
            ? 'bg-amber-400'
            : offer.status === 'sent'
              ? 'bg-blue-400'
              : offer.status === 'accepted'
                ? 'bg-emerald-400'
                : 'bg-rose-400'
        }`}
      />

      <div className="flex items-center gap-3 p-4 pt-5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-3 text-left transition-colors hover:bg-bg-muted/50 rounded-lg p-2 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? t('dashboard.offerCard.collapse') : t('dashboard.offerCard.expand')
          }
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-sky-100 text-sm font-bold text-primary shadow-sm">
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
          <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="truncate text-sm font-bold text-fg">{offer.title || '(névtelen)'}</p>
                <StatusBadge status={offer.status} className="flex-none" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
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
                {offer.industry && (
                  <>
                    <span className="text-fg-muted/50">•</span>
                    <Squares2X2Icon aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
                    <span>{offer.industry}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-fg-muted">
              {offer.sent_at && (
                <div className="flex items-center gap-1.5">
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  <span>{formatDate(offer.sent_at)}</span>
                </div>
              )}
              {offer.decided_at && (
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>{formatDate(offer.decided_at)}</span>
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
        <div className="flex items-center gap-1">
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
          ) : null}
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

              <StatusTimelineItem
                title={t('dashboard.statusSteps.sent.title')}
                dateLabel={formatDate(offer.sent_at)}
                isActive={offer.status === 'sent'}
              >
                {offer.sent_at ? (
                  <CompactDatePicker
                    label={t('dashboard.statusSteps.sent.editDate')}
                    value={isoDateInput(offer.sent_at)}
                    onChange={(value) => onMarkSent(offer, value)}
                    disabled={isBusy}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => onMarkSent(offer)}
                      disabled={isBusy}
                      variant="secondary"
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      title={t('dashboard.statusSteps.sent.markToday')}
                    >
                      {t('dashboard.statusSteps.sent.markToday')}
                    </Button>
                    <CompactDatePicker
                      label={t('dashboard.statusSteps.sent.chooseDate')}
                      value=""
                      onChange={(value) => onMarkSent(offer, value)}
                      disabled={isBusy}
                    />
                  </div>
                )}
              </StatusTimelineItem>

              <StatusTimelineItem
                title={t('dashboard.statusSteps.decision.title')}
                dateLabel={isDecided ? formatDate(offer.decided_at) : '—'}
                isActive={isDecided}
              >
                {isDecided ? (
                  <>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        offer.status === 'accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {offer.status === 'accepted'
                        ? t(DECISION_LABEL_KEYS.accepted)
                        : t(DECISION_LABEL_KEYS.lost)}
                    </span>
                    <CompactDatePicker
                      label={t('dashboard.statusSteps.decision.dateLabel')}
                      value={isoDateInput(offer.decided_at)}
                      onChange={(value) =>
                        onMarkDecision(offer, offer.status as 'accepted' | 'lost', value)
                      }
                      disabled={isBusy}
                    />
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <CompactDatePicker
                      label={t('dashboard.statusSteps.decision.chooseDate')}
                      value={decisionDate}
                      onChange={setDecisionDate}
                      disabled={isBusy}
                    />
                    <Button
                      onClick={() => onMarkDecision(offer, 'accepted', decisionDate || undefined)}
                      disabled={isBusy}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      aria-label={t('dashboard.statusSteps.decision.markAccepted')}
                      title={t('dashboard.statusSteps.decision.markAccepted')}
                    >
                      <CheckIcon aria-hidden="true" className="h-4 w-4" />
                      <span className="sr-only">
                        {t('dashboard.statusSteps.decision.markAccepted')}
                      </span>
                    </Button>
                    <Button
                      onClick={() => onMarkDecision(offer, 'lost', decisionDate || undefined)}
                      disabled={isBusy}
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 rounded-lg border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      aria-label={t('dashboard.statusSteps.decision.markLost')}
                      title={t('dashboard.statusSteps.decision.markLost')}
                    >
                      <XMarkIcon aria-hidden="true" className="h-4 w-4" />
                      <span className="sr-only">
                        {t('dashboard.statusSteps.decision.markLost')}
                      </span>
                    </Button>
                  </div>
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
    <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-border/60 bg-white/90 px-2 text-xs font-semibold text-fg shadow-sm">
      <span className="text-xs">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) return;
          onChange(next);
        }}
        disabled={disabled}
        className="w-auto border-none bg-transparent p-0 text-xs font-semibold text-fg outline-none focus-visible:outline-none"
      />
    </label>
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

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isoDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
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
