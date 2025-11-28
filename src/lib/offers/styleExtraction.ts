/**
 * Server-side style extraction utilities
 * Extracts and scopes CSS from rendered HTML for safe client-side injection
 */

/**
 * Extract styles from full HTML document
 */
export function extractStylesFromHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Match all style tags (including those with attributes)
  const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatches = html.matchAll(stylePattern);

  const cssParts: string[] = [];
  for (const match of styleMatches) {
    if (match[1]) {
      cssParts.push(match[1].trim());
    }
  }

  if (cssParts.length === 0) {
    return '';
  }

  return cssParts.join('\n');
}

/**
 * Extract body content from full HTML document
 */
export function extractBodyFromHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

/**
 * Scope CSS rules to a specific container by prefixing selectors.
 * Uses a simple line-by-line approach that works for most CSS.
 */
export function scopeCssToContainer(css: string, containerSelector: string): string {
  if (!css || !css.trim()) {
    return '';
  }

  // Remove any existing scoping to avoid double scoping
  const cleanCss = css.replace(
    new RegExp(`^${containerSelector.replace('#', '\\#')}\\s+`, 'gm'),
    '',
  );

  // Simple approach: for each line that starts with a selector (not @ rule, not :root),
  // prefix it with the container selector
  // This works because CSS is typically formatted with selectors on their own lines
  const lines = cleanCss.split('\n');
  const scopedLines: string[] = [];
  let inAtRule = false;
  let atRuleDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track @ rules
    if (trimmed.startsWith('@media') || trimmed.startsWith('@keyframes') || trimmed.startsWith('@')) {
      inAtRule = true;
      atRuleDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      scopedLines.push(line);
      continue;
    }
    
    // Track depth within @ rules
    if (inAtRule) {
      atRuleDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (atRuleDepth <= 0) {
        inAtRule = false;
        atRuleDepth = 0;
      }
      
      // Inside @media, scope selectors
      if (inAtRule && trimmed && !trimmed.startsWith('@') && trimmed.includes('{')) {
        const selectorMatch = trimmed.match(/^([^{]+)\{/);
        if (selectorMatch) {
          const selector = selectorMatch[1].trim();
          if (selector && !selector.includes(containerSelector) && selector !== ':root') {
            const scopedLine = line.replace(/^(\s*)([^{]+)\{/, `$1${containerSelector} $2{`);
            scopedLines.push(scopedLine);
            continue;
          }
        }
      }
      
      scopedLines.push(line);
      continue;
    }
    
    // Regular rule - check if it's a selector line
    if (trimmed && trimmed.includes('{') && !trimmed.startsWith('@') && trimmed !== ':root {') {
      const selectorMatch = trimmed.match(/^([^{]+)\{/);
      if (selectorMatch) {
        const selector = selectorMatch[1].trim();
        // Skip if already scoped, empty, or special
        if (selector && !selector.includes(containerSelector) && selector !== ':root') {
          const scopedLine = line.replace(/^(\s*)([^{]+)\{/, `$1${containerSelector} $2{`);
          scopedLines.push(scopedLine);
          continue;
        }
      }
    }
    
    scopedLines.push(line);
  }

  return scopedLines.join('\n');
}

/**
 * Extract and scope styles from HTML for client-side injection
 */
export function extractAndScopeStyles(
  html: string,
  containerSelector: string = '#offer-content-container',
): string {
  const styles = extractStylesFromHtml(html);
  if (!styles) {
    return '';
  }
  return scopeCssToContainer(styles, containerSelector);
}
