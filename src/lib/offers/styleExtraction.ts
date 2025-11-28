/**
 * Server-side style extraction utilities
 * Extracts and scopes CSS from rendered HTML for safe client-side injection
 */

/**
 * Extract styles from full HTML document
 */
export function extractStylesFromHtml(html: string): string {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);

  if (!styleMatch || styleMatch.length === 0) {
    return '';
  }

  // Extract CSS content from style tags
  const cssContent = styleMatch
    .map((style) => {
      const contentMatch = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      return contentMatch ? contentMatch[1] : '';
    })
    .filter(Boolean)
    .join('\n');

  return cssContent;
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
 * Uses a more robust approach that handles nested rules, media queries, and complex selectors.
 */
export function scopeCssToContainer(css: string, containerSelector: string): string {
  // Remove any existing scoping to avoid double scoping
  const cleanCss = css.replace(
    new RegExp(`^${containerSelector.replace('#', '\\#')}\\s+`, 'gm'),
    '',
  );

  // Use a regex-based approach to scope CSS rules
  // This handles most common CSS patterns including media queries
  let scopedCss = cleanCss;

  // Scope regular CSS rules (not inside @ rules initially)
  // Match: selector { declarations }
  scopedCss = scopedCss.replace(/([^{}@]+)\{([^{}]+)\}/g, (match, selector, declarations) => {
    const trimmedSelector = selector.trim();
    // Skip if already scoped, is an @ rule, or is empty
    if (
      !trimmedSelector ||
      trimmedSelector.includes(containerSelector) ||
      trimmedSelector.startsWith('@')
    ) {
      return match;
    }
    // Scope the selector
    return `${containerSelector} ${trimmedSelector} {${declarations}}`;
  });

  // Handle @media queries - scope rules inside them
  scopedCss = scopedCss.replace(/@media[^{]+\{([^}]+)\}/g, (match, mediaContent) => {
    // Extract the media query part
    const mediaMatch = match.match(/^(@media[^{]+)\{/);
    if (!mediaMatch) return match;

    const mediaQuery = mediaMatch[1];
    // Scope each rule inside the media query
    const scopedMediaContent = mediaContent.replace(
      /([^{}]+)\{([^{}]+)\}/g,
      (ruleMatch: string, ruleSelector: string, ruleDeclarations: string) => {
        const trimmedRuleSelector = ruleSelector.trim();
        if (
          !trimmedRuleSelector ||
          trimmedRuleSelector.includes(containerSelector) ||
          trimmedRuleSelector.startsWith('@')
        ) {
          return ruleMatch;
        }
        return `${containerSelector} ${trimmedRuleSelector} {${ruleDeclarations}}`;
      },
    );

    return `${mediaQuery}{${scopedMediaContent}}`;
  });

  return scopedCss;
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
