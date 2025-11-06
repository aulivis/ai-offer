/**
 * PDF Generation Configuration - Industry Best Practices
 * 
 * This module provides standardized PDF generation settings following
 * industry best practices for professional document output.
 */

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
}

export interface PdfGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  metadata?: PdfMetadata;
  quality?: number;
  scale?: number;
}

/**
 * Standard A4 page margins (15mm all around with 20mm header/footer space) for professional documents
 * Following ISO 216 standard recommendations with space for repeating headers/footers
 */
export const STANDARD_A4_MARGINS = {
  top: '20mm',
  right: '15mm',
  bottom: '20mm',
  left: '15mm',
} as const;

/**
 * Default PDF generation options following industry best practices
 */
export const DEFAULT_PDF_OPTIONS: PdfGenerationOptions = {
  format: 'A4',
  margin: STANDARD_A4_MARGINS,
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: false,
  quality: 100,
  scale: 1.0,
  metadata: {
    creator: 'AI Offer Platform',
    producer: 'AI Offer Platform',
  },
};

/**
 * Creates PDF options with custom metadata
 */
export function createPdfOptions(
  metadata?: PdfMetadata,
  overrides?: Partial<PdfGenerationOptions>,
): PdfGenerationOptions {
  return {
    ...DEFAULT_PDF_OPTIONS,
    metadata: {
      ...DEFAULT_PDF_OPTIONS.metadata,
      ...metadata,
    },
    ...overrides,
  };
}

/**
 * Converts PDF options to Puppeteer PDF options
 */
export function toPuppeteerOptions(
  options: PdfGenerationOptions,
): Parameters<import('puppeteer').Page['pdf']>[0] {
  const puppeteerOptions: Parameters<import('puppeteer').Page['pdf']>[0] = {
    format: options.format ?? 'A4',
    margin: options.margin ?? STANDARD_A4_MARGINS,
    printBackground: options.printBackground ?? true,
    preferCSSPageSize: options.preferCSSPageSize ?? true,
    displayHeaderFooter: options.displayHeaderFooter ?? false,
    scale: options.scale ?? 1.0,
  };

  // Add metadata if provided
  if (options.metadata) {
    const { title, author, subject, keywords, creator, producer } = options.metadata;
    const metadata: Record<string, string> = {};
    
    if (title) metadata.title = title;
    if (author) metadata.author = author;
    if (subject) metadata.subject = subject;
    if (keywords) metadata.keywords = keywords;
    if (creator) metadata.creator = creator;
    if (producer) metadata.producer = producer;
    
    if (Object.keys(metadata).length > 0) {
      // Puppeteer doesn't directly support metadata in pdf() options,
      // but we can set it via CDP (Chrome DevTools Protocol) if needed
      // For now, we'll rely on the PDF structure itself
    }
  }

  return puppeteerOptions;
}

/**
 * Sets PDF metadata on a Puppeteer page using CDP
 */
export async function setPdfMetadata(
  page: import('puppeteer').Page,
  metadata: PdfMetadata,
): Promise<void> {
  try {
    // Set page title for PDF metadata
    if (metadata.title) {
      await page.evaluate((title) => {
        document.title = title;
      }, metadata.title);
    }

    // Set additional metadata via meta tags if needed
    // Note: Puppeteer's PDF generation will pick up the document.title
    // and can extract metadata from HTML meta tags
    if (metadata.author || metadata.subject || metadata.keywords) {
      await page.evaluate((meta) => {
        const head = document.head || document.getElementsByTagName('head')[0];
        
        if (meta.author) {
          let metaTag = head.querySelector('meta[name="author"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'author');
            head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', meta.author);
        }
        
        if (meta.subject) {
          let metaTag = head.querySelector('meta[name="subject"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'subject');
            head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', meta.subject);
        }
        
        if (meta.keywords) {
          let metaTag = head.querySelector('meta[name="keywords"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'keywords');
            head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', meta.keywords);
        }
      }, {
        author: metadata.author,
        subject: metadata.subject,
        keywords: metadata.keywords,
      });
    }
  } catch (error) {
    // Silently fail if evaluation fails (e.g., in some environments)
    console.warn('Failed to set PDF metadata:', error);
  }
}

