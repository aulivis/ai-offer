/**
 * Build a complete HTML document for the generated offer PDF.  This
 * helper encapsulates the structure and inline CSS so that the PDF
 * generation logic in the API route can focus on business logic.  The
 * AI‑generated body (`aiBodyHtml`) and the price table (`priceTableHtml`)
 * are assumed to be sanitized already.
 */

import { offerBodyMarkup, OFFER_DOCUMENT_PDF_STYLES, OFFER_DOCUMENT_STYLES, type OfferDocumentMarkupProps } from './offerDocument';

export type OfferHtmlProps = OfferDocumentMarkupProps;

export function offerHtml({ title, companyName, aiBodyHtml, priceTableHtml, branding }: OfferHtmlProps): string {
  return `
    <!DOCTYPE html>
    <html lang="hu">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          ${OFFER_DOCUMENT_PDF_STYLES}
          ${OFFER_DOCUMENT_STYLES}
        </style>
      </head>
      <body>
        ${offerBodyMarkup({ title, companyName, aiBodyHtml, priceTableHtml, branding })}
      </body>
    </html>
  `;
}