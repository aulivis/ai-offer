import { describe, expect, it } from 'vitest';

import { sanitizeHTML } from '../sanitize';

describe('sanitizeHTML', () => {
  it('strips script tags and dangerous attributes', () => {
    const dirty = '<h2>Title</h2><script>alert(1)</script><p onclick="evil()">Body</p>';
    const clean = sanitizeHTML(dirty);

    expect(clean).toBe('<h2>Title</h2><p>Body</p>');
  });

  it('preserves allowed table markup and anchor attributes', () => {
    const html = `
      <p>Lásd a részleteket:</p>
      <a href="https://example.com" rel="noopener" target="_blank">link</a>
      <table>
        <thead><tr><th colspan="2">Fejléc</th></tr></thead>
        <tbody><tr><td colspan="2">Tartalom</td></tr></tbody>
      </table>
    `;
    const clean = sanitizeHTML(html);

    expect(clean).toContain('<p>Lásd a részleteket:</p>');
    expect(clean).toContain(
      '<a href="https://example.com" rel="noopener noreferrer" target="_blank">link</a>',
    );
    expect(clean).toContain('<th colspan="2">Fejléc</th>');
    expect(clean).toContain('<td colspan="2">Tartalom</td>');
  });

  it('sanitises image tags while keeping safe sources', () => {
    const html = `
      <img src="http://example.com/logo.png" alt="Logo" data-offer-image-key="hero">
      <img src="javascript:alert(1)">
    `;

    const clean = sanitizeHTML(html);

    expect(clean).toContain(
      '<img src="http://example.com/logo.png" alt="Logo" data-offer-image-key="hero" />',
    );
    expect(clean).not.toContain('javascript:');
  });
});
