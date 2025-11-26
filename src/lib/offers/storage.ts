import { logger } from '@/lib/logger';

export function extractOfferStoragePath(pdfUrl: string): string | null {
  const normalized = pdfUrl.trim();
  if (!normalized) return null;

  const removeLeadingSlash = (value: string) => value.replace(/^\/+/, '');

  const decodeAndNormalize = (value: string): string | null => {
    if (!value) return null;
    try {
      return removeLeadingSlash(decodeURIComponent(value));
    } catch (error) {
      logger.warn('Failed to decode offer PDF storage path', error, {
        pdfUrl: pdfUrl.substring(0, 100),
      });
      return removeLeadingSlash(value);
    }
  };

  const tryFromUrl = (): string | null => {
    try {
      const url = new URL(normalized);
      const markerVariants = ['/object/public/offers/', '/object/sign/offers/', '/object/offers/'];

      for (const marker of markerVariants) {
        const markerIndex = url.pathname.indexOf(marker);
        if (markerIndex !== -1) {
          const extracted = url.pathname.slice(markerIndex + marker.length);
          if (extracted) return decodeAndNormalize(extracted);
        }
      }

      const segments = url.pathname.split('/');
      const offersIndex = segments.indexOf('offers');
      if (offersIndex !== -1 && offersIndex < segments.length - 1) {
        return decodeAndNormalize(segments.slice(offersIndex + 1).join('/'));
      }
    } catch (error) {
      if (normalized.includes('://')) {
        logger.warn('Failed to parse offer PDF storage path', error, {
          pdfUrl: pdfUrl.substring(0, 100),
        });
      }
    }
    return null;
  };

  const tryFromEncodedMarker = (): string | null => {
    const encodedMarker = 'offers%2F';
    const markerIndex = normalized.indexOf(encodedMarker);
    if (markerIndex !== -1) {
      return decodeAndNormalize(normalized.slice(markerIndex + encodedMarker.length));
    }
    return null;
  };

  const tryFromPlainPath = (): string | null => {
    if (!normalized.includes('://')) {
      const cleaned = normalized.replace(/^public\/?offers\/?/, '');
      return removeLeadingSlash(cleaned);
    }
    return null;
  };

  return tryFromUrl() ?? tryFromEncodedMarker() ?? tryFromPlainPath();
}
