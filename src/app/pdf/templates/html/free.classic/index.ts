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
      join(process.cwd(), 'src/app/pdf/templates/html/free.classic.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/free.classic.html'),
      join(__dirname, 'free.classic.html'),
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

export const freeClassicHtmlTemplate: OfferTemplate = {
  id: 'free.classic.html@1.0.0',
  tier: 'free',
  label: 'Viola Classic',
  version: '1.0.0',
  marketingHighlight: 'Elegáns, klasszikus tipográfia papír alapú ajánlatok hangulatával.',
  styles: {
    print: '/* Print styles are embedded in the HTML template */',
    template: '/* Template styles are embedded in the HTML template */',
  },
  tokens: {
    color: {
      primary: '#1f2933',
      secondary: '#9b8c7f',
      text: '#1f2933',
      muted: '#6b7280',
      border: '#d1d5db',
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
      body: "400 11pt/1.7 'Georgia', serif",
      h1: "400 24pt/1.3 'Georgia', serif",
      h2: "400 18pt/1.3 'Georgia', serif",
      h3: "600 14pt/1.4 'Inter', sans-serif",
      table: "500 10pt/1.5 'Inter', sans-serif",
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
