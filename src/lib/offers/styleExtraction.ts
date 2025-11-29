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

  const combinedStyles = styles.join('\n\n');

  // Scope styles to #offer-content-container
  const scoped = scopeCssToContainer(combinedStyles, '#offer-content-container');

  // Ensure we return valid CSS even if scoping fails
  return scoped || combinedStyles;
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

  const cleanSelector = containerSelector.trim();

  // Convert :root to container selector so CSS variables work
  let scoped = css.replace(/:root\s*\{/gi, `${cleanSelector} {`);

  // Convert html and body selectors to container
  scoped = scoped.replace(/(?:^|\n|\s|,)\s*(html|body)\s*\{/gm, (match) => {
    // Only replace if not already scoped
    if (!match.includes(cleanSelector)) {
      return match.replace(/\b(html|body)\b/, cleanSelector);
    }
    return match;
  });

  // Process CSS by finding all rule blocks (selector { ... })
  // Handle @media queries separately
  const result: string[] = [];
  let i = 0;

  while (i < scoped.length) {
    // Skip whitespace and comments
    while (i < scoped.length && /\s/.test(scoped[i]!)) {
      result.push(scoped[i]!);
      i++;
    }

    if (i >= scoped.length) break;

    // Check for @-rules
    if (scoped[i] === '@') {
      const atRuleEnd = findMatchingBrace(scoped, i);
      if (atRuleEnd > i) {
        const atRule = scoped.substring(i, atRuleEnd + 1);

        // Handle @media queries - scope selectors inside
        if (/^@media\b/i.test(atRule)) {
          const processed = processMediaQuery(atRule, cleanSelector);
          result.push(processed);
        } else {
          // Other @-rules (keyframes, font-face, etc.) - keep as-is
          result.push(atRule);
        }
        i = atRuleEnd + 1;
        continue;
      }
    }

    // Regular CSS rule
    const ruleEnd = findMatchingBrace(scoped, i);
    if (ruleEnd > i) {
      const rule = scoped.substring(i, ruleEnd + 1);
      const processed = processCssRule(rule, cleanSelector);
      result.push(processed);
      i = ruleEnd + 1;
    } else {
      // No matching brace, just copy remaining
      result.push(scoped.substring(i));
      break;
    }
  }

  return result.join('');
}

/**
 * Find the matching closing brace for a CSS rule or @-rule
 * @param css - CSS string
 * @param start - Start position (after the opening brace or @)
 * @returns Position of closing brace, or -1 if not found
 */
function findMatchingBrace(css: string, start: number): number {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let i = start;

  // Find the opening brace
  while (i < css.length && css[i] !== '{') {
    i++;
  }

  if (i >= css.length || css[i] !== '{') {
    return -1;
  }

  depth = 1;
  i++; // Skip opening brace

  while (i < css.length && depth > 0) {
    const char = css[i]!;

    // Handle strings (skip braces inside strings)
    if ((char === '"' || char === "'") && (i === 0 || css[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
      }
    }

    i++;
  }

  return depth === 0 ? i - 1 : -1;
}

/**
 * Process a @media query by scoping selectors inside it
 * @param mediaRule - Full @media rule including braces
 * @param containerSelector - Container selector
 * @returns Processed @media rule
 */
function processMediaQuery(mediaRule: string, containerSelector: string): string {
  const match = mediaRule.match(/^(@media[^{]+)\{([\s\S]+)\}$/);
  if (!match) {
    return mediaRule;
  }

  const mediaQuery = match[1]!.trim();
  const content = match[2]!;

  // Recursively scope the content inside @media
  const scopedContent = scopeCssToContainer(content, containerSelector);

  return `${mediaQuery} {\n${scopedContent}\n}`;
}

/**
 * Process a single CSS rule by scoping its selector
 * @param rule - CSS rule string (selector { properties })
 * @param containerSelector - Container selector
 * @returns Scoped CSS rule
 */
function processCssRule(rule: string, containerSelector: string): string {
  const match = rule.match(/^([^{]+)\{([\s\S]+)\}$/);
  if (!match) {
    return rule;
  }

  let selector = match[1]!.trim();
  const content = match[2]!.trim();

  // Skip if already scoped
  if (selector.includes(containerSelector)) {
    return rule;
  }

  // Skip @-rules (should be handled separately)
  if (selector.startsWith('@')) {
    return rule;
  }

  // Scope the selector
  selector = scopeSelectorString(selector, containerSelector);

  return `${selector} {\n${content}\n}`;
}

/**
 * Scope a CSS selector string (may contain multiple comma-separated selectors)
 * @param selector - Selector string
 * @param containerSelector - Container selector
 * @returns Scoped selector string
 */
function scopeSelectorString(selector: string, containerSelector: string): string {
  // Split by comma, but be careful with commas inside functions like calc()
  const selectors: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]!;

    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      selectors.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    selectors.push(current.trim());
  }

  // Scope each selector
  return selectors
    .map((sel) => {
      const trimmed = sel.trim();
      // Skip if already scoped
      if (trimmed.includes(containerSelector)) {
        return trimmed;
      }
      // Prepend container
      return `${containerSelector} ${trimmed}`;
    })
    .join(', ');
}
