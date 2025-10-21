/**
 * Build a complete HTML document for the generated offer PDF.  This
 * helper encapsulates the structure and inline CSS so that the PDF
 * generation logic in the API route can focus on business logic.  The
 * AI‑generated body (`aiBodyHtml`) and the price table (`priceTableHtml`)
 * are assumed to be sanitized already.
 */

export interface OfferHtmlProps {
  title: string;
  companyName: string;
  aiBodyHtml: string;
  priceTableHtml: string;
}

export function offerHtml({ title, companyName, aiBodyHtml, priceTableHtml }: OfferHtmlProps): string {
  return `
    <!DOCTYPE html>
    <html lang="hu">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 2rem;
            color: #1a1a1a;
          }
          header {
            text-align: right;
            margin-bottom: 2rem;
          }
          h1 {
            font-size: 24px;
            margin: 0;
          }
          .company {
            font-size: 14px;
            color: #555;
          }
          .content {
            margin-top: 1rem;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2rem;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background-color: #f5f5f5;
          }
          tfoot td {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="company">${companyName}</div>
          <h1>${title}</h1>
        </header>
        <div class="content">
          ${aiBodyHtml}
        </div>
        ${priceTableHtml}
      </body>
    </html>
  `;
}