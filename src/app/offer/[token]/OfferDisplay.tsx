'use client';

import { useEffect } from 'react';

interface OfferDisplayProps {
  html: string;
}

/**
 * Client component that displays offer HTML with styles extracted from full HTML document.
 * This component extracts styles from the HTML document and injects them into the page,
 * then renders the body content.
 */
export function OfferDisplay({ html }: OfferDisplayProps) {
  useEffect(() => {
    // Extract styles from full HTML document
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);

    if (styleMatch && styleMatch.length > 0) {
      // Extract CSS content from style tags
      const cssContent = styleMatch
        .map((style) => {
          const contentMatch = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          return contentMatch ? contentMatch[1] : '';
        })
        .filter(Boolean)
        .join('\n');

      if (cssContent) {
        // Create or update style element
        let styleElement = document.getElementById('offer-template-styles');

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'offer-template-styles';
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = cssContent;
      }
    }

    // Cleanup: remove style element when component unmounts
    return () => {
      const styleElement = document.getElementById('offer-template-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [html]);

  // Extract body content from full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  return (
    <div
      className="mb-8 rounded-lg bg-white p-8 shadow-sm"
      dangerouslySetInnerHTML={{ __html: bodyContent }}
    />
  );
}
