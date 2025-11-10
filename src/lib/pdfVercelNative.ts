/**
 * Vercel-Native PDF Generation Utility
 *
 * This module provides PDF generation using puppeteer-core + @sparticuz/chromium
 * directly in Vercel serverless functions. This is the industry best practice
 * for PDF generation on Vercel.
 *
 * Industry Best Practices:
 * - Uses puppeteer-core (lightweight, no bundled Chromium)
 * - Uses @sparticuz/chromium (optimized for serverless/AWS Lambda/Vercel)
 * - Runs directly in Vercel serverless functions
 * - No external service dependencies
 * - Lower latency than Supabase Edge Functions
 * - Simpler architecture (single system)
 */

import type { PdfMetadata, PdfGenerationOptions, PuppeteerPage } from './pdfConfig';
import { createPdfOptions, toPuppeteerOptions, setPdfMetadata } from './pdfConfig';
import { assertPdfEngineHtml } from './pdfHtmlSignature';

/**
 * Configuration for Vercel-native PDF generation
 */
const JOB_TIMEOUT_MS = 90_000;

/**
 * Detects if we're running in a Vercel/serverless environment
 */
function isServerlessEnvironment(): boolean {
  return (
    process.env.VERCEL === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.VERCEL_ENV !== undefined
  );
}

/**
 * Gets the Chromium executable path for the current environment
 *
 * In serverless (Vercel), uses @sparticuz/chromium
 * In local development, can use local Puppeteer or @sparticuz/chromium
 */
async function getChromiumExecutablePath(): Promise<string | undefined> {
  if (isServerlessEnvironment()) {
    // In serverless, use @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    // Note: API may vary by version - check for available methods
    if ('setGraphicsMode' in chromium && typeof chromium.setGraphicsMode === 'function') {
      chromium.setGraphicsMode(false); // Disable graphics for serverless
    }
    // executablePath might be a function or property depending on version
    if ('executablePath' in chromium) {
      if (typeof chromium.executablePath === 'function') {
        return await chromium.executablePath();
      } else if (typeof chromium.executablePath === 'string') {
        return chromium.executablePath;
      }
    }
    // Fallback: return undefined to let Puppeteer handle it
    return undefined;
  }

  // In local development, try to use local Puppeteer first
  // Fall back to @sparticuz/chromium if local Puppeteer not available
  try {
    await import('puppeteer');
    // Local Puppeteer will use its bundled Chromium
    return undefined; // Let Puppeteer use its default
  } catch {
    // Fall back to @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    // executablePath might be a function or property depending on version
    if ('executablePath' in chromium) {
      if (typeof chromium.executablePath === 'function') {
        return await chromium.executablePath();
      } else if (typeof chromium.executablePath === 'string') {
        return chromium.executablePath;
      }
    }
    // Fallback: return undefined to let Puppeteer handle it
    return undefined;
  }
}

/**
 * Gets Puppeteer launch options for the current environment
 */
async function getPuppeteerLaunchOptions(): Promise<{
  executablePath?: string;
  args: string[];
  headless: boolean | 'shell';
  defaultViewport?: { width: number; height: number };
}> {
  const executablePath = await getChromiumExecutablePath();
  const isServerless = isServerlessEnvironment();

  if (isServerless && executablePath) {
    // Serverless configuration using @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    // chromium API may vary by version - safely access properties with type checking
    const chromiumArgs = 'args' in chromium && Array.isArray(chromium.args) ? chromium.args : [];
    const chromiumHeadless: boolean | 'shell' =
      'headless' in chromium &&
      typeof chromium.headless !== 'undefined' &&
      (typeof chromium.headless === 'boolean' || chromium.headless === 'shell')
        ? (chromium.headless as boolean | 'shell')
        : true;
    const chromiumViewport =
      'defaultViewport' in chromium &&
      chromium.defaultViewport &&
      typeof chromium.defaultViewport === 'object' &&
      'width' in chromium.defaultViewport &&
      'height' in chromium.defaultViewport
        ? (chromium.defaultViewport as { width: number; height: number })
        : { width: 1280, height: 720 };

    return {
      executablePath,
      args: chromiumArgs,
      headless: chromiumHeadless,
      defaultViewport: chromiumViewport,
    };
  }

  // Local development configuration
  return {
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
    ],
    headless: true,
    defaultViewport: {
      width: 1200,
      height: 1600,
    },
  };
}

/**
 * Sets content on a Puppeteer page with network idle logging
 */
async function setContentWithNetworkIdleLogging(
  page: PuppeteerPage,
  html: string,
  context: string,
): Promise<void> {
  const requestFailures: Array<{ url: string; errorText?: string | null }> = [];
  const responseErrors: Array<{ url: string; status: number }> = [];

  // Set up request/response listeners
  // Use type assertion to handle puppeteer-core event types
  interface PuppeteerRequest {
    url?: string | (() => string);
    failure?: () => { errorText?: string } | null;
  }

  interface PuppeteerResponse {
    url?: string | (() => string);
    status?: number | (() => number);
  }

  const pageWithEvents = page as unknown as {
    on: (event: string, handler: (arg: unknown) => void) => void;
    off?: (event: string, handler: (arg: unknown) => void) => void;
  };

  const onRequestFailed = (request: unknown) => {
    const req = request as PuppeteerRequest;
    try {
      const url = typeof req.url === 'function' ? req.url() : req.url || 'unknown';
      const failure = typeof req.failure === 'function' ? req.failure() : null;
      requestFailures.push({
        url: String(url),
        errorText: failure?.errorText ?? null,
      });
    } catch {
      // Ignore errors in event handlers
    }
  };

  const onResponse = (response: unknown) => {
    const res = response as PuppeteerResponse;
    try {
      const url = typeof res.url === 'function' ? res.url() : res.url || 'unknown';
      const status = typeof res.status === 'function' ? res.status() : res.status;
      if (typeof status === 'number' && status >= 400) {
        responseErrors.push({
          url: String(url),
          status,
        });
      }
    } catch {
      // Ignore errors in event handlers
    }
  };

  pageWithEvents.on('requestfailed', onRequestFailed);
  pageWithEvents.on('response', onResponse);

  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
  } catch (error) {
    console.error(`Failed to set content for ${context}:`, error);
    if (requestFailures.length > 0) {
      console.warn(`Request failures in ${context}:`, requestFailures);
    }
    if (responseErrors.length > 0) {
      console.warn(`Response errors in ${context}:`, responseErrors);
    }
    throw error;
  } finally {
    // Clean up event listeners if supported
    if (pageWithEvents.off) {
      try {
        pageWithEvents.off('requestfailed', onRequestFailed);
        pageWithEvents.off('response', onResponse);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Generates a PDF from HTML using Vercel-native Puppeteer
 *
 * @param html - The HTML content to convert to PDF
 * @param options - PDF generation options (metadata, margins, etc.)
 * @returns PDF binary data as Buffer
 */
export async function generatePdfVercelNative(
  html: string,
  options?: {
    metadata?: PdfMetadata;
    pdfOptions?: Partial<PdfGenerationOptions>;
  },
): Promise<Buffer> {
  // Validate HTML signature
  assertPdfEngineHtml(html, 'Vercel-native PDF generation');

  // Import puppeteer-core (lightweight, no bundled Chromium)
  const puppeteer = await import('puppeteer-core');

  // Get launch options for current environment
  const launchOptions = await getPuppeteerLaunchOptions();

  // Launch browser
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = (await browser.newPage()) as unknown as PuppeteerPage;

    // Set timeouts
    page.setDefaultNavigationTimeout(JOB_TIMEOUT_MS);
    page.setDefaultTimeout(JOB_TIMEOUT_MS);

    // Set viewport for consistent rendering
    if (launchOptions.defaultViewport) {
      await page.setViewport({
        width: launchOptions.defaultViewport.width,
        height: launchOptions.defaultViewport.height,
        deviceScaleFactor: 2,
      });
    } else {
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });
    }

    // Set content with network idle waiting
    await setContentWithNetworkIdleLogging(page, html, 'vercel-native-pdf');

    // Extract document title for metadata
    const documentTitle = await page.title().catch(() => 'Offer Document');

    // Create PDF metadata
    const pdfMetadata: PdfMetadata = {
      title: documentTitle || options?.metadata?.title || 'Offer Document',
      author: options?.metadata?.author || 'AI Offer Platform',
      subject: options?.metadata?.subject || 'Business Offer',
      keywords: options?.metadata?.keywords || 'offer,business,proposal',
      creator: options?.metadata?.creator || 'AI Offer Platform',
      producer: options?.metadata?.producer || 'AI Offer Platform',
      ...options?.metadata,
    };

    // Set PDF metadata on the page
    await setPdfMetadata(page, pdfMetadata);

    // Create PDF options
    const pdfOptions = createPdfOptions(pdfMetadata, options?.pdfOptions);
    const puppeteerOptions = toPuppeteerOptions(pdfOptions);

    // Generate PDF
    // Type assertion needed because puppeteer-core types may differ
    // Puppeteer Page type doesn't expose pdf method in all type definitions
    const pdfResult = await (page as { pdf: (options: unknown) => Promise<Buffer> }).pdf(
      puppeteerOptions,
    );

    // Close page
    await page.close();

    // Convert to Buffer - handle both Buffer and Uint8Array/ArrayBuffer
    if (Buffer.isBuffer(pdfResult)) {
      return pdfResult;
    }
    // Type guard: check if it's an ArrayBuffer
    const isArrayBuffer = (val: unknown): val is ArrayBuffer =>
      typeof val === 'object' && val !== null && val.constructor === ArrayBuffer;
    if (isArrayBuffer(pdfResult)) {
      return Buffer.from(new Uint8Array(pdfResult));
    }
    // Handle Uint8Array or other array-like objects
    return Buffer.from(pdfResult as Uint8Array | ArrayLike<number>);
  } finally {
    // Always close browser
    try {
      await browser.close();
    } catch (error) {
      console.error('Failed to close browser in Vercel-native PDF generation:', error);
    }
  }
}

/**
 * Generates a PDF from HTML with timeout protection
 *
 * @param html - The HTML content to convert to PDF
 * @param options - PDF generation options
 * @param timeoutMs - Timeout in milliseconds (default: 90 seconds)
 * @returns PDF binary data as Buffer
 */
export async function generatePdfVercelNativeWithTimeout(
  html: string,
  options?: {
    metadata?: PdfMetadata;
    pdfOptions?: Partial<PdfGenerationOptions>;
  },
  timeoutMs: number = JOB_TIMEOUT_MS,
): Promise<Buffer> {
  return Promise.race([
    generatePdfVercelNative(html, options),
    new Promise<Buffer>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`PDF generation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}
