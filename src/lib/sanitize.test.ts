import { describe, expect, it } from 'vitest';
import { sanitizeHTML, sanitizeInput } from './sanitize';

describe('sanitizeInput', () => {
  it('escapes critical html characters', () => {
    expect(sanitizeInput('<script>"&')).toBe('&lt;script&gt;&quot;&amp;');
  });

  it('handles nullish inputs', () => {
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(null)).toBe('');
  });
});

describe('sanitizeHTML', () => {
  it('preserves allowed tags and attributes', () => {
    const html =
      '<p>Example <strong>text</strong> with <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>.</p>';
    expect(sanitizeHTML(html)).toBe(
      '<p>Example <strong>text</strong> with <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a>.</p>',
    );
  });

  it('strips disallowed tags and their content', () => {
    const html = '<p>ok</p><script>alert(1)</script>';
    expect(sanitizeHTML(html)).toBe('<p>ok</p>');
  });

  it('drops invalid urls and attributes', () => {
    const html = '<a href="javascript:alert(1)" target="_self" rel="noreferrer evil">bad</a>';
    expect(sanitizeHTML(html)).toBe('<a target="_self" rel="noreferrer">bad</a>');
  });

  it('normalises colspan and rowspan values', () => {
    const html = '<td colspan="02" rowspan="-1">cell</td>';
    expect(sanitizeHTML(html)).toBe('<td colspan="2">cell</td>');
  });

  it('escapes stray text between tags', () => {
    const html = '<div>Unsafe < on purpose</div>';
    expect(sanitizeHTML(html)).toBe('<div>Unsafe &lt; on purpose</div>');
  });

  it('allows img tags with safe attributes and strips the rest', () => {
    const html =
      '<p>Előnézet</p><img src="data:image/png;base64,AAAA" alt="logo" data-offer-image-key="img-1" width="200" onclick="evil()" />';
    expect(sanitizeHTML(html)).toBe(
      '<p>Előnézet</p><img src="data:image/png;base64,AAAA" alt="logo" data-offer-image-key="img-1" />',
    );
  });
});
