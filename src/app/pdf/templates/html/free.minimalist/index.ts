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
      join(process.cwd(), 'src/app/pdf/templates/html/free.minimalist.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/free.minimalist.html'),
      join(__dirname, 'free.minimalist.html'),
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

export const freeMinimalistHtmlTemplate: OfferTemplate = {
  id: 'free.minimalist.html@1.0.0',
  tier: 'free',
  label: 'Vanda Minimalist',
  version: '1.0.0',
  marketingHighlight: 'Ultra letisztult, modern elrendezés digitális ajánlatokhoz.',
  styles: {
    print: '/* Print styles are embedded in the HTML template */',
    template: '/* Template styles are embedded in the HTML template */',
  },
  tokens: {
    color: {
      primary: '#1d4ed8',
      secondary: '#0ea5e9',
      text: '#111827',
      muted: '#6b7280',
      border: '#e5e7eb',
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
      body: "400 11pt/1.6 '-apple-system','Segoe UI',system-ui,sans-serif",
      h1: "700 28pt/1.2 '-apple-system','Segoe UI',system-ui,sans-serif",
      h2: "700 18pt/1.3 '-apple-system','Segoe UI',system-ui,sans-serif",
      h3: "600 14pt/1.4 '-apple-system','Segoe UI',system-ui,sans-serif",
      table: "600 12pt/1.5 '-apple-system','Segoe UI',system-ui,sans-serif",
    },
    radius: {
      sm: '2px',
      md: '4px',
      lg: '8px',
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
