// Utility functions for sanitizing user-provided content.  These helpers
// provide a minimal level of protection against cross‑site scripting (XSS)
// attacks by escaping dangerous characters and stripping script tags from
// HTML.  In a production environment you should prefer a well‑tested
// sanitization library such as `sanitize-html` or DOMPurify.  For the
// purposes of this MVP we implement simple helpers locally.

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
 * Remove any <script>...</script> blocks from a string of HTML.  This
 * provides a basic layer of defence against malicious scripts embedded
 * inside AI‑generated or user‑supplied HTML.  It does not attempt to
 * whitelist tags or attributes; for more robust sanitization consider
 * using a dedicated library.
 *
 * @param html The raw HTML to sanitize.
 * @returns Sanitized HTML with script tags removed.
 */
export function sanitizeHTML(html: string | undefined | null): string {
  if (!html) return '';
  // Remove <script> tags and their contents.  The regex uses a non‑greedy
  // match to ensure nested tags are removed properly.
  return String(html).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}