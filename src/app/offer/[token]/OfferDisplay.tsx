'use client';

import { sanitizeHTML } from '@/lib/sanitize';

interface OfferDisplayProps {
  html: string;
}

/**
 * Client component that displays offer HTML.
 *
 * The new template system generates complete HTML documents with inline styles,
 * so no style extraction or injection is needed.
 */
export function OfferDisplay({ html }: OfferDisplayProps) {
  // Extract body content from full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Sanitize HTML before rendering to prevent XSS attacks
  // Even though HTML is sanitized when stored, we sanitize again here
  // as a defense-in-depth measure, especially for shared offer links
  const sanitizedBodyContent = sanitizeHTML(bodyContent);

  return (
    <div
      id="offer-content-container"
      className="mb-8"
      dangerouslySetInnerHTML={{ __html: sanitizedBodyContent }}
    />
  );
}
