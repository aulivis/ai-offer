import type { Metadata } from 'next';
import Link from 'next/link';

import { tokensToCssVars } from '@/app/pdf/sdk/cssVars';
import { MOCK_SLOTS } from '@/app/pdf/sdk/mock';
import { buildTokens } from '@/app/pdf/sdk/tokens';
import type { OfferTemplate, RenderContext } from '@/app/pdf/sdk/types';
import { getTemplateMeta } from '@/app/pdf/templates/registry';
import { createTranslator } from '@/copy';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'PDF Template Preview',
};

type SearchParams = { [key: string]: string | string[] | undefined };

function getFirst(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

function normalizeHex(input: string | undefined, fallback: string): string {
  if (!input) {
    return fallback;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }
  const trimmed = decoded.trim();
  if (!trimmed) {
    return fallback;
  }
  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed);
  return isValid ? prefixed : fallback;
}

function normalizeLogo(input: string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(trimmed);
    return decoded || undefined;
  } catch (error) {
    logger.warn('Failed to decode logo url', error);
    return undefined;
  }
}

function cloneSlots() {
  return {
    brand: { ...MOCK_SLOTS.brand },
    doc: { ...MOCK_SLOTS.doc },
    customer: { ...MOCK_SLOTS.customer },
    items: MOCK_SLOTS.items.map((item) => ({ ...item })),
    totals: { ...MOCK_SLOTS.totals },
    ...(MOCK_SLOTS.notes !== undefined && { notes: MOCK_SLOTS.notes }),
  } satisfies RenderContext['slots'];
}

function TemplateError({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Preview unavailable</h1>
      <p className="text-base text-neutral-600">{message}</p>
      <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
        Back to app
      </Link>
    </div>
  );
}

export default async function PdfPreviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const templateId = getFirst(resolvedSearchParams.templateId);

  if (!templateId) {
    return <TemplateError message="Missing templateId query parameter." />;
  }

  const templateMeta = getTemplateMeta(templateId);

  if (!templateMeta) {
    return <TemplateError message={`Template "${templateId}" is not registered.`} />;
  }

  let template: OfferTemplate;
  try {
    template = templateMeta.factory();
  } catch (error) {
    logger.error('Failed to create template instance', error, { templateId });
    return <TemplateError message="Unexpected error while loading template." />;
  }

  if (!template) {
    logger.error('Template factory returned an invalid template instance', undefined, {
      templateId,
    });
    return <TemplateError message="Unexpected error while loading template." />;
  }

  const primaryHex = normalizeHex(getFirst(resolvedSearchParams.brandPrimary), '#2563EB');
  const secondaryHex = normalizeHex(getFirst(resolvedSearchParams.brandSecondary), '#7C3AED');
  const logoUrl = normalizeLogo(getFirst(resolvedSearchParams.logo));

  const slots = cloneSlots();
  slots.brand.logoUrl = logoUrl ?? slots.brand.logoUrl ?? null;

  const tokens = buildTokens({
    name: slots.brand.name,
    logoUrl: slots.brand.logoUrl ?? null,
    primaryHex,
    secondaryHex,
  });

  const locale = getFirst(resolvedSearchParams.locale);
  const i18n = createTranslator(locale);

  const ctx: RenderContext = { slots, tokens, i18n };
  const headHtml = template.renderHead(ctx);
  const bodyHtml = template.renderBody(ctx);
  const cssVars = tokensToCssVars(tokens);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'var(--bg-canvas)', color: 'var(--text-default)' }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-6">
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        <div data-preview-head dangerouslySetInnerHTML={{ __html: headHtml }} />
        <div data-preview-body dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </div>
    </div>
  );
}
