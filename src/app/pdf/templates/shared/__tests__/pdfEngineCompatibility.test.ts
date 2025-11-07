/**
 * PDF Engine Compatibility Tests
 * 
 * Tests that verify our templates work correctly with the PDF generation engine (Puppeteer/Chrome).
 * This ensures Flexbox, CSS Grid, and other CSS features are properly supported.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'puppeteer-core';

import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates } from '@/app/pdf/templates/engineRegistry';
import { createTranslator } from '@/copy';

describe('PDF Engine Compatibility', () => {
  let browser: Browser | null = null;

  beforeAll(async () => {
    try {
      const chromium = await import('@sparticuz/chromium');
      const puppeteer = await import('puppeteer-core');
      const executablePath = await chromium.executablePath();

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
      });
    } catch (error) {
      console.warn('Chromium not available, skipping PDF engine compatibility tests');
      browser = null;
    }
  }, 30_000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
      browser = null;
    }
  });

  const templates = listTemplates();
  const translator = createTranslator('hu');

  for (const template of templates) {
    describe(`Template: ${template.id}`, () => {
      it('should render without layout errors', async () => {
        if (!browser) {
          return; // Skip if browser not available
        }

        const html = buildOfferHtml({
          offer: {
            title: 'Test Offer',
            companyName: 'Test Company',
            bodyHtml: '<p>Test content</p>',
            templateId: template.id,
            locale: 'hu',
            legacyTemplateId: null,
            issueDate: '2025-01-01',
            contactName: 'Test User',
            contactEmail: 'test@example.com',
            contactPhone: '+36 30 123 4567',
            companyWebsite: 'https://example.com',
            companyAddress: 'Test Address',
            companyTaxId: '12345678-1-12',
          },
          rows: [
            {
              name: 'Test Item',
              qty: 1,
              unit: 'piece',
              unitPrice: 1000,
              vat: 27,
            },
          ],
          branding: {
            logoUrl: 'https://example.com/logo.png',
            primaryColor: '#1c274c',
            secondaryColor: '#e2e8f0',
          },
          i18n: translator,
          templateId: template.id,
        });

        const page = await browser.newPage();
        try {
          // Set console error handler to catch layout errors
          const errors: string[] = [];
          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              errors.push(msg.text());
            }
          });

          await page.setContent(html, { waitUntil: 'networkidle0' });

          // Check for CSS errors (layout issues)
          const cssErrors = errors.filter((error) =>
            error.toLowerCase().includes('css') || error.toLowerCase().includes('layout'),
          );

          expect(cssErrors).toHaveLength(0);
        } finally {
          await page.close();
        }
      }, 30_000);

      it('should handle flexbox layouts correctly', async () => {
        if (!browser) {
          return;
        }

        const html = buildOfferHtml({
          offer: {
            title: 'Test Offer with Long Company Name That Should Wrap Properly',
            companyName: 'Very Long Company Name That Should Not Overlap',
            bodyHtml: '<p>Test content</p>',
            templateId: template.id,
            locale: 'hu',
            legacyTemplateId: null,
            issueDate: '2025-01-01',
            contactName: 'Test User',
            contactEmail: 'test@example.com',
            contactPhone: '+36 30 123 4567',
            companyWebsite: 'https://example.com',
            companyAddress: 'Very Long Address That Should Wrap Properly Without Overlapping',
            companyTaxId: '12345678-1-12',
          },
          rows: [],
          branding: undefined,
          i18n: translator,
          templateId: template.id,
        });

        const page = await browser.newPage();
        try {
          await page.setContent(html, { waitUntil: 'networkidle0' });

          // Check that text doesn't overlap (this would indicate flexbox issues)
          const overlappingElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const overlaps: Array<{ el1: string; el2: string }> = [];

            for (let i = 0; i < elements.length; i++) {
              for (let j = i + 1; j < elements.length; j++) {
                const rect1 = elements[i].getBoundingClientRect();
                const rect2 = elements[j].getBoundingClientRect();

                // Check if elements overlap significantly (more than 50%)
                if (
                  rect1.top < rect2.bottom &&
                  rect1.bottom > rect2.top &&
                  rect1.left < rect2.right &&
                  rect1.right > rect2.left
                ) {
                  const overlapArea =
                    Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)) *
                    Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
                  const area1 = rect1.width * rect1.height;
                  const area2 = rect2.width * rect2.height;
                  const overlapRatio = overlapArea / Math.min(area1, area2);

                  if (overlapRatio > 0.5 && elements[i].textContent && elements[j].textContent) {
                    overlaps.push({
                      el1: elements[i].tagName + (elements[i].className ? `.${elements[i].className}` : ''),
                      el2: elements[j].tagName + (elements[j].className ? `.${elements[j].className}` : ''),
                    });
                  }
                }
              }
            }

            return overlaps;
          });

          // Allow some overlaps (e.g., in headers/footers) but not excessive ones
          expect(overlappingElements.length).toBeLessThan(10);
        } finally {
          await page.close();
        }
      }, 30_000);

      it('should generate valid PDF without errors', async () => {
        if (!browser) {
          return;
        }

        const html = buildOfferHtml({
          offer: {
            title: 'Test Offer',
            companyName: 'Test Company',
            bodyHtml: '<p>Test content</p>',
            templateId: template.id,
            locale: 'hu',
            legacyTemplateId: null,
            issueDate: '2025-01-01',
            contactName: 'Test User',
            contactEmail: 'test@example.com',
            contactPhone: '+36 30 123 4567',
            companyWebsite: 'https://example.com',
            companyAddress: 'Test Address',
            companyTaxId: '12345678-1-12',
          },
          rows: [],
          branding: undefined,
          i18n: translator,
          templateId: template.id,
        });

        const page = await browser.newPage();
        try {
          await page.setContent(html, { waitUntil: 'networkidle0' });

          const pdf = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
            format: 'A4',
          });

          expect(pdf).toBeInstanceOf(Buffer);
          expect(pdf.length).toBeGreaterThan(0);

          // Verify PDF header (should start with %PDF)
          const pdfHeader = pdf.toString('latin1', 0, 4);
          expect(pdfHeader).toBe('%PDF');
        } finally {
          await page.close();
        }
      }, 30_000);
    });
  }
});

