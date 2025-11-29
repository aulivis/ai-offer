'use client';

import { useLayoutEffect, useRef } from 'react';
import { sanitizeHTML } from '@/lib/sanitize';

interface OfferDisplayProps {
  html: string;
  scopedStyles?: string; // Pre-extracted and scoped styles from server
}

/**
 * Client component that displays offer HTML with styles.
 * Styles are now extracted server-side for better performance.
 * Uses useLayoutEffect to inject styles synchronously before paint to prevent FOUC.
 */
export function OfferDisplay({ html, scopedStyles }: OfferDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use useLayoutEffect to inject styles synchronously before paint
  // This ensures styles are applied immediately and prevents FOUC
  useLayoutEffect(() => {
    if (!scopedStyles) {
      return;
    }

    // Find or create style element
    let styleElement = document.getElementById('offer-template-styles') as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'offer-template-styles';
      styleElement.setAttribute('data-offer-styles', 'true');
      // Insert at the beginning of head to ensure it loads early
      const head = document.head;
      const firstChild = head.firstChild;
      if (firstChild) {
        head.insertBefore(styleElement, firstChild);
      } else {
        head.appendChild(styleElement);
      }
    }

    // Set styles
    styleElement.textContent = scopedStyles;

    // Cleanup: remove style element when component unmounts
    return () => {
      const element = document.getElementById('offer-template-styles');
      if (element) {
        element.remove();
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
      ref={containerRef}
      id="offer-content-container"
      className="mb-8"
      dangerouslySetInnerHTML={{ __html: sanitizedBodyContent }}
    />
  );
}
