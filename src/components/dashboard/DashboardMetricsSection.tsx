'use client';

import { t } from '@/copy';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { MetricSkeleton } from '@/components/ui/Skeleton';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import DocumentCheckIcon from '@heroicons/react/24/outline/DocumentCheckIcon';
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ArrowsPointingOutIcon from '@heroicons/react/24/outline/ArrowsPointingOutIcon';
import ArrowsPointingInIcon from '@heroicons/react/24/outline/ArrowsPointingInIcon';
import type { DashboardMetrics } from '@/hooks/useDashboardMetrics';

type DashboardMetricsSectionProps = {
  stats: DashboardMetrics;
  totalOffersCount: number;
  quotaValue: string;
  quotaSnapshot: {
    plan: 'free' | 'standard' | 'pro';
  } | null;
  metricsViewMode: 'detailed' | 'compact';
  loading: boolean;
  isQuotaLoading: boolean;
  onMetricClick: (filterStatus: 'all' | 'draft' | 'sent' | 'accepted' | 'lost') => void;
  onToggleMetricsView: () => void;
  kpiScope: 'personal' | 'team';
  teamIds: string[];
  onToggleKpiScope: () => void;
};

export function DashboardMetricsSection({
  stats,
  totalOffersCount,
  quotaValue,
  quotaSnapshot,
  metricsViewMode,
  loading,
  isQuotaLoading,
  onMetricClick,
  onToggleMetricsView,
  kpiScope,
  teamIds,
  onToggleKpiScope,
}: DashboardMetricsSectionProps) {
  const acceptanceLabel =
    stats.acceptanceRate !== null
      ? `${stats.acceptanceRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
      : '—';
  const winRateLabel =
    stats.winRate !== null
      ? `${stats.winRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
      : '—';
  const avgDecisionLabel =
    stats.avgDecisionDays !== null
      ? `${stats.avgDecisionDays.toLocaleString('hu-HU', { maximumFractionDigits: 1 })} nap`
      : '—';

  const monthlyHelper = t('dashboard.metrics.created.monthlyHelper', {
    count: stats.createdThisMonth.toLocaleString('hu-HU'),
  });
  const totalHelper = t('dashboard.metrics.created.totalHelper', {
    displayed: totalOffersCount.toLocaleString('hu-HU'),
    total: totalOffersCount.toLocaleString('hu-HU'),
    monthly: monthlyHelper,
  });

  const createdComparison =
    stats.createdLastMonth > 0
      ? {
          label: 'Előző hónap',
          value: stats.createdLastMonth.toLocaleString('hu-HU'),
          trend:
            stats.createdThisMonth > stats.createdLastMonth
              ? ('up' as const)
              : stats.createdThisMonth < stats.createdLastMonth
                ? ('down' as const)
                : ('neutral' as const),
        }
      : undefined;

  return (
    <div className="space-y-6 pb-8 border-b border-border/40">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-fg">{t('dashboard.metricsView.title')}</h2>
          <p className="text-sm text-fg-muted mt-1">{t('dashboard.metricsView.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {teamIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-fg-muted">Personal</span>
              <button
                type="button"
                onClick={onToggleKpiScope}
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
              <span className="text-sm text-fg-muted">Team</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleMetricsView}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg hover:bg-bg/80"
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

      {/* Conversion Funnel Group */}
      <div className="relative" aria-busy={loading || isQuotaLoading} aria-live="polite">
        <div
          className={`grid gap-4 ${
            totalOffersCount < 5
              ? 'grid-cols-1 sm:grid-cols-3'
              : metricsViewMode === 'compact'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8'
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
              {/* Quota Card - Featured */}
              <div className="sm:col-span-2">
                <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold opacity-90">
                      {t('dashboard.metrics.quota.label')}
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-4">{quotaValue}</div>
                  {quotaSnapshot && quotaSnapshot.plan === 'pro' && (
                    <div className="text-sm opacity-80 flex items-center gap-2">
                      <span>Pro csomag előny</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Created Offers */}
              <MetricCard
                label={t('dashboard.metrics.created.label')}
                value={totalOffersCount.toLocaleString('hu-HU')}
                {...(metricsViewMode === 'detailed' ? { helper: totalHelper } : {})}
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
                {...(createdComparison ? { comparison: createdComparison } : {})}
                onClick={() => onMetricClick('all')}
                isEmpty={totalOffersCount === 0}
                emptyMessage={t('dashboard.metrics.emptyMessages.noOffers')}
              />

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
                icon={<EyeIcon className="h-7 w-7" aria-hidden="true" />}
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
                icon={<PaperAirplaneIcon className="h-7 w-7" aria-hidden="true" />}
                color="info"
                onClick={() => onMetricClick('sent')}
                isEmpty={stats.sent === 0}
                emptyMessage={t('dashboard.metrics.emptyMessages.noSent')}
              />

              {/* Accepted Offers */}
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
                icon={<XCircleIcon className="h-7 w-7" aria-hidden="true" />}
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
                icon={<ChartBarIcon className="h-7 w-7" aria-hidden="true" />}
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
                icon={<ClockIcon className="h-7 w-7" aria-hidden="true" />}
                color="warning"
                isEmpty={stats.avgDecisionDays === null}
                emptyMessage={t('dashboard.metrics.emptyMessages.insufficientData')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
