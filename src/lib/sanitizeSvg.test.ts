import { describe, expect, it } from 'vitest';
import { sanitizeSvgMarkup } from './sanitizeSvg';

describe('sanitizeSvgMarkup', () => {
  it('adds missing closing tags to produce well-formed svg', () => {
    const malformed = '<svg><g><rect fill="red">';
    expect(sanitizeSvgMarkup(malformed)).toBe('<svg><g><rect fill="red" /></g></svg>');
  });

  it('restores structure even when dropping disallowed content', () => {
    const malformed = '<svg><g><script>alert(1)';
    expect(sanitizeSvgMarkup(malformed)).toBe('<svg><g></g></svg>');
  });

  it('closes the root element when it is left open', () => {
    expect(sanitizeSvgMarkup('<svg>')).toBe('<svg></svg>');
  });
});
