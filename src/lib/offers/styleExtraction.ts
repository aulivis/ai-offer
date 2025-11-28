/**
 * Server-side style extraction utilities
 * Extracts and scopes CSS from rendered HTML for safe client-side injection
 */

/**
 * Extract styles from full HTML document
 * Handles both formatted and minified CSS
 */
export function extractStylesFromHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Match all style tags (including those with attributes)
  // Use non-greedy match to handle multiple style tags
  const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatches = html.matchAll(stylePattern);

  const cssParts: string[] = [];
  for (const match of styleMatches) {
    if (match[1]) {
      const css = match[1].trim();
      // Only add non-empty CSS
      if (css.length > 0) {
        cssParts.push(css);
      }
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
 * Converts :root to the container selector so CSS variables work within the container.
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

  // Simple approach: for each line that starts with a selector (not @ rule),
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
    if (
      trimmed.startsWith('@media') ||
      trimmed.startsWith('@keyframes') ||
      trimmed.startsWith('@')
    ) {
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

      // Inside @media, scope selectors (including :root)
      if (inAtRule && trimmed && !trimmed.startsWith('@') && trimmed.includes('{')) {
        const selectorMatch = trimmed.match(/^([^{]+)\{/);
        if (selectorMatch) {
          const selector = selectorMatch[1].trim();
          if (selector && !selector.includes(containerSelector)) {
            // Convert :root to container selector, otherwise scope normally
            const scopedSelector = selector === ':root' ? containerSelector : `${containerSelector} ${selector}`;
            const scopedLine = line.replace(/^(\s*)([^{]+)\{/, `$1${scopedSelector}{`);
            scopedLines.push(scopedLine);
            continue;
          }
        }
      }

      scopedLines.push(line);
      continue;
    }

    // Regular rule - check if it's a selector line
    if (trimmed && trimmed.includes('{') && !trimmed.startsWith('@')) {
      const selectorMatch = trimmed.match(/^([^{]+)\{/);
      if (selectorMatch) {
        const selector = selectorMatch[1].trim();
        // Skip if already scoped, otherwise scope it
        if (selector && !selector.includes(containerSelector)) {
          // Convert :root to container selector, otherwise scope normally
          const scopedSelector = selector === ':root' ? containerSelector : `${containerSelector} ${selector}`;
          const scopedLine = line.replace(/^(\s*)([^{]+)\{/, `$1${scopedSelector}{`);
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
