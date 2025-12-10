'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import AppFrame from '@/components/AppFrame';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { t } from '@/copy';
import { useToast } from '@/hooks/useToast';
import { clientLogger } from '@/lib/clientLogger';

interface TelemetryRow {
  templateId: string;
  totalRenders: number;
  successCount: number;
  failureCount: number;
  failureRate: number;
  averageRenderMs: number | null;
  totalRenderMs: number;
  renderSamples: number;
}

interface TelemetrySummary {
  totalRenders: number;
  failureRate: number;
  averageRenderMs: number | null;
}

interface TelemetryResponseBody {
  generatedAt?: string;
  summary?: TelemetrySummary;
  rows?: TelemetryRow[];
  error?: string;
}

const numberFormatter = new Intl.NumberFormat('hu-HU');
const percentFormatter = new Intl.NumberFormat('hu-HU', {
  style: 'percent',
  maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat('hu-HU', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

function formatAverageDuration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return `${Math.round(value).toLocaleString('hu-HU')} ms`;
}

function formatFailureRate(value: number): string {
  return percentFormatter.format(Math.max(0, Math.min(1, value)));
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-caption font-semibold uppercase tracking-[0.3em] text-fg-muted">{label}</p>
      <p className="mt-3 text-h3 font-semibold text-fg">{value}</p>
      {helper ? (
        <p className="mt-2 text-caption text-fg-muted leading-typography-normal">{helper}</p>
      ) : null}
    </Card>
  );
}

export default function TemplateTelemetryPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [summary, setSummary] = useState<TelemetrySummary>({
    totalRenders: 0,
    failureRate: 0,
    averageRenderMs: null,
  });
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTelemetryFetch = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetch('/api/admin/template-telemetry', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as TelemetryResponseBody;
        setRows(Array.isArray(payload.rows) ? payload.rows : []);
        setSummary(
          payload.summary ?? {
            totalRenders: 0,
            failureRate: 0,
            averageRenderMs: null,
          },
        );
        setGeneratedAt(payload.generatedAt ?? new Date().toISOString());
      } catch (error) {
        clientLogger.error('Failed to load template telemetry', error);
        showToast({
          title: t('adminTelemetry.toast.loadError.title'),
          description: t('adminTelemetry.toast.loadError.description'),
          variant: 'error',
        });
      } finally {
        if (mode === 'initial') {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [showToast],
  );

  useEffect(() => {
    void handleTelemetryFetch('initial');
  }, [handleTelemetryFetch]);

  const formattedGeneratedAt = useMemo(() => {
    if (!generatedAt) {
      return null;
    }

    const date = new Date(generatedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return dateTimeFormatter.format(date);
  }, [generatedAt]);

  const isEmpty = !isLoading && rows.length === 0;

  return (
    <AppFrame
      title={t('adminTelemetry.title')}
      description={t('adminTelemetry.description')}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {formattedGeneratedAt ? (
            <span className="text-caption font-medium uppercase tracking-[0.3em] text-fg-muted">
              {t('adminTelemetry.lastUpdated', { time: formattedGeneratedAt })}
            </span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            onClick={() => handleTelemetryFetch('refresh')}
          >
            {t('adminTelemetry.actions.refresh')}
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label={t('adminTelemetry.metrics.totalRenders')}
          value={numberFormatter.format(summary.totalRenders)}
          helper={t('adminTelemetry.metrics.totalRendersHelper')}
        />
        <MetricCard
          label={t('adminTelemetry.metrics.failureRate')}
          value={formatFailureRate(summary.failureRate)}
          helper={t('adminTelemetry.metrics.failureRateHelper')}
        />
        <MetricCard
          label={t('adminTelemetry.metrics.averageRenderTime')}
          value={formatAverageDuration(summary.averageRenderMs)}
          helper={t('adminTelemetry.metrics.averageRenderTimeHelper')}
        />
      </section>

      <Card as="section" aria-busy={isLoading} className="overflow-hidden">
        <div className="border-b border-border bg-bg/70 px-5 py-4">
          <h2 className="text-body-small font-semibold text-fg">
            {t('adminTelemetry.table.title')}
          </h2>
          <p className="mt-1 text-caption text-fg-muted leading-typography-normal">
            {t('adminTelemetry.table.description')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-body-small">
            <thead className="bg-bg-muted/50 text-left uppercase tracking-[0.2em] text-[0.65rem] text-fg-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.template')}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.totalRenders')}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.successes')}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.failures')}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.failureRate')}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {t('adminTelemetry.table.columns.averageRenderTime')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {isEmpty ? (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-body-small text-fg-muted">
                    {t('adminTelemetry.table.empty')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.templateId}>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-caption text-fg">
                      {row.templateId}
                    </td>
                    <td className="px-5 py-4 text-fg">
                      {numberFormatter.format(row.totalRenders)}
                    </td>
                    <td className="px-5 py-4 text-success">
                      {numberFormatter.format(row.successCount)}
                    </td>
                    <td className="px-5 py-4 text-danger">
                      {numberFormatter.format(row.failureCount)}
                    </td>
                    <td className="px-5 py-4 text-fg">{formatFailureRate(row.failureRate)}</td>
                    <td className="px-5 py-4 text-fg">
                      {formatAverageDuration(row.averageRenderMs)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppFrame>
  );
}
