import { describe, expect, it } from 'vitest';

import { offerBodyMarkup } from '../offerDocument';

describe('offerBodyMarkup sanitization', () => {
  const baseProps = {
    title: 'Biztonságos ajánlat',
    companyName: 'Teszt Kft.',
    aiBodyHtml: '<p>Elfogadott tartalom</p>',
    priceTableHtml: '<table><tbody><tr><td>1</td></tr></tbody></table>',
    branding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#123456',
      secondaryColor: '#abcdef',
    },
    templateId: 'modern' as const,
  };

  it('allows safe HTML content', () => {
    expect(() => offerBodyMarkup(baseProps)).not.toThrow();
  });

  it('rejects script tags in the generated markup', () => {
    expect(() =>
      offerBodyMarkup({
        ...baseProps,
        aiBodyHtml: '<script>alert(1)</script>',
      }),
    ).toThrow(/Unsafe HTML blocked/);
  });

  it('rejects event handler attributes in the generated markup', () => {
    expect(() =>
      offerBodyMarkup({
        ...baseProps,
        aiBodyHtml: '<img src="https://example.com/x.png" onerror="alert(1)">',
      }),
    ).toThrow(/Unsafe HTML blocked/);
  });
});
