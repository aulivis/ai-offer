/**
 * PDF Template Utilities
 *
 * This module provides utilities for extracting header/footer data from HTML
 * and creating Puppeteer header/footer templates for page numbering.
 */

import { createFooterTemplate, createHeaderTemplate } from './pdfPageNumbers';
import { logger } from '@/lib/logger';

/**
 * Extract header/footer data from rendered HTML
 * This data is used to create Puppeteer templates for page numbering
 */
export async function extractHeaderFooterData(page: {
  evaluate: (
    fn: () => {
      companyName: string;
      title: string;
      issueDate: string;
      companyAddress: string;
      companyTaxId: string;
      dateLabel: string;
      pageLabel: string;
      logoUrl: string | null;
    } | null,
  ) => Promise<{
    companyName: string;
    title: string;
    issueDate: string;
    companyAddress: string;
    companyTaxId: string;
    dateLabel: string;
    pageLabel: string;
    logoUrl: string | null;
  } | null>;
}): Promise<{
  footerTemplate: string;
  headerTemplate: string;
} | null> {
  try {
    const data = await page.evaluate(() => {
      // Extract data from the slim footer
      const footer = document.querySelector('.slim-footer');
      const header = document.querySelector('.slim-header');

      if (!footer) {
        return null;
      }

      // Extract company name
      const companyEl = footer.querySelector('.slim-footer > div > span:first-child');
      const companyName = companyEl?.textContent?.trim() || '';

      // Extract company address
      const addressEl = footer.querySelector('.slim-footer > div > span:nth-child(2)');
      const companyAddress = addressEl?.textContent?.trim() || '';

      // Extract tax ID
      const taxIdEl = footer.querySelector('.slim-footer > div > span:nth-child(3)');
      const companyTaxId = taxIdEl?.textContent?.trim() || '';

      // Extract page label
      const pageNumberEl = footer.querySelector('.slim-footer__page-number');
      const pageLabel =
        pageNumberEl?.getAttribute('data-page-label') ||
        pageNumberEl?.textContent?.trim() ||
        'Page';

      // Extract header data
      let title = '';
      let issueDate = '';
      let dateLabel = '';
      let logoUrl: string | null = null;

      if (header) {
        const titleEl = header.querySelector('.slim-header__title');
        title = titleEl?.textContent?.trim() || '';

        const metaEl = header.querySelector('.slim-header__meta');
        const metaText = metaEl?.textContent?.trim() || '';
        // Parse "Date: 2024-01-01" format
        const dateMatch = metaText.match(/^(.+?):\s*(.+)$/);
        if (dateMatch) {
          dateLabel = dateMatch[1]?.trim() || '';
          issueDate = dateMatch[2]?.trim() || '';
        }

        const logoEl = header.querySelector('img');
        logoUrl = logoEl?.getAttribute('src') || null;
      }

      // Fallback: try to extract from main header
      if (!title) {
        const mainHeader = document.querySelector('.offer-doc__header');
        const titleEl = mainHeader?.querySelector('.offer-doc__title');
        title = titleEl?.textContent?.trim() || '';
      }

      return {
        companyName,
        title,
        issueDate,
        companyAddress,
        companyTaxId,
        dateLabel,
        pageLabel,
        logoUrl,
      };
    });

    if (!data) {
      return null;
    }

    // Create templates
    const footerTemplate = createFooterTemplate(
      data.companyName,
      data.companyAddress,
      data.companyTaxId,
      data.pageLabel,
    );

    const headerTemplate = createHeaderTemplate(
      data.companyName,
      data.title,
      data.issueDate,
      data.dateLabel,
      data.logoUrl || undefined,
    );

    return { footerTemplate, headerTemplate };
  } catch (error) {
    logger.warn('Failed to extract header/footer data', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return null;
  }
}
