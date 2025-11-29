/**
 * Style extraction utilities for offer HTML processing
 * Extracts and scopes CSS styles from HTML documents
 */

/**
 * Extract CSS styles from HTML and scope them to a container
 * @param html - Full HTML document string
 * @returns Scoped CSS string or empty string if no styles found
 */
export function extractAndScopeStyles(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Extract <style> tags from HTML
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const matches = html.matchAll(styleTagRegex);
  const styles: string[] = [];

  for (const match of matches) {
    const styleContent = match[1]?.trim();
    if (styleContent) {
      styles.push(styleContent);
    }
  }

  if (styles.length === 0) {
    return '';
  }

  // Scope styles to #offer-content-container
  return scopeCssToContainer(styles.join('\n'), '#offer-content-container');
}

/**
 * Extract body content from full HTML document
 * @param html - Full HTML document string
 * @returns Body HTML content or original HTML if no body tag found
 */
export function extractBodyFromHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // Try to extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }

  // If no body tag, return original HTML (might already be body content)
  return html;
}

/**
 * Scope CSS rules to a specific container selector
 * @param css - CSS string to scope
 * @param containerSelector - CSS selector for the container (e.g., '#offer-content-container')
 * @returns Scoped CSS string
 */
export function scopeCssToContainer(css: string, containerSelector: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  if (!containerSelector || typeof containerSelector !== 'string') {
    return css;
  }

  // Remove existing container selector if present to avoid double-scoping
  const cleanSelector = containerSelector.trim();

  // Simple CSS scoping: prepend container selector to each rule
  // This is a basic implementation - for production, consider using a proper CSS parser
  const lines = css.split('\n');
  const scopedLines: string[] = [];
  let inRule = false;
  let currentRule: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments at the start
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('//')) {
      if (trimmed.endsWith('*/')) {
        scopedLines.push(line);
      } else if (trimmed.startsWith('/*')) {
        scopedLines.push(line);
      }
      continue;
    }

    // Check if line contains a CSS rule (contains { or })
    if (trimmed.includes('{')) {
      inRule = true;
      currentRule = [line];
    } else if (trimmed.includes('}')) {
      if (inRule && currentRule.length > 0) {
        currentRule.push(line);
        // Scope the rule
        const ruleContent = currentRule.join('\n');
        const scopedRule = scopeSingleRule(ruleContent, cleanSelector);
        scopedLines.push(scopedRule);
        currentRule = [];
        inRule = false;
      } else {
        scopedLines.push(line);
      }
    } else if (inRule) {
      currentRule.push(line);
    } else {
      // Standalone line (might be a variable or import)
      scopedLines.push(line);
    }
  }

  // Handle any remaining rule
  if (inRule && currentRule.length > 0) {
    const ruleContent = currentRule.join('\n');
    const scopedRule = scopeSingleRule(ruleContent, cleanSelector);
    scopedLines.push(scopedRule);
  }

  return scopedLines.join('\n');
}

/**
 * Scope a single CSS rule to a container
 * @param rule - CSS rule string
 * @param containerSelector - Container selector
 * @returns Scoped CSS rule
 */
function scopeSingleRule(rule: string, containerSelector: string): string {
  // Extract selector and content
  const match = rule.match(/^([^{]+)\{([\s\S]+)\}/);
  if (!match) {
    return rule;
  }

  const selector = match[1].trim();
  const content = match[2].trim();

  // Don't double-scope if already scoped
  if (selector.includes(containerSelector)) {
    return rule;
  }

  // Scope the selector
  // Handle multiple selectors (comma-separated)
  const selectors = selector.split(',').map((s) => {
    const trimmed = s.trim();
    // Don't scope :root, @media, @keyframes, etc.
    if (
      trimmed.startsWith('@') ||
      trimmed.startsWith(':root') ||
      trimmed.startsWith('html') ||
      trimmed.startsWith('body')
    ) {
      return trimmed;
    }
    // Prepend container selector
    return `${containerSelector} ${trimmed}`;
  });

  return `${selectors.join(', ')} {\n${content}\n}`;
}
