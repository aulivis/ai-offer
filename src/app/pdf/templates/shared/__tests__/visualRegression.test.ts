/**
 * Visual Regression Tests for PDF Templates
 * 
 * These tests generate PDFs and compare them against golden files to detect
 * visual regressions in template rendering.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { Browser } from 'puppeteer-core';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildOfferHtml } from '@/app/pdf/templates/engine';
import { listTemplates } from '@/app/pdf/templates/engineRegistry';
import { createTranslator } from '@/copy';

// Set this environment variable to update golden files
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === '1';

describe('Visual Regression Tests', () => {
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
      console.warn('Chromium not available, skipping visual regression tests');
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
      it('should generate visually consistent PDFs', async () => {
        if (!browser) {
          return; // Skip if browser not available
        }

        const html = buildOfferHtml({
          offer: {
            title: 'AI ajánlatkészítő bevezetése',
            companyName: 'Digitális Megoldások Kft.',
            bodyHtml: '<p>Test content for visual regression testing.</p>',
            templateId: template.id,
            locale: 'hu',
            legacyTemplateId: null,
            issueDate: '2025-01-15',
            contactName: 'Test User',
            contactEmail: 'test@example.com',
            contactPhone: '+36 30 123 4567',
            companyWebsite: 'https://example.com',
            companyAddress: 'Budapest, Test Street 1.',
            companyTaxId: '12345678-1-12',
          },
          rows: [
            {
              name: 'Test Service',
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
          await page.setContent(html, { waitUntil: 'networkidle0' });

          const pdf = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
            format: 'A4',
          });

          const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

          // Generate golden file path
          const goldenPath = join(
            process.cwd(),
            'web/src/app/pdf/templates/__tests__/golden',
            `${template.id.replace(/[^a-z0-9]/gi, '-')}.pdf`,
          );

          if (UPDATE_GOLDEN) {
            // Update golden file
            writeFileSync(goldenPath, pdfBuffer);
            console.log(`Updated golden file: ${goldenPath}`);
          } else {
            // Compare with golden file
            if (existsSync(goldenPath)) {
              const goldenPdf = readFileSync(goldenPath);
              // Simple byte comparison (for basic regression detection)
              // In production, you might want to use pixel-level comparison
              expect(pdfBuffer.length).toBe(goldenPdf.length);
              expect(pdfBuffer.equals(goldenPdf)).toBe(true);
            } else {
              // First run - create golden file
              writeFileSync(goldenPath, pdfBuffer);
              console.log(`Created golden file: ${goldenPath}`);
            }
          }
        } finally {
          await page.close();
        }
      }, 30_000);
    });
  }
});

