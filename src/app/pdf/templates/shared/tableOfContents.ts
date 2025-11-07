import { sanitizeInput } from '@/lib/sanitize';

export interface TOCEntry {
  id: string;
  title: string;
  level: number;
}

/**
 * Generate table of contents HTML
 */
export function renderTableOfContents(
  entries: TOCEntry[],
  i18n: { t: (key: string) => string },
): string {
  if (entries.length === 0) {
    return '';
  }

  const tocTitle = sanitizeInput(i18n.t('pdf.templates.common.tocTitle') || 'Table of Contents');
  
  const tocItems = entries
    .map((entry) => {
      const safeId = sanitizeInput(entry.id);
      const safeTitle = sanitizeInput(entry.title);
      const indent = entry.level > 1 ? ` style="padding-left: ${(entry.level - 1) * 1.5}rem;"` : '';
      
      return `
        <li class="offer-toc__item offer-toc__item--level-${entry.level}">
          <a href="#${safeId}"${indent}>${safeTitle}</a>
        </li>
      `;
    })
    .join('');

  return `
    <section class="offer-toc" aria-labelledby="toc-heading">
      <h2 id="toc-heading" class="offer-toc__title">${tocTitle}</h2>
      <nav class="offer-toc__nav" aria-label="${tocTitle}">
        <ol class="offer-toc__list">
          ${tocItems}
        </ol>
      </nav>
    </section>
  `;
}

/**
 * Extract headings from HTML content to generate TOC entries
 */
export function extractHeadings(html: string): TOCEntry[] {
  const headingRegex = /<h([1-6])[^>]*id="([^"]+)"[^>]*>([^<]+)<\/h[1-6]>/gi;
  const entries: TOCEntry[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1] || '1', 10);
    const id = match[2] || '';
    const title = match[3]?.trim() || '';

    if (id && title) {
      entries.push({ id, title, level });
    }
  }

  return entries;
}







