import type { OfferTemplate, RenderCtx } from '../../types';
import { renderHtmlTemplate } from '../engine';
import { logger } from '@/lib/logger';

let cachedTemplatePath: string | null = null;

function getTemplatePath(): string {
  if (cachedTemplatePath) {
    return cachedTemplatePath;
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join, dirname } = require('path');

    // __dirname points to the free.classic directory, so we need to go up one level
    const templateDir = dirname(__dirname);

    const possiblePaths = [
      join(templateDir, 'free.classic.html'), // Most reliable: same directory as index.ts parent
      join(process.cwd(), 'src/app/pdf/templates/html/free.classic.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/free.classic.html'),
      join(__dirname, 'free.classic.html'), // Fallback: same directory as index.ts
      join(__dirname, '..', 'free.classic.html'), // Alternative: explicit parent
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        cachedTemplatePath = path;
        return path;
      }
    }

    // If none found, return the most likely path and let the error happen at load time
    const fallbackPath = join(templateDir, 'free.classic.html');
    cachedTemplatePath = fallbackPath;
    return fallbackPath as string;
  }

  throw new Error('Template path resolution is only available on the server');
}

function extractHead(ctx: RenderCtx): string {
  try {
    const templatePath = getTemplatePath();
    const fullHtml = renderHtmlTemplate(ctx, templatePath);
    const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    return headMatch?.[1]?.trim() ?? '';
  } catch (error) {
    // Log error for debugging but return empty head to prevent complete failure
    logger.warn('Error rendering template head for Viola Classic', {
      templatePath: getTemplatePath(),
      error: error instanceof Error ? error.message : String(error),
    });
    return '';
  }
}

function extractBody(ctx: RenderCtx): string {
  try {
    const templatePath = getTemplatePath();
    const fullHtml = renderHtmlTemplate(ctx, templatePath);
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch?.[1]?.trim() ?? '';
  } catch (error) {
    // Log error for debugging
    logger.error('Error rendering template body for Viola Classic', error, {
      templatePath: getTemplatePath(),
    });
    // Re-throw to let the engine handle it properly
    throw error;
  }
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
