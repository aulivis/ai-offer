import type { OfferTemplate, RenderCtx } from '../../types';
import { renderHtmlTemplate } from '../engine';

let cachedTemplatePath: string | null = null;

function getTemplatePath(): string {
  if (cachedTemplatePath) {
    return cachedTemplatePath;
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('path');

    const possiblePaths = [
      join(process.cwd(), 'src/app/pdf/templates/html/premium.brutalist.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/premium.brutalist.html'),
      join(__dirname, 'premium.brutalist.html'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        cachedTemplatePath = path;
        return path;
      }
    }

    cachedTemplatePath = possiblePaths[0]!;
    return possiblePaths[0]!;
  }

  throw new Error('Template path resolution is only available on the server');
}

function extractHead(ctx: RenderCtx): string {
  const fullHtml = renderHtmlTemplate(ctx, getTemplatePath());
  const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return headMatch?.[1]?.trim() ?? '';
}

function extractBody(ctx: RenderCtx): string {
  const fullHtml = renderHtmlTemplate(ctx, getTemplatePath());
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1]?.trim() ?? '';
}

export const premiumBrutalistHtmlTemplate: OfferTemplate = {
  id: 'premium.brutalist.html@1.0.0',
  tier: 'premium',
  label: 'Viktoria Brutalist',
  version: '1.0.0',
  marketingHighlight: 'Merész, geometrikus brutalista stílus erős márkaelemekkel.',
  styles: {
    print: '/* Print styles are embedded in the HTML template */',
    template: '/* Template styles are embedded in the HTML template */',
  },
  tokens: {
    color: {
      primary: '#111827',
      secondary: '#0ea5e9',
      text: '#0f172a',
      muted: '#475569',
      border: '#cbd5f5',
      bg: '#ffffff',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2.5rem',
    },
    typography: {
      body: "500 12pt/1.7 'Space Grotesk','Inter',sans-serif",
      h1: "900 48pt/1.1 'Space Grotesk','Inter',sans-serif",
      h2: "800 28pt/1.2 'Space Grotesk','Inter',sans-serif",
      h3: "700 20pt/1.4 'Space Grotesk','Inter',sans-serif",
      table: "700 13pt/1.5 'Space Grotesk','Inter',sans-serif",
    },
    radius: {
      sm: '0',
      md: '0',
      lg: '0',
    },
  },
  capabilities: {
    'pricing.table': true,
    'images.gallery': true,
    'terms.structured': true,
  },
  renderHead: extractHead,
  renderBody: extractBody,
};
