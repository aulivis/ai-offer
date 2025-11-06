import { sanitizeInput } from '@/lib/sanitize';

/**
 * Generate ARIA labels for common elements
 */
export function generateAriaLabel(type: string, context?: string): string {
  const safeType = sanitizeInput(type);
  const safeContext = context ? sanitizeInput(context) : '';
  
  const labels: Record<string, string> = {
    logo: `Logo${safeContext ? ` for ${safeContext}` : ''}`,
    header: `Document header${safeContext ? ` for ${safeContext}` : ''}`,
    footer: `Document footer${safeContext ? ` for ${safeContext}` : ''}`,
    pricing: 'Pricing information',
    gallery: 'Image gallery',
    contact: 'Contact information',
    company: 'Company information',
  };
  
  return labels[safeType] || safeType;
}

/**
 * Ensure semantic HTML structure
 */
export function ensureSemanticStructure(html: string): string {
  // Ensure headings have proper hierarchy
  let level = 1;
  return html.replace(/<h([1-6])/gi, (match, currentLevel) => {
    const current = parseInt(currentLevel, 10);
    if (current < level) {
      level = current;
    }
    if (current > level + 1) {
      return `<h${level + 1}`;
    }
    level = current;
    return match;
  });
}

/**
 * Add skip links for accessibility
 */
export function renderSkipLinks(): string {
  return `
    <a href="#main-content" class="offer-skip-link">Skip to main content</a>
    <a href="#pricing" class="offer-skip-link">Skip to pricing</a>
  `;
}

/**
 * Ensure color independence - add text indicators where color conveys meaning
 */
export function addColorIndicators(html: string): string {
  // Add text indicators for status colors
  return html
    .replace(/<span[^>]*class="[^"]*success[^"]*"[^>]*>/gi, '<span class="$&" aria-label="Success">')
    .replace(/<span[^>]*class="[^"]*error[^"]*"[^>]*>/gi, '<span class="$&" aria-label="Error">')
    .replace(/<span[^>]*class="[^"]*warning[^"]*"[^>]*>/gi, '<span class="$&" aria-label="Warning">');
}

