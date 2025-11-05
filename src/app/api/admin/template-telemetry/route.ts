import { NextResponse } from 'next/server';

import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { createLogger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

interface TemplateRenderMetricRow {
  template_id: string;
  total_renders: number | string | null;
  success_count: number | string | null;
  failure_count: number | string | null;
  total_render_ms: number | string | null;
  render_samples: number | string | null;
  failure_rate: number | string | null;
  average_render_ms: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

async function handleGet(req: AuthenticatedNextRequest) {
  const requestId = getRequestId(req);
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });
  
  const client = supabaseServiceRole();
  const { data, error } = await client
    .from('template_render_metrics')
    .select('*')
    .order('total_renders', { ascending: false })
    .limit(50);

  if (error) {
    log.error('Failed to load template render metrics', error);
    return NextResponse.json({ error: 'Nem sikerült betölteni a telemetria adatokat.' }, { status: 500 });
  }

  const rows = (data ?? []).map((row: TemplateRenderMetricRow) => {
    const totalRenders = Math.max(0, Math.round(toNumber(row.total_renders)));
    const successCount = Math.max(0, Math.round(toNumber(row.success_count)));
    const failureCount = Math.max(0, Math.round(toNumber(row.failure_count)));
    const totalRenderMs = Math.max(0, Math.round(toNumber(row.total_render_ms)));
    const renderSamples = Math.max(0, Math.round(toNumber(row.render_samples)));
    const failureRate = Math.max(0, Math.min(1, toNumber(row.failure_rate)));
    const averageRenderMs = toNullableNumber(row.average_render_ms);

    return {
      templateId: row.template_id,
      totalRenders,
      successCount,
      failureCount,
      failureRate,
      averageRenderMs,
      totalRenderMs,
      renderSamples,
    };
  });

  const totalRenders = rows.reduce((acc, row) => acc + row.totalRenders, 0);
  const totalFailures = rows.reduce((acc, row) => acc + row.failureCount, 0);
  const totalRenderMs = rows.reduce((acc, row) => acc + row.totalRenderMs, 0);
  const totalSamples = rows.reduce((acc, row) => acc + row.renderSamples, 0);

  const summary = {
    totalRenders,
    failureRate: totalRenders > 0 ? totalFailures / totalRenders : 0,
    averageRenderMs: totalSamples > 0 ? totalRenderMs / totalSamples : null,
  };

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      summary,
      rows,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}

export const GET = withAuth(handleGet);
