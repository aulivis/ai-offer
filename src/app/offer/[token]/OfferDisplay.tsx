'use client';

import { useEffect } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';

interface OfferDisplayProps {
  html: string;
  scopedStyles?: string; // Pre-extracted and scoped styles from server
}

/**
 * Client component that displays offer HTML with styles.
 * Styles are now extracted server-side for better performance.
 */
export function OfferDisplay({ html, scopedStyles }: OfferDisplayProps) {
  useEffect(() => {
    // If styles were provided server-side, use them directly
    if (scopedStyles) {
      let styleElement = document.getElementById('offer-template-styles');

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'offer-template-styles';
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = scopedStyles;
    }

    // Cleanup: remove style element when component unmounts
    return () => {
      const styleElement = document.getElementById('offer-template-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [scopedStyles]);

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
