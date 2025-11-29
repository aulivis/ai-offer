/**
 * Template Preloader
 *
 * Pre-loads all template HTML files at module initialization to improve performance.
 * This avoids filesystem I/O on every render, especially important in serverless environments.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from '@/lib/logger';

// Cache for pre-loaded template HTML files
const templateHtmlCache = new Map<string, string>();

/**
 * Get the directory containing template HTML files
 */
function getTemplateHtmlDir(): string {
  // __dirname in compiled code points to the dist directory
  // We need to find the source templates directory
  const possiblePaths = [
    join(process.cwd(), 'src/app/pdf/templates/html'),
    join(process.cwd(), 'web/src/app/pdf/templates/html'),
    join(__dirname, 'html'),
    join(dirname(__dirname), 'html'),
  ];

  for (const path of possiblePaths) {
    try {
      // Check if free.classic.html exists
      const testPath = join(path, 'free.classic.html');
      readFileSync(testPath, 'utf-8');
      return path;
    } catch {
      // Path doesn't exist, try next
      continue;
    }
  }

  // Fallback to first path
  return possiblePaths[0]!;
}

/**
 * Pre-load a template HTML file
 */
function preloadTemplateHtml(filename: string): string {
  if (templateHtmlCache.has(filename)) {
    return templateHtmlCache.get(filename)!;
  }

  try {
    const templateDir = getTemplateHtmlDir();
    const filePath = join(templateDir, filename);
    const content = readFileSync(filePath, 'utf-8');
    templateHtmlCache.set(filename, content);
    return content;
  } catch (error) {
    throw new Error(`Failed to pre-load template HTML file: ${filename} - ${error}`);
  }
}

/**
 * Pre-load all template HTML files
 * Call this at module initialization
 */
export function preloadAllTemplates(): void {
  const templates = [
    'free.classic.html',
    'free.minimal.html',
    'free.minimalist.html',
    'premium.brutalist.html',
    'premium.luxury.html',
    'premium.professional.html',
  ];

  for (const template of templates) {
    try {
      preloadTemplateHtml(template);
    } catch (error) {
      // Log but don't fail - templates might not all exist
      logger.warn(`Failed to pre-load template ${template}`, { error, template });
    }
  }
}

/**
 * Get pre-loaded template HTML content
 */
export function getPreloadedTemplateHtml(filename: string): string | null {
  return templateHtmlCache.get(filename) || null;
}

// Pre-load templates when module is imported
if (typeof process !== 'undefined' && process.versions?.node) {
  try {
    preloadAllTemplates();
  } catch (error) {
    // Don't fail if pre-loading fails - templates will be loaded on-demand
    logger.warn('Template pre-loading failed, will load on-demand', { error });
  }
}
