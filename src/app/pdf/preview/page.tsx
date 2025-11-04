import type { Metadata } from 'next';
import Link from 'next/link';

import { tokensToCssVars } from '@/app/pdf/sdk/cssVars';
import { MOCK_SLOTS } from '@/app/pdf/sdk/mock';
import { buildTokens } from '@/app/pdf/sdk/tokens';
import type { RenderContext } from '@/app/pdf/sdk/types';
import { loadTemplate, TemplateNotFoundError } from '@/app/pdf/sdk/registry';
import '@/app/pdf/sdk/templates';

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
    console.warn('Failed to decode logo url', error);
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
    notes: MOCK_SLOTS.notes,
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

export default function PdfPreviewPage({ searchParams }: { searchParams: SearchParams }) {
  const templateId = getFirst(searchParams.templateId);

  if (!templateId) {
    return <TemplateError message="Missing templateId query parameter." />;
  }

  let template;
  try {
    template = loadTemplate(templateId);
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      return <TemplateError message={`Template "${templateId}" is not registered.`} />;
    }
    console.error('Failed to load template', error);
    return <TemplateError message="Unexpected error while loading template." />;
  }

  const primaryHex = normalizeHex(getFirst(searchParams.brandPrimary), '#2563EB');
  const secondaryHex = normalizeHex(getFirst(searchParams.brandSecondary), '#7C3AED');
  const logoUrl = normalizeLogo(getFirst(searchParams.logo));

  const slots = cloneSlots();
  slots.brand.logoUrl = logoUrl ?? (slots.brand.logoUrl || undefined);

  const tokens = buildTokens({
    name: slots.brand.name,
    logoUrl: slots.brand.logoUrl ?? null,
    primaryHex,
    secondaryHex,
  });

  const ctx: RenderContext = { slots, tokens };
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
