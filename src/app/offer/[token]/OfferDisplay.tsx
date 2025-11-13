'use client';

import { useEffect } from 'react';

interface OfferDisplayProps {
  html: string;
}

/**
 * Client component that displays offer HTML with styles extracted from full HTML document.
 * This component extracts styles from the HTML document and scopes them to the offer content,
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
        // Scope the CSS to the offer container by wrapping all selectors
        // This prevents template styles from affecting the rest of the page
        const scopedCss = scopeCssToContainer(cssContent, '#offer-content-container');

        // Create or update style element
        let styleElement = document.getElementById('offer-template-styles');

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'offer-template-styles';
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = scopedCss;
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
      id="offer-content-container"
      className="mb-8 rounded-lg bg-white p-8 shadow-sm"
      dangerouslySetInnerHTML={{ __html: bodyContent }}
    />
  );
}

/**
 * Scopes CSS rules to a specific container by prefixing selectors.
 * Uses a more robust approach that handles nested rules, media queries, and complex selectors.
 */
function scopeCssToContainer(css: string, containerSelector: string): string {
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
      (ruleMatch, ruleSelector, ruleDeclarations) => {
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
