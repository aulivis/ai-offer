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
      join(process.cwd(), 'src/app/pdf/templates/html/premium.luxury.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/premium.luxury.html'),
      join(__dirname, 'premium.luxury.html'),
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

export const premiumLuxuryHtmlTemplate: OfferTemplate = {
  id: 'premium.luxury.html@1.0.0',
  tier: 'premium',
  label: 'Veronica Luxury',
  version: '1.0.0',
  marketingHighlight:
    'Elegáns, prémium megjelenés díszített tipográfiával és animált részletekkel.',
  styles: {
    print: '/* Print styles are embedded in the HTML template */',
    template: '/* Template styles are embedded in the HTML template */',
  },
  tokens: {
    color: {
      primary: '#1d1b22',
      secondary: '#a47c48',
      text: '#1f1b24',
      muted: '#6b6b74',
      border: '#e4e4eb',
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
      body: "400 12pt/1.7 'Playfair Display','Georgia',serif",
      h1: "700 48pt/1.2 'Playfair Display','Georgia',serif",
      h2: "600 24pt/1.3 'Playfair Display','Georgia',serif",
      h3: "600 18pt/1.4 'Inter','Segoe UI',sans-serif",
      table: "600 13pt/1.5 'Inter','Segoe UI',sans-serif",
    },
    radius: {
      sm: '4px',
      md: '12px',
      lg: '20px',
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
