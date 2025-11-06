'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ArrowDownTrayIcon from '@heroicons/react/24/outline/ArrowDownTrayIcon';
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import BuildingOffice2Icon from '@heroicons/react/24/outline/BuildingOffice2Icon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import UserCircleIcon from '@heroicons/react/24/outline/UserCircleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import CalendarDaysIcon from '@heroicons/react/24/outline/CalendarDaysIcon';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { ComponentType, ReactNode, SVGProps, useEffect, useMemo, useState } from 'react';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';

export interface OfferCardProps {
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

type TimelineKey = 'draft' | 'sent' | 'decision';
type TimelineStatus = 'complete' | 'current' | 'upcoming';

export function OfferCard({
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
}: OfferCardProps) {
  const isBusy = isUpdating || isDeleting || isDownloading;
  const isDecided = offer.status === 'accepted' || offer.status === 'lost';
  const companyName = (offer.recipient?.company_name ?? '').trim();
  const initials = useMemo(() => getInitials(companyName), [companyName]);
  const [decisionDate, setDecisionDate] = useState<string>(() => isoDateInput(offer.decided_at));
  const [isExpanded, setIsExpanded] = useState(false);

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
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/90 shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md">
      {/* Compact Header - Always Visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 p-4 text-left transition-colors hover:bg-bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? t('dashboard.offerCard.collapse') : t('dashboard.offerCard.expand')}
      >
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
            <p className="truncate text-base font-semibold text-fg">
              {offer.title || '(névtelen)'}
            </p>
            <StatusBadge status={offer.status} className="flex-none" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
            <UserCircleIcon aria-hidden="true" className="h-4 w-4 flex-none" />
            <span className="truncate">{companyName || '—'}</span>
            <span className="text-fg-muted/70">•</span>
            <span>{formatDate(offer.created_at)}</span>
            {offer.industry && (
              <>
                <span className="text-fg-muted/70">•</span>
                <span>{offer.industry}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
              onClick={(e) => {
                e.stopPropagation();
                onDelete(offer);
              }}
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
          <ChevronDownIcon
            className={`h-5 w-5 text-fg-muted transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Expanded Content - Collapsible */}
      {isExpanded && (
        <div className="border-t border-border/60 px-4 py-5">
          <div className="flex flex-col gap-5">

            <dl className="grid gap-3 sm:grid-cols-2">
              <MetaItem
                icon={CalendarDaysIcon}
                label={t('dashboard.offerCard.created')}
                value={formatDate(offer.created_at)}
              />
              <MetaItem
                icon={Squares2X2Icon}
                label={t('dashboard.offerCard.industry')}
                value={offer.industry || t('dashboard.offerCard.industryUnknown')}
              />
            </dl>

            <section
              className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-inner ${statusTheme.container}`}
            >
              <div
                className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] ${statusTheme.accentText}`}
              >
                <ClockIcon
                  aria-hidden="true"
                  className={`h-4 w-4 ${statusTheme.accentIcon}`}
                  title={t('dashboard.filters.sortBy.options.status')}
                />
                <span>{t('dashboard.filters.sortBy.options.status')}</span>
              </div>

              <ol className="relative">
                <TimelineStep
                  title={t(STATUS_LABEL_KEYS.draft)}
                  description={t('dashboard.offerCard.created')}
                  dateLabel={formatDate(offer.created_at)}
                  status={timelineStates.draft}
                  isLast={false}
                />
                <TimelineStep
                  title={t('dashboard.statusSteps.sent.title')}
                  description={t('dashboard.statusSteps.sent.description')}
                  dateLabel={formatDate(offer.sent_at)}
                  status={timelineStates.sent}
                  isLast={false}
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
                        className="h-9 rounded-xl"
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
                </TimelineStep>
                <TimelineStep
                  title={t('dashboard.statusSteps.decision.title')}
                  description={t('dashboard.statusSteps.decision.description')}
                  dateLabel={isDecided ? formatDate(offer.decided_at) : '—'}
                  status={timelineStates.decision}
                  isLast
                >
                  {isDecided ? (
                    <>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
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
                        className="h-9 w-9 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        aria-label={t('dashboard.statusSteps.decision.markAccepted')}
                        title={t('dashboard.statusSteps.decision.markAccepted')}
                      >
                        <CheckIcon aria-hidden="true" className="h-5 w-5" />
                        <span className="sr-only">
                          {t('dashboard.statusSteps.decision.markAccepted')}
                        </span>
                      </Button>
                      <Button
                        onClick={() => onMarkDecision(offer, 'lost', decisionDate || undefined)}
                        disabled={isBusy}
                        variant="secondary"
                        size="sm"
                        className="h-9 w-9 rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                        aria-label={t('dashboard.statusSteps.decision.markLost')}
                        title={t('dashboard.statusSteps.decision.markLost')}
                      >
                        <XMarkIcon aria-hidden="true" className="h-5 w-5" />
                        <span className="sr-only">{t('dashboard.statusSteps.decision.markLost')}</span>
                      </Button>
                    </div>
                  )}
                </TimelineStep>
              </ol>
            </section>

            {showRevertToDraft || showRevertDecision ? (
              <div className="flex flex-wrap gap-2 text-xs text-fg">
                {showRevertToDraft ? (
                  <Button
                    onClick={() => onRevertToDraft(offer)}
                    disabled={isBusy}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                  >
                    {t('dashboard.actions.revertToDraft')}
                  </Button>
                ) : null}
                {showRevertDecision ? (
                  <Button
                    onClick={() => onRevertToSent(offer)}
                    disabled={isBusy}
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                  >
                    {t('dashboard.actions.revertDecision')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}

export default OfferCard;

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/80 px-3 py-2 shadow-sm">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
        title={label}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-[0.2em] text-fg-muted">
          {label}
        </dt>
        <dd className="truncate text-sm font-semibold text-fg">{value}</dd>
      </div>
    </div>
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

const indicatorRing: Record<TimelineStatus, string> = {
  complete: 'border-primary/60 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]',
  current: 'border-primary shadow-[0_0_0_4px_rgba(59,130,246,0.18)]',
  upcoming: 'border-border/60 shadow-[0_0_0_4px_rgba(148,163,184,0.12)]',
};

const indicatorDot: Record<TimelineStatus, string> = {
  complete: 'bg-primary',
  current: 'bg-primary',
  upcoming: 'bg-border/60',
};

const trackStyles: Record<TimelineStatus, string> = {
  complete: 'bg-gradient-to-b from-primary/40 via-primary/10 to-transparent',
  current: 'bg-gradient-to-b from-primary/30 via-border/50 to-transparent',
  upcoming: 'bg-border/40',
};

const panelStyles: Record<TimelineStatus, string> = {
  complete: 'border-primary/25 bg-white/95 shadow-sm',
  current: 'border-primary/40 bg-white shadow-md',
  upcoming: 'border-border/50 bg-white/80',
};

function TimelineStep({
  title,
  description,
  dateLabel,
  status,
  isLast = false,
  children,
}: {
  title: string;
  description: string;
  dateLabel: string;
  status: TimelineStatus;
  isLast?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className={`relative flex items-stretch gap-4 ${isLast ? '' : 'pb-6'}`}>
      <div className="flex flex-col items-center">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white ${indicatorRing[status]}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${indicatorDot[status]}`} />
        </span>
        {!isLast ? (
          <span aria-hidden="true" className={`mt-1 flex-1 w-px ${trackStyles[status]}`} />
        ) : null}
      </div>
      <div className="flex-1">
        <div
          className={`rounded-2xl border p-4 backdrop-blur-sm transition ${panelStyles[status]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-fg">{title}</p>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-fg-muted">
              {dateLabel || '—'}
            </span>
          </div>
          <p className="text-xs text-fg-muted">{description}</p>
          {children ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg">{children}</div>
          ) : null}
        </div>
      </div>
    </li>
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
    <label className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-white/90 px-3 text-xs font-semibold text-fg shadow-sm">
      <span>{label}</span>
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
