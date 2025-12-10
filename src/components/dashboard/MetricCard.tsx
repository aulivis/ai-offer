'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';

export type MetricCardProps = {
  /** Label text */
  label: string;
  /** Value to display */
  value: string;
  /** Helper text */
  helper?: React.ReactNode;
  /** Progress indicator (used/limit) */
  progress?: { used: number; limit: number | null; label?: string };
  /** Icon to display */
  icon?: React.ReactNode;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value */
  trendValue?: string;
  /** Color theme */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Click handler */
  onClick?: () => void;
  /** Quick action button */
  quickAction?: { label: string; onClick: () => void; icon?: React.ReactNode };
  /** Comparison data */
  comparison?: { label: string; value: string; trend: 'up' | 'down' | 'neutral' };
  /** Empty state */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
};

/**
 * MetricCard component for displaying KPIs and metrics
 *
 * Displays a metric with optional icon, trend, progress, and actions.
 * Supports empty states and interactive behavior.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Total Offers"
 *   value="42"
 *   icon={<ChartBarIcon />}
 *   trend="up"
 *   trendValue="+12%"
 *   onClick={() => navigate('/offers')}
 * />
 *
 * <MetricCard
 *   label="Usage"
 *   value="75%"
 *   progress={{ used: 75, limit: 100 }}
 *   color="warning"
 * />
 * ```
 */
export function MetricCard({
  label,
  value,
  helper,
  progress,
  icon,
  trend,
  trendValue,
  color = 'primary',
  onClick,
  quickAction,
  comparison,
  isEmpty = false,
  emptyMessage,
}: MetricCardProps) {
  const progressPercentage =
    progress && progress.limit !== null
      ? Math.min((progress.used / progress.limit) * 100, 100)
      : null;

  const iconColors = {
    primary: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-warning',
    danger: 'text-rose-600',
    info: 'text-primary',
  };

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-fg-muted',
  };

  const isEmptyState = isEmpty && (value === '—' || value === '0' || !value);

  return (
    <Card
      className={`group relative overflow-hidden p-4 sm:p-5 transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5 ring-1 ring-transparent hover:ring-primary/20'
          : 'hover:shadow-lg'
      } ${isEmptyState ? 'opacity-75' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${label}: ${value}. Kattintson a szűréshez.` : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            {icon && <div className={`flex-shrink-0 ${iconColors[color]} mt-0.5`}>{icon}</div>}
            <p className="text-caption sm:text-caption font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-fg-muted leading-typography-tight break-words min-w-0 flex-1">
              {label}
              {onClick && (
                <span
                  className="ml-2 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden="true"
                >
                  (kattintás a szűréshez)
                </span>
              )}
            </p>
          </div>
          {isEmptyState && emptyMessage ? (
            <div className="mt-2.5 sm:mt-3">
              <p className="text-body sm:text-body-large font-semibold text-fg-muted">{value}</p>
              <p className="mt-1.5 sm:mt-2 text-body-small leading-typography-relaxed text-fg-muted break-words">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 flex-wrap">
                <p className="text-h3 sm:text-h3 font-bold text-fg break-words">{value}</p>
                {trend && trendValue && (
                  <span
                    className={`text-body-small sm:text-body font-semibold flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${trendColors[trend]}`}
                  >
                    {trend === 'up' ? (
                      <svg
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    ) : trend === 'down' ? (
                      <svg
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-3 w-3 sm:h-4 sm:w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14"
                        />
                      </svg>
                    )}
                    {trendValue}
                  </span>
                )}
              </div>
              {comparison && (
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-caption sm:text-body-small flex-wrap">
                  <span className="text-fg-muted">{comparison.label}:</span>
                  <span
                    className={`font-semibold flex items-center gap-0.5 sm:gap-1 ${
                      comparison.trend === 'up'
                        ? 'text-emerald-600'
                        : comparison.trend === 'down'
                          ? 'text-rose-600'
                          : 'text-fg-muted'
                    }`}
                  >
                    {comparison.trend === 'up' ? '↑' : comparison.trend === 'down' ? '↓' : '→'}
                    {comparison.value}
                  </span>
                </div>
              )}
              {progressPercentage !== null && progress && (
                <div className="mt-3 sm:mt-4 space-y-1">
                  <div className="flex items-center justify-between text-caption sm:text-body-small">
                    <span className="text-fg-muted">{progress.label || 'Usage'}</span>
                    <span className="font-semibold text-fg break-words">
                      {progress.used.toLocaleString()} / {progress.limit?.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full rounded-full bg-border/60 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        progressPercentage >= 90
                          ? 'bg-danger'
                          : progressPercentage >= 75
                            ? 'bg-warning'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                      aria-label={`${progressPercentage.toFixed(0)}% used`}
                      role="progressbar"
                      aria-valuenow={progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
              {helper && (
                <p className="mt-2.5 sm:mt-3 text-body-small leading-typography-relaxed text-fg-muted break-words hyphens-auto">
                  {helper}
                </p>
              )}
            </>
          )}
        </div>
        {quickAction && (
          <div className="flex-shrink-0 ml-1 sm:ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                quickAction.onClick();
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-border/60 bg-white/90 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-caption sm:text-body-small font-semibold text-fg shadow-sm transition-colors hover:bg-primary/10 hover:border-primary/60 hover:text-primary min-h-[44px] sm:min-h-0"
              title={quickAction.label}
              aria-label={quickAction.label}
            >
              {quickAction.icon}
              <span className="hidden sm:inline">{quickAction.label}</span>
            </button>
          </div>
        )}
      </div>
      {/* Decorative gradient overlay */}
      <div
        className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
      {onClick && (
        <div
          className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/5 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </Card>
  );
}
