import crypto from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import type { Browser } from 'puppeteer-core';

import { createTranslator } from '@/copy';
import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates } from '@/app/pdf/templates/registry';
import type { RenderCtx } from '@/app/pdf/templates/types';

const translator = createTranslator('hu');

const FIXED_ROWS: RenderCtx['rows'] = [
  {
    name: 'Stratégiai workshop',
    qty: 2,
    unit: 'nap',
    unitPrice: 120_000,
    vat: 27,
  },
  {
    name: 'Digitális prototípus',
    qty: 1,
    unit: 'projekt',
    unitPrice: 450_000,
    vat: 27,
  },
  {
    name: 'Támogatás',
    qty: 6,
    unit: 'hónap',
    unitPrice: 75_000,
    vat: 27,
  },
];

const FIXED_BODY_HTML = `
  <section>
    <h2>Bevezető</h2>
    <p>A projekt célja egy modern, AI-támogatott ajánlatkészítő eszköz bevezetése.</p>
    <p>A megoldás lehetővé teszi a csapat számára, hogy gyorsan reagáljon az ügyféligényekre, miközben megőrzi a márka hangját.</p>
    <h2>Szolgáltatások</h2>
    <ul>
      <li>Kezdeti konzultáció és stratégiaalkotás</li>
      <li>Felhasználói élménykutatás és prototípus készítés</li>
      <li>Bevezetési támogatás és csapat tréning</li>
    </ul>
    <h2>Eredmények</h2>
    <p>Az automatizált folyamat 60%-kal csökkenti az ajánlatok összeállításához szükséges időt.</p>
  </section>
`.trim();

function sha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalisePdfMetadata(pdfBinary: Buffer): Buffer {
  const latin1 = pdfBinary.toString('latin1');
  const withFixedDates = latin1
    .replace(/\/CreationDate\s*\([^)]*\)/g, '/CreationDate(D:00000000000000Z)')
    .replace(/\/ModDate\s*\([^)]*\)/g, '/ModDate(D:00000000000000Z)')
    .replace(/\/Producer\s*\((?:\\.|[^)])*\)/g, '/Producer(offer-template-tests)')
    .replace(/\/Creator\s*\((?:\\.|[^)])*\)/g, '/Creator(offer-template-tests)')
    .replace(
      /\/ID\s*\[[^\]]+\]/g,
      '/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]',
    );

  // XMP metadata section may also contain timestamps; replace them with constants.
  const normalisedXmp = withFixedDates
    .replace(/<xmp:CreateDate>[^<]+<\/xmp:CreateDate>/g, '<xmp:CreateDate>0000<\/xmp:CreateDate>')
    .replace(/<xmp:ModifyDate>[^<]+<\/xmp:ModifyDate>/g, '<xmp:ModifyDate>0000<\/xmp:ModifyDate>')
    .replace(/<xmp:MetadataDate>[^<]+<\/xmp:MetadataDate>/g, '<xmp:MetadataDate>0000<\/xmp:MetadataDate>');

  return Buffer.from(normalisedXmp, 'latin1');
}

describe('offer templates golden tests', () => {
  let browser: Browser | null = null;

  beforeAll(async () => {
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  }, 30_000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
      browser = null;
    }
  });

  const templates = listTemplates();

  for (const template of templates) {
    describe(template.id, () => {
      const ctx: RenderCtx = {
        offer: {
          title: 'AI ajánlatkészítő bevezetése',
          companyName: 'Digitális Megoldások Kft.',
          bodyHtml: FIXED_BODY_HTML,
          templateId: template.id,
          locale: 'hu',
          legacyTemplateId: null,
        },
        rows: FIXED_ROWS,
        branding: {
          logoUrl: 'https://cdn.example.com/assets/logo.png',
          primaryColor: '#111827',
          secondaryColor: '#e5e7eb',
        },
        i18n: translator,
        tokens: template.tokens,
      };

      let html: string;

      beforeAll(() => {
        html = buildOfferHtml(ctx, template);
      });

      it('renders stable HTML', () => {
        expect(html).toMatchSnapshot(`${template.id} html`);
      });

      it('produces the expected HTML hash', () => {
        expect(sha256(html)).toMatchSnapshot(`${template.id} html sha256`);
      });

      it('produces a stable PDF hash', async () => {
        if (!browser) {
          throw new Error('Chromium browser not initialised');
        }

        const page = await browser.newPage();
        try {
          await page.setContent(html, { waitUntil: 'networkidle0' });
          const pdfBinary = await page.pdf({ format: 'A4', printBackground: true });
          const pdfBuffer = Buffer.isBuffer(pdfBinary)
            ? pdfBinary
            : Buffer.from(pdfBinary.buffer, pdfBinary.byteOffset, pdfBinary.byteLength);
          const normalised = normalisePdfMetadata(pdfBuffer);
          if (process.env.DEBUG_PDF === '1') {
            const slug = template.id.replace(/[^a-z0-9]/gi, '-');
            writeFileSync(join(process.cwd(), `debug-${slug}-raw.bin`), pdfBuffer);
            writeFileSync(join(process.cwd(), `debug-${slug}-normalised.txt`), normalised.toString('latin1'));
          }
          expect(normalised.toString('latin1')).not.toMatch(/CreationDate \(D:/);
          expect(sha256(normalised)).toMatchSnapshot(`${template.id} pdf sha256`);
        } finally {
          await page.close();
        }
      }, 30_000);
    });
  }
});
