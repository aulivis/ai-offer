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
  overrides?: Partial<PdfGenerationOptions | PdfGenerationOptionsWithTemplates>,
): PdfGenerationOptions | PdfGenerationOptionsWithTemplates {
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
 * PDF options type that works with both puppeteer and puppeteer-core
 */
export type PuppeteerPdfOptions = {
  format?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | string;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
  width?: string;
  height?: string;
  landscape?: boolean;
};

export interface PdfGenerationOptionsWithTemplates extends PdfGenerationOptions {
  headerTemplate?: string;
  footerTemplate?: string;
}

/**
 * Converts PDF options to Puppeteer PDF options
 * Works with both puppeteer and puppeteer-core
 */
export function toPuppeteerOptions(
  options: PdfGenerationOptions | PdfGenerationOptionsWithTemplates,
): PuppeteerPdfOptions {
  const puppeteerOptions: PuppeteerPdfOptions = {
    format: options.format ?? 'A4',
    margin: options.margin ?? STANDARD_A4_MARGINS,
    printBackground: options.printBackground ?? true,
    preferCSSPageSize: options.preferCSSPageSize ?? true,
    displayHeaderFooter: options.displayHeaderFooter ?? false,
    scale: options.scale ?? 1.0,
  };

  // Add header/footer templates if provided
  if ('headerTemplate' in options && options.headerTemplate) {
    puppeteerOptions.headerTemplate = options.headerTemplate;
  }

  if ('footerTemplate' in options && options.footerTemplate) {
    puppeteerOptions.footerTemplate = options.footerTemplate;
  }

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
 * Puppeteer Page type that works with both puppeteer and puppeteer-core
 */
export type PuppeteerPage = {
  evaluate: (<T extends unknown[]>(fn: (...args: T) => void, ...args: T) => Promise<unknown>) &
    (<T>(fn: () => T) => Promise<T>);
  title: () => Promise<string>;
  setContent: (
    html: string,
    options: { waitUntil: 'networkidle0' | 'load' | 'domcontentloaded' },
  ) => Promise<void>;
  pdf: (options: PuppeteerPdfOptions) => Promise<Buffer | Uint8Array | ArrayBuffer>;
  setViewport: (viewport: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  }) => Promise<void>;
  setDefaultNavigationTimeout: (timeout: number) => void;
  setDefaultTimeout: (timeout: number) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  close: () => Promise<void>;
};

/**
 * Sets PDF metadata on a Puppeteer page using CDP
 * Works with both puppeteer and puppeteer-core
 */
export async function setPdfMetadata(page: PuppeteerPage, metadata: PdfMetadata): Promise<void> {
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
      const metaData = {
        author: metadata.author,
        subject: metadata.subject,
        keywords: metadata.keywords,
      };
      await page.evaluate(
        (meta: { author?: string; subject?: string; keywords?: string }) => {
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
        },
        metaData as { author?: string; subject?: string; keywords?: string },
      );
    }
  } catch (error) {
    // Silently fail if evaluation fails (e.g., in some environments)
    console.warn('Failed to set PDF metadata:', error);
  }
}
