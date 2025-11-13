import type { OfferTemplate } from '../../types';
import { renderHtmlTemplate } from '../engine';
import type { RenderCtx } from '../../types';

// Resolve template path lazily - only when rendering (server-side only)
// This avoids importing fs at module load time, which breaks client bundles
let cachedTemplatePath: string | null = null;

function getTemplatePath(): string {
  if (cachedTemplatePath) {
    return cachedTemplatePath;
  }

  // Only resolve path on server-side (Node.js environment)
  // Check for process instead of window for better Node.js detection
  if (typeof process !== 'undefined' && process.versions?.node) {
    // Dynamic require to avoid bundling fs in client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { existsSync } = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { join } = require('path');

    // Try multiple possible paths
    const possiblePaths = [
      join(process.cwd(), 'src/app/pdf/templates/html/free.minimal.html'),
      join(process.cwd(), 'web/src/app/pdf/templates/html/free.minimal.html'),
      join(__dirname, 'free.minimal.html'),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        cachedTemplatePath = path;
        return path;
      }
    }

    // Fallback to the most likely path
    cachedTemplatePath = possiblePaths[0]!;
    return possiblePaths[0]!;
  }

  // Client-side fallback (should never be called, but needed for type safety)
  throw new Error('Template path resolution is only available on the server');
}

/**
 * Render head section for HTML template
 * Extracts the <head> content including styles from the rendered HTML
 */
function renderHead(ctx: RenderCtx): string {
  const fullHtml = renderHtmlTemplate(ctx, getTemplatePath());

  // Extract head content (everything between <head> and </head>)
  const headMatch = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch && headMatch[1]) {
    return headMatch[1].trim();
  }

  return '';
}

/**
 * Render body section for HTML template
 * Extracts the <body> content from the rendered HTML
 */
function renderBody(ctx: RenderCtx): string {
  const fullHtml = renderHtmlTemplate(ctx, getTemplatePath());

  // Extract body content (everything between <body> and </body>)
  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }

  // Fallback: return empty if extraction fails
  return '';
}

export const freeMinimalHtmlTemplate: OfferTemplate = {
  id: 'free.minimal.html@1.0.0',
  tier: 'free',
  label: 'Minimális (HTML)',
  version: '1.0.0',
  marketingHighlight:
    'Tiszta, professzionális dizájn, amely tökéletesen megfelel az üzleti ajánlatokhoz.',
  styles: {
    // HTML templates include their own styles in the HTML file
    // These are minimal placeholders to satisfy the schema
    print: '/* Print styles are in the HTML template */',
    template: '/* Template styles are in the HTML template */',
  },
  tokens: {
    color: {
      primary: '#1a1a1a',
      secondary: '#f5f5f5',
      text: '#1a1a1a',
      muted: '#666666',
      border: '#e0e0e0',
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
      body: "400 11pt/1.7 'Inter', 'Segoe UI', system-ui, sans-serif",
      h1: "600 2rem/1.2 'Inter', 'Segoe UI', system-ui, sans-serif",
      h2: "600 1.25rem/1.3 'Inter', 'Segoe UI', system-ui, sans-serif",
      h3: "600 1rem/1.4 'Inter', 'Segoe UI', system-ui, sans-serif",
      table: "500 10pt/1.5 'Inter', 'Segoe UI', system-ui, sans-serif",
    },
    radius: {
      sm: '0',
      md: '0',
      lg: '0',
    },
  },
  capabilities: {
    'pricing.table': true,
  },
  renderHead,
  renderBody,
};
