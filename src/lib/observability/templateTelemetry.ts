import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { logger } from '@/lib/logger';

export type TemplateRenderOutcome = 'success' | 'failure';

export interface TemplateRenderTelemetryEvent {
  templateId: string;
  renderer: string;
  outcome: TemplateRenderOutcome;
  renderMs?: number | null;
  errorCode?: string | null;
}

const TABLE_NAME = 'template_render_events';
const MAX_IDENTIFIER_LENGTH = 255;
const MAX_ERROR_CODE_LENGTH = 120;

function normaliseIdentifier(value: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_IDENTIFIER_LENGTH);
}

function normaliseErrorCode(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MAX_ERROR_CODE_LENGTH);
}

function normaliseDuration(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

export async function recordTemplateRenderTelemetry(
  event: TemplateRenderTelemetryEvent,
): Promise<void> {
  const templateId = normaliseIdentifier(event.templateId);
  const renderer = normaliseIdentifier(event.renderer);

  if (!templateId || !renderer) {
    logger.warn('Skipping template render telemetry due to missing identifiers', undefined, {
      templateId: event.templateId,
      renderer: event.renderer,
    });
    return;
  }

  const renderMs = normaliseDuration(event.renderMs ?? null);
  const errorCode = normaliseErrorCode(event.errorCode);

  try {
    const client = supabaseServiceRole();
    const { error } = await client.from(TABLE_NAME).insert({
      template_id: templateId,
      renderer,
      outcome: event.outcome,
      render_ms: renderMs,
      error_code: errorCode,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Failed to record template render telemetry', error, {
      templateId,
      renderer,
      outcome: event.outcome,
    });
  }
}

export function resolveTemplateRenderErrorCode(error: unknown): string {
  if (error instanceof Error) {
    if (typeof error.name === 'string' && error.name.trim()) {
      return normaliseErrorCode(error.name) ?? 'error';
    }
    if (typeof error.message === 'string' && error.message.trim()) {
      return normaliseErrorCode(error.message) ?? 'error';
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return normaliseErrorCode(error) ?? 'error';
  }

  return 'unknown_error';
}
