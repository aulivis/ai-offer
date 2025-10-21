import sanitizeHtml from 'sanitize-html';

// Utility functions for sanitizing user-provided content. These helpers
// provide a consistent layer of protection against cross‑site scripting
// (XSS) by escaping dangerous characters in plain text and normalising any
// HTML fragments through a vetted sanitizer (`sanitize-html`).

const HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'a',
    'b',
    'blockquote',
    'br',
    'em',
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
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto'],
  },
  allowProtocolRelative: false,
};

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
  return String(input).replace(/[<>&"]/g, (ch) => {
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

/**
 * Sanitize a fragment of HTML using a strict allowlist so it can be safely
 * persisted or rendered. Any elements or attributes not in
 * {@link HTML_SANITIZE_OPTIONS} are stripped, and dangerous URI schemes are
 * rejected.
 *
 * @param html The raw HTML to sanitize.
 * @returns Sanitized HTML that conforms to the allowlist.
 */
export function sanitizeHTML(html: string | undefined | null): string {
  if (!html) return '';
  return sanitizeHtml(String(html), HTML_SANITIZE_OPTIONS);
}

export { HTML_SANITIZE_OPTIONS };