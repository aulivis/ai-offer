'use client';

import { t } from '@/copy';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { MetricSkeleton } from '@/components/ui/Skeleton';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import DocumentCheckIcon from '@heroicons/react/24/outline/DocumentCheckIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon';
import ArrowsPointingOutIcon from '@heroicons/react/24/outline/ArrowsPointingOutIcon';
import ArrowsPointingInIcon from '@heroicons/react/24/outline/ArrowsPointingInIcon';
import type { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import type { StatusFilterOption } from '@/app/dashboard/types';

type DashboardMetricsSectionProps = {
  loading: boolean;
  isQuotaLoading: boolean;
  totalOffersCount: number;
  stats: DashboardMetrics;
  metricsViewMode: 'detailed' | 'compact';
  kpiScope: 'personal' | 'team';
  teamIds: string[];
  quotaValue: string;
  quotaSnapshot: {
    plan: string;
  } | null;
  acceptanceLabel: string;
  winRateLabel: string;
  avgDecisionLabel: string;
  totalHelper: string;
  createdComparison?: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  onMetricsViewModeChange: (mode: 'detailed' | 'compact') => void;
  onKpiScopeChange: (scope: 'personal' | 'team') => void;
  onMetricClick: (filterStatus: StatusFilterOption) => void;
};

export function DashboardMetricsSection({
  loading,
  isQuotaLoading,
  totalOffersCount,
  stats,
  metricsViewMode,
  kpiScope,
  teamIds,
  quotaValue,
  quotaSnapshot,
  acceptanceLabel,
  winRateLabel,
  avgDecisionLabel,
  totalHelper,
  createdComparison,
  onMetricsViewModeChange,
  onKpiScopeChange,
  onMetricClick,
}: DashboardMetricsSectionProps) {
  return (
    <div className="space-y-6 pb-8 border-b-2 border-border/60">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h4 font-bold text-fg">{t('dashboard.metricsView.title')}</h2>
          <p className="text-body-small text-fg-muted mt-1 leading-typography-normal">
            {t('dashboard.metricsView.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {teamIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-body-small text-fg-muted">Personal</span>
              <button
                type="button"
                onClick={() => {
                  const newScope = kpiScope === 'team' ? 'personal' : 'team';
                  onKpiScopeChange(newScope);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  kpiScope === 'team' ? 'bg-primary' : 'bg-fg-muted'
                }`}
                role="switch"
                aria-checked={kpiScope === 'team'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    kpiScope === 'team' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-body-small text-fg-muted">Team</span>
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              onMetricsViewModeChange(metricsViewMode === 'compact' ? 'detailed' : 'compact')
            }
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-body-small font-semibold text-fg transition hover:border-fg hover:bg-bg/80"
            title={
              metricsViewMode === 'compact'
                ? t('dashboard.metricsView.detailedTitle')
                : t('dashboard.metricsView.compactTitle')
            }
          >
            {metricsViewMode === 'compact' ? (
              <>
                <ArrowsPointingOutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.metricsView.detailed')}</span>
              </>
            ) : (
              <>
                <ArrowsPointingInIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.metricsView.compact')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conversion Funnel Group - Progressive disclosure based on offer count */}
      <div
        className="relative"
        aria-busy={loading || isQuotaLoading}
        aria-live="polite"
        role="status"
        aria-label={loading || isQuotaLoading ? t('common.loading') : undefined}
      >
        <div
          className={`grid gap-3 sm:gap-4 ${
            totalOffersCount < 5
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'
          }`}
        >
          {loading ? (
            <>
              {Array.from({
                length: totalOffersCount < 5 ? 3 : metricsViewMode === 'compact' ? 7 : 8,
              }).map((_, i) => (
                <MetricSkeleton key={i} />
              ))}
            </>
          ) : totalOffersCount < 5 ? (
            <>
              {/* Simplified metrics for users with 1-4 offers */}
              <MetricCard
                label={t('dashboard.metrics.created.label')}
                value={totalOffersCount.toLocaleString('hu-HU')}
                icon={<DocumentTextIcon className="h-7 w-7" aria-hidden="true" />}
                color="primary"
                trend={
                  stats.createdThisMonth > 0
                    ? 'up'
                    : stats.createdThisMonth === 0 && stats.createdLastMonth > 0
                      ? 'down'
                      : 'neutral'
                }
                {...(stats.createdThisMonth > 0
                  ? { trendValue: `+${stats.createdThisMonth}` }
                  : {})}
                onClick={() => onMetricClick('all')}
              />
              <MetricCard
                label={t('dashboard.metrics.sent.label')}
                value={stats.sent.toLocaleString('hu-HU')}
                icon={<PaperAirplaneIcon className="h-7 w-7" aria-hidden="true" />}
                color="info"
                onClick={() => onMetricClick('sent')}
                isEmpty={stats.sent === 0}
                emptyMessage={t('dashboard.metrics.emptyMessages.noSent')}
              />
              <MetricCard
                label={t('dashboard.metrics.accepted.label')}
                value={stats.accepted.toLocaleString('hu-HU')}
                icon={<DocumentCheckIcon className="h-7 w-7" aria-hidden="true" />}
                color="success"
                trend={
                  stats.acceptanceRate !== null && stats.acceptanceRate > 50
                    ? 'up'
                    : stats.acceptanceRate !== null && stats.acceptanceRate < 30
                      ? 'down'
                      : 'neutral'
                }
                {...(acceptanceLabel !== '—' ? { trendValue: acceptanceLabel } : {})}
                onClick={() => onMetricClick('accepted')}
                isEmpty={stats.accepted === 0}
                emptyMessage={t('dashboard.metrics.emptyMessages.noAccepted')}
              />
            </>
          ) : (
            <>
              {/* Full metrics for power users with 5+ offers */}
              {/* PRIMARY METRICS - Top Row: Quota (Featured) + Created Offers (Main KPI) */}
              <div className="col-span-full sm:col-span-2 lg:col-span-4">
                <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 rounded-2xl p-6 text-white shadow-2xl h-full relative overflow-hidden">
                  {/* Decorative pattern */}
                  <div
                    className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"
                    aria-hidden="true"
                  ></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                        <ChartBarIcon className="w-7 h-7" />
                      </div>
                      <div className="text-body-small font-bold uppercase tracking-wide opacity-95">
                        {t('dashboard.metrics.quota.label')}
                      </div>
                    </div>
                    <div className="text-display font-bold mb-3 tracking-tight">{quotaValue}</div>
                    {quotaSnapshot && quotaSnapshot.plan === 'pro' && (
                      <div className="text-body-small font-semibold opacity-90 flex items-center gap-2">
                        <span>{t('dashboard.metrics.quota.proPlanAdvantage')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Created Offers - PRIMARY KPI - Larger, more prominent */}
              <div className="col-span-full sm:col-span-2 lg:col-span-4">
                <div className="relative">
                  {/* Primary metric badge */}
                  <div className="absolute -top-2 -left-2 z-10 bg-primary text-white text-caption font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-lg">
                    Fő Mutató
                  </div>
                  <MetricCard
                    label={t('dashboard.metrics.created.label')}
                    value={totalOffersCount.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: totalHelper } : {})}
                    icon={<DocumentTextIcon className="h-8 w-8" aria-hidden="true" />}
                    color="primary"
                    trend={
                      stats.createdThisMonth > 0
                        ? 'up'
                        : stats.createdThisMonth === 0 && stats.createdLastMonth > 0
                          ? 'down'
                          : 'neutral'
                    }
                    {...(stats.createdThisMonth > 0
                      ? { trendValue: `+${stats.createdThisMonth}` }
                      : {})}
                    {...(createdComparison ? { comparison: createdComparison } : {})}
                    onClick={() => onMetricClick('all')}
                    isEmpty={totalOffersCount === 0}
                    emptyMessage={t('dashboard.metrics.emptyMessages.noOffers')}
                  />
                </div>
              </div>

              {/* SECONDARY METRICS - Smaller cards in grid */}
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Active Offers (In Review) */}
                <MetricCard
                  label={t('dashboard.metrics.inReview.label')}
                  value={stats.inReview.toLocaleString('hu-HU')}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.inReview.helper', {
                          count: stats.inReview.toLocaleString('hu-HU'),
                        }),
                      }
                    : {})}
                  icon={<EyeIcon className="h-6 w-6" aria-hidden="true" />}
                  color="info"
                  onClick={() => onMetricClick('sent')}
                  isEmpty={stats.inReview === 0}
                  emptyMessage={t('dashboard.metrics.emptyMessages.noInReview')}
                />

                {/* Sent Offers */}
                <MetricCard
                  label={t('dashboard.metrics.sent.label')}
                  value={stats.sent.toLocaleString('hu-HU')}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.sent.helper', {
                          sent: stats.sent.toLocaleString('hu-HU'),
                          pending: stats.inReview.toLocaleString('hu-HU'),
                        }),
                      }
                    : {})}
                  icon={<PaperAirplaneIcon className="h-6 w-6" aria-hidden="true" />}
                  color="info"
                  onClick={() => onMetricClick('sent')}
                  isEmpty={stats.sent === 0}
                  emptyMessage={t('dashboard.metrics.emptyMessages.noSent')}
                />

                {/* Accepted Offers - Secondary priority (larger) */}
                <MetricCard
                  label={t('dashboard.metrics.accepted.label')}
                  value={stats.accepted.toLocaleString('hu-HU')}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.accepted.helper', {
                          accepted: stats.accepted.toLocaleString('hu-HU'),
                          rate: acceptanceLabel,
                        }),
                      }
                    : {})}
                  icon={<DocumentCheckIcon className="h-6 w-6" aria-hidden="true" />}
                  color="success"
                  trend={
                    stats.acceptanceRate !== null && stats.acceptanceRate > 50
                      ? 'up'
                      : stats.acceptanceRate !== null && stats.acceptanceRate < 30
                        ? 'down'
                        : 'neutral'
                  }
                  {...(acceptanceLabel !== '—' ? { trendValue: acceptanceLabel } : {})}
                  onClick={() => onMetricClick('accepted')}
                  isEmpty={stats.accepted === 0}
                  emptyMessage={t('dashboard.metrics.emptyMessages.noAccepted')}
                />

                {/* Lost Offers */}
                <MetricCard
                  label={t('dashboard.metrics.lost.label')}
                  value={stats.lost.toLocaleString('hu-HU')}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.lost.helper', {
                          count: stats.lost.toLocaleString('hu-HU'),
                        }),
                      }
                    : {})}
                  icon={<XCircleIcon className="h-6 w-6" aria-hidden="true" />}
                  color="danger"
                  onClick={() => onMetricClick('lost')}
                  isEmpty={stats.lost === 0}
                  emptyMessage={t('dashboard.metrics.emptyMessages.noLost')}
                />

                {/* Win Rate */}
                <MetricCard
                  label={t('dashboard.metrics.winRate.label')}
                  value={winRateLabel}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.winRate.helper', {
                          rate: winRateLabel !== '—' ? winRateLabel : '—',
                        }),
                      }
                    : {})}
                  icon={<ChartBarIcon className="h-6 w-6" aria-hidden="true" />}
                  color={
                    stats.winRate !== null && stats.winRate > 50
                      ? 'success'
                      : stats.winRate !== null && stats.winRate < 30
                        ? 'danger'
                        : 'warning'
                  }
                  trend={
                    stats.winRate !== null && stats.winRate > 50
                      ? 'up'
                      : stats.winRate !== null && stats.winRate < 30
                        ? 'down'
                        : 'neutral'
                  }
                  {...(winRateLabel !== '—' ? { trendValue: winRateLabel } : {})}
                  isEmpty={stats.winRate === null}
                  emptyMessage={t('dashboard.metrics.emptyMessages.insufficientData')}
                />

                {/* Average Decision Time */}
                <MetricCard
                  label={t('dashboard.metrics.avgDecision.label')}
                  value={avgDecisionLabel}
                  {...(metricsViewMode === 'detailed'
                    ? {
                        helper: t('dashboard.metrics.avgDecision.helper', {
                          days:
                            stats.avgDecisionDays !== null
                              ? stats.avgDecisionDays.toLocaleString('hu-HU', {
                                  maximumFractionDigits: 1,
                                })
                              : '—',
                          drafts: stats.drafts.toLocaleString('hu-HU'),
                        }),
                      }
                    : {})}
                  icon={<ClockIcon className="h-6 w-6" aria-hidden="true" />}
                  color="warning"
                  isEmpty={stats.avgDecisionDays === null}
                  emptyMessage={t('dashboard.metrics.emptyMessages.insufficientData')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
