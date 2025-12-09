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
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import type { Offer } from '@/app/dashboard/types';
import { DECISION_LABEL_KEYS, STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import { useEffect, useMemo, useState, useCallback } from 'react';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import ChevronDownIcon from '@heroicons/react/24/outline/ChevronDownIcon';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import ClipboardIcon from '@heroicons/react/24/outline/ClipboardIcon';
import { ShareModal } from './ShareModal';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { createClientLogger } from '@/lib/clientLogger';
import {
  formatViewCount,
  formatAcceptanceTime,
  getShareExpiryInfo,
} from '@/lib/utils/offerMetrics';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';

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
  const [defaultShareUrl, setDefaultShareUrl] = useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [isLoadingShareUrl, setIsLoadingShareUrl] = useState(false);
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ component: 'OfferCard', offerId: offer.id }),
    [offer.id],
  );

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

  // Load default share URL
  const loadDefaultShareUrl = useCallback(async () => {
    setIsLoadingShareUrl(true);
    try {
      const response = await fetchWithSupabaseAuth(`/api/offers/${offer.id}/default-share`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setDefaultShareUrl(data.shareUrl || null);
      }
    } catch (error) {
      // Silently fail - share link is optional
      logger.warn('Failed to load default share URL', {
        error:
          error instanceof Error ? { name: error.name, message: error.message } : String(error),
      });
    } finally {
      setIsLoadingShareUrl(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer.id]);

  useEffect(() => {
    loadDefaultShareUrl();
  }, [loadDefaultShareUrl]);

  const copyShareUrl = useCallback(async () => {
    if (!defaultShareUrl) {
      await loadDefaultShareUrl();
      return;
    }

    try {
      await navigator.clipboard.writeText(defaultShareUrl);
      setShareUrlCopied(true);
      showToast({
        title: t('dashboard.offerCard.shareUrlCopied') || 'Link másolva',
        description:
          t('dashboard.offerCard.shareUrlCopiedDesc') || 'A megosztási link a vágólapra másolva.',
        variant: 'success',
      });
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (_error) {
      showToast({
        title: 'Hiba',
        description: 'Nem sikerült másolni a linket.',
        variant: 'error',
      });
    }
  }, [defaultShareUrl, loadDefaultShareUrl, showToast]);

  const expiryInfo = getShareExpiryInfo(offer.share_expiry_status, offer.earliest_expires_at);

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:bg-white/95">
      {/* Enhanced Header with Status Indicator */}
      <div className="relative">
        {/* Status indicator bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            offer.status === 'draft'
              ? 'bg-amber-400'
              : offer.status === 'sent'
                ? 'bg-blue-400'
                : offer.status === 'accepted'
                  ? 'bg-emerald-400'
                  : 'bg-rose-400'
          }`}
        />

        <div className="p-5">
          {/* Main Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-sky-100 text-base font-bold text-primary shadow-sm shrink-0">
              {initials ? (
                <span aria-hidden="true" title={companyName || undefined}>
                  {initials}
                </span>
              ) : (
                <BuildingOffice2Icon
                  aria-hidden="true"
                  className="h-5 w-5 text-primary"
                  title={companyName || ''}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-start gap-2 mb-2">
                <p
                  className="truncate text-base font-bold text-fg leading-tight flex-1 min-w-0"
                  title={offer.title || undefined}
                >
                  {offer.title || '(névtelen)'}
                </p>
                <StatusBadge status={offer.status} className="flex-none shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                {companyName && (
                  <>
                    <UserCircleIcon aria-hidden="true" className="h-4 w-4 flex-none shrink-0" />
                    <span className="truncate font-medium" title={companyName}>
                      {companyName}
                    </span>
                  </>
                )}
                {offer.created_at && (
                  <>
                    <span className="text-fg-muted/50 shrink-0">•</span>
                    <CalendarDaysIcon aria-hidden="true" className="h-4 w-4 flex-none shrink-0" />
                    <span className="whitespace-nowrap shrink-0">
                      {formatDate(offer.created_at)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Bar - Always Visible */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* View Count */}
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-3 py-2 flex-1 min-w-[120px]">
              <EyeIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                  Megtekintés
                </p>
                <p className="text-sm font-bold text-fg truncate">
                  {formatViewCount(offer.view_count)}
                </p>
              </div>
            </div>

            {/* Acceptance Time */}
            {offer.status === 'accepted' && offer.acceptance_time_days !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-3 py-2 flex-1 min-w-[120px]">
                <ClockIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                    Elfogadás
                  </p>
                  <p className="text-sm font-bold text-fg truncate">
                    {formatAcceptanceTime(offer.acceptance_time_days)}
                  </p>
                </div>
              </div>
            )}

            {/* Share Expiry Status */}
            {offer.share_expiry_status !== 'none' && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 min-w-[120px] ${expiryInfo.bgColor}`}
              >
                {expiryInfo.icon === 'expired' ? (
                  <ExclamationTriangleIcon
                    className={`h-4 w-4 ${expiryInfo.color} flex-shrink-0`}
                  />
                ) : (
                  <LinkIcon className={`h-4 w-4 ${expiryInfo.color} flex-shrink-0`} />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                    Megosztás
                  </p>
                  <p className={`text-sm font-bold truncate ${expiryInfo.color}`}>
                    {expiryInfo.label}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {offer.pdf_url ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(offer.pdf_url!, '_blank')}
                  className="h-9 px-3 text-xs rounded-lg border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  aria-label={openLabel}
                  title={openLabel}
                >
                  <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                  Megnyitás
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDownload(offer)}
                  disabled={isBusy}
                  className="h-9 px-3 text-xs rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  aria-label={downloadLabel}
                  title={downloadLabel}
                >
                  {isDownloading ? (
                    <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                  )}
                  Letöltés
                </Button>
              </>
            ) : (
              onRegeneratePdf && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRegeneratePdf(offer)}
                  disabled={isBusy}
                  className="h-9 px-3 text-xs rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  aria-label={regenerateLabel}
                  title={regenerateLabel}
                >
                  {isRegenerating ? (
                    <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                  )}
                  Generálás
                </Button>
              )
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={copyShareUrl}
              disabled={isBusy || isLoadingShareUrl}
              className="h-9 px-3 text-xs rounded-lg border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
              aria-label={shareLabel}
              title={defaultShareUrl ? 'Megosztási link másolása' : shareLabel}
            >
              {isLoadingShareUrl ? (
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
              ) : shareUrlCopied ? (
                <CheckIcon className="h-4 w-4 mr-1.5 text-green-600" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-1.5" />
              )}
              Megosztás
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              disabled={isBusy}
              className="h-9 px-3 text-xs rounded-lg border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              aria-label="Megosztási beállítások"
              title="Megosztási beállítások"
            >
              <ClipboardIcon className="h-4 w-4 mr-1.5" />
              Beállítások
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(offer)}
              disabled={isBusy}
              className="h-9 px-3 text-xs rounded-lg border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              aria-label={deleteLabel}
              title={deleteLabel}
            >
              {isDeleting ? (
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4 mr-1.5" />
              )}
              Törlés
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 px-3 text-xs rounded-lg border-border/60 bg-white hover:bg-bg-muted ml-auto"
              aria-expanded={isExpanded}
              aria-label={
                isExpanded ? t('dashboard.offerCard.collapse') : t('dashboard.offerCard.expand')
              }
            >
              {isExpanded ? 'Összecsukás' : 'Részletek'}
              <ChevronDownIcon
                className={`h-4 w-4 ml-1.5 text-fg-muted transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </Button>
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

            {/* Additional Metrics - Expanded View */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-3 py-2">
                <CalendarDaysIcon className="h-4 w-4 text-fg-muted flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                    Létrehozva
                  </p>
                  <p className="text-xs font-semibold text-fg truncate">
                    {formatDate(offer.created_at)}
                  </p>
                </div>
              </div>
              {offer.sent_at && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/80 px-3 py-2">
                  <PaperAirplaneIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-fg-muted truncate">
                      Elküldve
                    </p>
                    <p className="text-xs font-semibold text-fg truncate">
                      {formatDate(offer.sent_at)}
                    </p>
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
