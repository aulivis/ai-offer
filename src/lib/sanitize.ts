// Utility functions for sanitizing user-provided content.  The plain-text
// helper escapes the critical HTML characters, while the HTML helper performs
// a lightweight allow-list based sanitisation so we do not depend on the
// `sanitize-html` package (which is not available in some execution
// environments).

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'em',
  'img',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const SELF_CLOSING_TAGS = new Set(['br', 'hr', 'img']);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
  img: new Set(['src', 'alt', 'data-offer-image-key']),
};

const GLOBAL_ALLOWED_ATTRIBUTES = new Set(['role']);

const ALLOWED_ARIA_ATTRIBUTES = new Set([
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-hidden',
  'aria-live',
  'aria-expanded',
  'aria-controls',
  'aria-current',
  'aria-pressed',
  'aria-selected',
  'aria-busy',
  'aria-modal',
  'aria-multiline',
  'aria-invalid',
]);

const ALLOWED_DATA_ATTRIBUTES = new Set([
  'data-testid',
  'data-qa',
  'data-state',
  'data-theme',
  'data-tooltip',
  'data-tracking-id',
  'data-offer-image-key',
]);

const DROP_CONTENT_TAGS = new Set(['script', 'style']);

const URL_ALLOWED_SCHEMES = new Set(['http', 'https', 'mailto']);
const URL_ALLOWED_SCHEMES_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['http', 'https', 'mailto']),
  img: new Set(['http', 'https', 'data']),
};

const ALLOWED_TARGETS = new Set(['_blank', '_self', '_parent', '_top']);
const ALLOWED_REL_VALUES = new Set(['noopener', 'noreferrer', 'nofollow', 'external']);
const ATTRIBUTE_PATTERN = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>/=`]+)))?/g;
const TAG_PATTERN = /<\/?([a-zA-Z0-9]+)([^<>]*)>/g;

function escapeHtml(value: string): string {
  return value.replace(/[<>&"]/g, (ch) => {
    switch (ch) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      default:
        return ch;
    }
  });
}

function escapeAttribute(value: string): string {
  return value.replace(/[&"'<>]/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return ch;
    }
  });
}

function isGloballyAllowedAttribute(attrName: string): boolean {
  if (GLOBAL_ALLOWED_ATTRIBUTES.has(attrName)) return true;
  if (ALLOWED_ARIA_ATTRIBUTES.has(attrName)) return true;
  if (ALLOWED_DATA_ATTRIBUTES.has(attrName)) return true;
  return false;
}

function isUrlAllowed(url: string, tagName: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('//')) return false; // protocol-relative URLs disabled

  const schemeIndex = trimmed.indexOf(':');
  if (schemeIndex === -1) return true; // relative URLs

  const scheme = trimmed.slice(0, schemeIndex).toLowerCase();
  const tagSchemes = URL_ALLOWED_SCHEMES_BY_TAG[tagName] ?? URL_ALLOWED_SCHEMES;
  return tagSchemes.has(scheme);
}

function sanitiseAttribute(tagName: string, attrName: string, value: string): string | null {
  const lowerAttr = attrName.toLowerCase();
  const trimmed = value.trim();

  switch (lowerAttr) {
    case 'href':
      if (!isUrlAllowed(trimmed, tagName)) return null;
      return escapeAttribute(trimmed);
    case 'src':
      if (!isUrlAllowed(trimmed, tagName)) return null;
      return escapeAttribute(trimmed);
    case 'title':
      return escapeAttribute(trimmed);
    case 'target': {
      const normalised = trimmed.startsWith('_')
        ? trimmed.toLowerCase()
        : `_${trimmed.toLowerCase()}`;
      return ALLOWED_TARGETS.has(normalised) ? normalised : null;
    }
    case 'rel': {
      const tokens = trimmed
        .split(/\s+/)
        .map((token) => token.toLowerCase())
        .filter((token) => ALLOWED_REL_VALUES.has(token));
      if (!tokens.length) return null;
      return tokens.join(' ');
    }
    case 'colspan':
    case 'rowspan': {
      const numeric = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(numeric) || numeric < 1) return null;
      return String(numeric);
    }
    default:
      return escapeAttribute(trimmed);
  }
}

function sanitiseTag(tagName: string, rawAttributes: string, isSelfClosing: boolean): string {
  const allowedAttributes = ALLOWED_ATTRIBUTES[tagName];
  const sanitisedAttributes: { name: string; value: string }[] = [];

  rawAttributes.replace(
    ATTRIBUTE_PATTERN,
    (_match, name, _valueWithQuotes, valueDouble, valueSingle, valueUnquoted) => {
      const attrName = String(name).toLowerCase();
      const isAllowed = (allowedAttributes && allowedAttributes.has(attrName)) || isGloballyAllowedAttribute(attrName);
      if (!isAllowed) return '';
      const rawValue = valueDouble ?? valueSingle ?? valueUnquoted ?? '';
      const sanitisedValue = sanitiseAttribute(tagName, attrName, rawValue);
      if (sanitisedValue !== null) {
        sanitisedAttributes.push({ name: attrName, value: sanitisedValue });
      }
      return '';
    },
  );

  if (tagName === 'a') {
    const targetAttr = sanitisedAttributes.find((attr) => attr.name === 'target');
    if (targetAttr && targetAttr.value === '_blank') {
      const requiredTokens = ['noopener', 'noreferrer'];
      let relAttr = sanitisedAttributes.find((attr) => attr.name === 'rel');
      if (!relAttr) {
        sanitisedAttributes.push({ name: 'rel', value: 'noopener noreferrer' });
      } else {
        const existing = new Set(relAttr.value.split(/\s+/).filter(Boolean));
        for (const token of requiredTokens) {
          existing.add(token);
        }
        relAttr.value = Array.from(existing).join(' ');
      }
    }
  }

  const attributeString = sanitisedAttributes.length
    ? ` ${sanitisedAttributes.map((attr) => `${attr.name}="${attr.value}"`).join(' ')}`
    : '';
  return `<${tagName}${attributeString}${isSelfClosing ? ' /' : ''}>`;
}

/**
 * Escape special characters in a plain string to prevent it from being
 * interpreted as HTML.  This function replaces `<`, `>`, `&` and
 * double quotes with their corresponding HTML entities.  Use this for
 * any text that may be displayed in an HTML context where you do not
 * want users to inject markup.
 *
 * @param input The raw user input.
 * @returns An escaped string safe for insertion into HTML.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return escapeHtml(String(input));
}

/**
 * Sanitize a fragment of HTML using a strict allowlist so it can be safely
 * persisted or rendered. Any elements or attributes outside the allowlist are
 * stripped and dangerous URI schemes are rejected.
 *
 * @param html The raw HTML to sanitize.
 * @returns Sanitized HTML that conforms to the allowlist.
 */
export function sanitizeHTML(html: string | undefined | null): string {
  if (!html) return '';

  const source = String(html);
  let result = '';
  let lastIndex = 0;
  const dropStack: string[] = [];

  TAG_PATTERN.lastIndex = 0;

  source.replace(
    TAG_PATTERN,
    (match, tagNameRaw: string, rawAttributes: string, offset: number) => {
      if (dropStack.length === 0) {
        result += escapeHtml(source.slice(lastIndex, offset));
      }
      lastIndex = offset + match.length;

      const tagName = tagNameRaw.toLowerCase();

      const isClosing = match.startsWith('</');
      const isExplicitSelfClosing = /\/\s*>$/.test(match);
      const isSelfClosing = isExplicitSelfClosing || SELF_CLOSING_TAGS.has(tagName);

      if (DROP_CONTENT_TAGS.has(tagName)) {
        if (!isClosing && !isSelfClosing) {
          dropStack.push(tagName);
        } else if (isClosing && dropStack[dropStack.length - 1] === tagName) {
          dropStack.pop();
        }
        return '';
      }

      if (!ALLOWED_TAGS.has(tagName) || dropStack.length > 0) {
        return '';
      }

      if (isClosing) {
        if (SELF_CLOSING_TAGS.has(tagName)) {
          return '';
        }
        result += `</${tagName}>`;
        return '';
      }

      const attributesSection = rawAttributes ?? '';
      const attributeContent = attributesSection.replace(/\/\s*$/, '');

      result += sanitiseTag(tagName, attributeContent, isSelfClosing);
      return '';
    },
  );

  if (dropStack.length === 0) {
    result += escapeHtml(source.slice(lastIndex));
  }

  return result;
}
