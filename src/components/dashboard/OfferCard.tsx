'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { ReactNode, useMemo } from 'react';

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

  return (
    <Card className="group flex h-full flex-col rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-700">
            {initials ? (
              <span aria-hidden="true">{initials}</span>
            ) : (
              <BuildingOffice2Icon aria-hidden="true" className="h-6 w-6 text-blue-500" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate text-base font-semibold text-fg">
              {offer.title || '(névtelen)'}
            </p>
            <p className="truncate text-sm text-fg-muted">{companyName || '—'}</p>
          </div>
        </div>
        <StatusBadge status={offer.status} />
      </div>

      <dl className="grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
        <MetaItem label={t('dashboard.offerCard.created')} value={formatDate(offer.created_at)} />
        <MetaItem
          label={t('dashboard.offerCard.industry')}
          value={offer.industry || t('dashboard.offerCard.industryUnknown')}
        />
        {offer.pdf_url ? (
          <div className="flex flex-col gap-2">
            <dt className="font-medium text-fg-muted">{t('dashboard.offerCard.export')}</dt>
            <dd className="flex flex-wrap gap-2">
              <a
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-bg px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-fg hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href={offer.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DocumentTextIcon aria-hidden="true" className="h-4 w-4" />
                {t('dashboard.offerCard.openPdf')}
              </a>
              <Button
                type="button"
                onClick={() => onDownload(offer)}
                disabled={isBusy}
                loading={isDownloading}
                variant="secondary"
                size="sm"
              >
                <ArrowDownTrayIcon aria-hidden="true" className="h-4 w-4" />
                {t('dashboard.offerCard.savePdf')}
              </Button>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 space-y-3">
        <StatusStep
          title={t('dashboard.statusSteps.sent.title')}
          description={t('dashboard.statusSteps.sent.description')}
          dateLabel={formatDate(offer.sent_at)}
          highlight={offer.status !== 'draft'}
        >
          {offer.sent_at ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg">
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-bg px-3 py-1.5">
                <span>{t('dashboard.statusSteps.sent.editDate')}</span>
                <Input
                  type="date"
                  value={isoDateInput(offer.sent_at)}
                  onChange={(event) => onMarkSent(offer, event.target.value)}
                  disabled={isBusy}
                  wrapperClassName="flex items-center gap-2"
                  className="w-auto rounded-lg border-border bg-white px-2 py-1 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs text-fg">
              <Button
                onClick={() => onMarkSent(offer)}
                disabled={isBusy}
                variant="secondary"
                size="sm"
              >
                {t('dashboard.statusSteps.sent.markToday')}
              </Button>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-bg px-3 py-1.5">
                <span>{t('dashboard.statusSteps.sent.chooseDate')}</span>
                <Input
                  type="date"
                  onChange={(event) => {
                    if (!event.target.value) return;
                    onMarkSent(offer, event.target.value);
                  }}
                  disabled={isBusy}
                  wrapperClassName="flex items-center gap-2"
                  className="w-auto rounded-lg border-border bg-white px-2 py-1 text-xs"
                />
              </div>
            </div>
          )}
        </StatusStep>

        <StatusStep
          title={t('dashboard.statusSteps.decision.title')}
          description={t('dashboard.statusSteps.decision.description')}
          dateLabel={isDecided ? formatDate(offer.decided_at) : '—'}
          highlight={isDecided}
        >
          {isDecided ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-fg">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                  offer.status === 'accepted'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {offer.status === 'accepted'
                  ? t(DECISION_LABEL_KEYS.accepted)
                  : t(DECISION_LABEL_KEYS.lost)}
              </span>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-bg px-3 py-1.5">
                <span>{t('dashboard.statusSteps.decision.dateLabel')}</span>
                <Input
                  type="date"
                  value={isoDateInput(offer.decided_at)}
                  onChange={(event) =>
                    onMarkDecision(offer, offer.status as 'accepted' | 'lost', event.target.value)
                  }
                  disabled={isBusy}
                  wrapperClassName="flex items-center gap-2"
                  className="w-auto rounded-lg border-border bg-white px-2 py-1 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs text-fg">
              <Button
                onClick={() => onMarkDecision(offer, 'accepted')}
                disabled={isBusy}
                variant="secondary"
                size="sm"
                className="text-emerald-600"
              >
                {t('dashboard.statusSteps.decision.markAccepted')}
              </Button>
              <Button
                onClick={() => onMarkDecision(offer, 'lost')}
                disabled={isBusy}
                variant="secondary"
                size="sm"
                className="text-red-600"
              >
                {t('dashboard.statusSteps.decision.markLost')}
              </Button>
            </div>
          )}
        </StatusStep>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs text-fg">
        {offer.status !== 'draft' && (
          <Button
            onClick={() => onRevertToDraft(offer)}
            disabled={isBusy}
            variant="secondary"
            size="sm"
          >
            {t('dashboard.actions.revertToDraft')}
          </Button>
        )}
        {isDecided && (
          <Button
            onClick={() => onRevertToSent(offer)}
            disabled={isBusy}
            variant="secondary"
            size="sm"
          >
            {t('dashboard.actions.revertDecision')}
          </Button>
        )}
        <Button
          onClick={() => onDelete(offer)}
          disabled={isBusy}
          variant="secondary"
          size="sm"
          className="text-red-600"
        >
          {isDeleting ? t('dashboard.actions.deleting') : t('dashboard.actions.deleteOffer')}
        </Button>
      </div>
    </Card>
  );
}

export default OfferCard;

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-medium text-fg-muted">{label}</dt>
      <dd className="text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Offer['status'] }) {
  const map: Record<Offer['status'], string> = {
    draft: 'border-amber-200 bg-amber-50 text-amber-700',
    sent: 'border-blue-200 bg-blue-50 text-blue-700',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    lost: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${map[status]}`}
    >
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}

function StatusStep({
  title,
  description,
  dateLabel,
  highlight = false,
  children,
}: {
  title: string;
  description: string;
  dateLabel: string;
  highlight?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        highlight ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border/70 bg-bg'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${
            highlight ? 'bg-primary' : 'bg-fg-muted/40'
          }`}
          aria-hidden="true"
        />
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-fg">{title}</p>
            <span className="text-xs uppercase tracking-[0.2em] text-fg-muted">
              {dateLabel || '—'}
            </span>
          </div>
          <p className="text-xs text-fg-muted">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
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
