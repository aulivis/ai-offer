/**
 * Image utility functions for Next.js Image component
 */

/**
 * Generates a base64-encoded blur placeholder data URL
 * This creates a tiny 1x1 pixel image with a solid color
 *
 * @param color - RGB color values (e.g., [220, 220, 220] for light gray)
 * @returns Base64 data URL string
 */
export function generateBlurPlaceholder(color: [number, number, number] = [220, 220, 220]): string {
  const svg = `<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="rgb(${color.join(',')})"/></svg>`;

  // Use btoa for browser compatibility, or Buffer in Node.js
  if (typeof window !== 'undefined') {
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } else {
    // Server-side: use Buffer
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

/**
 * Generates a gradient blur placeholder
 * Useful for images with gradients or multiple colors
 *
 * @param colors - Array of RGB color values for the gradient
 * @returns Base64 data URL string
 */
export function generateGradientBlurPlaceholder(
  colors: Array<[number, number, number]> = [
    [240, 240, 240],
    [230, 230, 230],
  ],
): string {
  const stops = colors
    .map((color, index) => {
      const offset = colors.length > 1 ? (index / (colors.length - 1)) * 100 : 0;
      return `<stop offset="${offset}%" stop-color="rgb(${color.join(',')})"/>`;
    })
    .join('');

  const svg = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient></defs><rect width="10" height="10" fill="url(#grad)"/></svg>`;

  // Use btoa for browser compatibility, or Buffer in Node.js
  if (typeof window !== 'undefined') {
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  } else {
    // Server-side: use Buffer
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

