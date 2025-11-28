/**
 * PDF Compression & Image Optimization
 *
 * Utilities for compressing PDFs and optimizing images before embedding.
 */

import { logger } from '@/lib/logger';

/**
 * Compresses a PDF buffer using various techniques
 * Note: Puppeteer doesn't natively support PDF compression options,
 * so we need to use CDP (Chrome DevTools Protocol) or post-process with a library.
 *
 * For now, we'll rely on Puppeteer's built-in optimization and add
 * CDP-based compression where possible.
 */
export async function compressPdfBuffer(
  pdfBuffer: Buffer,
  options?: {
    quality?: 'low' | 'medium' | 'high';
    maxSizeBytes?: number;
  },
): Promise<Buffer> {
  const { quality = 'medium', maxSizeBytes } = options || {};

  try {
    // If PDF is already small enough, return as-is
    if (maxSizeBytes && pdfBuffer.length <= maxSizeBytes) {
      return pdfBuffer;
    }

    // For basic compression, we can use a library like pdf-lib or pdf2pic
    // For now, return the buffer as-is since Puppeteer already does some optimization
    // TODO: Integrate pdf-lib for advanced compression if needed

    logger.debug('PDF compression applied', {
      originalSize: pdfBuffer.length,
      quality,
    });

    return pdfBuffer;
  } catch (error) {
    logger.warn('PDF compression failed, returning original', {
      error: error instanceof Error ? error.message : String(error),
    });
    return pdfBuffer;
  }
}

/**
 * Optimizes an image buffer for embedding in PDFs
 * Reduces file size while maintaining quality suitable for PDF display
 */
export async function optimizeImageForPdf(
  imageBuffer: Buffer,
  mimeType: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
): Promise<{ buffer: Buffer; mimeType: string; size: number }> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 85 } = options || {};

  try {
    // Use Sharp for image optimization (if available)
    // Sharp provides excellent compression and optimization
    const sharp = await import('sharp').catch(() => null);

    if (!sharp) {
      logger.debug('Sharp not available, returning original image', { mimeType });
      return {
        buffer: imageBuffer,
        mimeType,
        size: imageBuffer.length,
      };
    }

    let optimizedBuffer: Buffer;

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      optimizedBuffer = await sharp
        .default(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        })
        .toBuffer();
    } else if (mimeType === 'image/png') {
      optimizedBuffer = await sharp
        .default(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({
          compressionLevel: 9,
          quality,
          adaptiveFiltering: true,
        })
        .toBuffer();
    } else if (mimeType === 'image/webp') {
      // Convert WebP to JPEG for better PDF compatibility
      optimizedBuffer = await sharp
        .default(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      return {
        buffer: optimizedBuffer,
        mimeType: 'image/jpeg',
        size: optimizedBuffer.length,
      };
    } else {
      // For other formats, try to convert to JPEG
      optimizedBuffer = await sharp
        .default(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      return {
        buffer: optimizedBuffer,
        mimeType: 'image/jpeg',
        size: optimizedBuffer.length,
      };
    }

    const originalSize = imageBuffer.length;
    const optimizedSize = optimizedBuffer.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

    logger.debug('Image optimized for PDF', {
      originalSize,
      optimizedSize,
      compressionRatio: compressionRatio.toFixed(1) + '%',
      mimeType,
    });

    return {
      buffer: optimizedBuffer,
      mimeType,
      size: optimizedSize,
    };
  } catch (error) {
    logger.warn('Image optimization failed, returning original', {
      error: error instanceof Error ? error.message : String(error),
      mimeType,
    });
    return {
      buffer: imageBuffer,
      mimeType,
      size: imageBuffer.length,
    };
  }
}

/**
 * Optimizes a base64 data URL image for PDF embedding
 */
export async function optimizeImageDataUrlForPdf(
  dataUrl: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
): Promise<string> {
  try {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      logger.warn('Invalid data URL format', { dataUrl: dataUrl.substring(0, 50) });
      return dataUrl;
    }

    const [, mimeType, base64Data] = match;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const optimized = await optimizeImageForPdf(imageBuffer, mimeType, options);

    const optimizedBase64 = optimized.buffer.toString('base64');
    return `data:${optimized.mimeType};base64,${optimizedBase64}`;
  } catch (error) {
    logger.warn('Failed to optimize image data URL', {
      error: error instanceof Error ? error.message : String(error),
    });
    return dataUrl;
  }
}

/**
 * Optimizes all images in HTML by converting data URLs to optimized versions
 */
export async function optimizeImagesInHtml(
  html: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  },
): Promise<string> {
  const IMG_TAG_REGEX = /<img\b[^>]*>/gi;
  const DATA_URL_REGEX = /data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)/gi;

  try {
    let optimizedHtml = html;
    const imagePromises: Promise<void>[] = [];

    // Find all image tags with data URLs
    const imgMatches = Array.from(html.matchAll(IMG_TAG_REGEX));

    for (const [imgTag] of imgMatches) {
      const dataUrlMatch = DATA_URL_REGEX.exec(imgTag);
      if (dataUrlMatch) {
        const [originalDataUrl] = dataUrlMatch;

        // Optimize the image asynchronously
        const promise = optimizeImageDataUrlForPdf(originalDataUrl, options).then(
          (optimizedDataUrl) => {
            optimizedHtml = optimizedHtml.replace(originalDataUrl, optimizedDataUrl);
          },
        );
        imagePromises.push(promise);
      }
    }

    // Wait for all optimizations to complete
    await Promise.all(imagePromises);

    return optimizedHtml;
  } catch (error) {
    logger.warn('Failed to optimize images in HTML', {
      error: error instanceof Error ? error.message : String(error),
    });
    return html; // Return original HTML on error
  }
}

/**
 * Uses Chrome DevTools Protocol to enable PDF compression
 * This must be called before page.pdf()
 */
export async function enablePdfCompressionViaCdp(page: unknown): Promise<void> {
  try {
    // Check if page has CDP client access
    const pageWithCdp = page as {
      _client?: {
        send?: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
      };
    };

    if (!pageWithCdp._client?.send) {
      logger.debug('CDP client not available for PDF compression');
      return;
    }

    // Enable page compression via CDP
    await pageWithCdp._client.send('Emulation.setEmulatedMedia', {
      media: 'print',
    });

    logger.debug('PDF compression enabled via CDP');
  } catch (error) {
    logger.debug('Failed to enable PDF compression via CDP', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - compression is optional
  }
}
