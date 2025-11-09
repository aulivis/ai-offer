import { describe, expect, it } from 'vitest';

import { isAbsoluteUrl, toAbsoluteUrl, validateImageUrl, validateImageAssets } from '../urlValidation';

describe('urlValidation', () => {
  describe('isAbsoluteUrl', () => {
    it('should return true for https URLs', () => {
      expect(isAbsoluteUrl('https://example.com/image.png')).toBe(true);
      expect(isAbsoluteUrl('https://cdn.example.com/logo.svg')).toBe(true);
    });

    it('should return true for http URLs', () => {
      expect(isAbsoluteUrl('http://example.com/image.png')).toBe(true);
    });

    it('should return false for relative URLs', () => {
      expect(isAbsoluteUrl('/images/logo.png')).toBe(false);
      expect(isAbsoluteUrl('images/logo.png')).toBe(false);
      expect(isAbsoluteUrl('../images/logo.png')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isAbsoluteUrl('not-a-url')).toBe(false);
      expect(isAbsoluteUrl('')).toBe(false);
      expect(isAbsoluteUrl('   ')).toBe(false);
    });

    it('should return false for non-HTTP protocols', () => {
      expect(isAbsoluteUrl('file:///path/to/image.png')).toBe(false);
      expect(isAbsoluteUrl('data:image/png;base64,...')).toBe(false);
    });
  });

  describe('toAbsoluteUrl', () => {
    it('should return absolute URLs as-is', () => {
      expect(toAbsoluteUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
    });

    it('should convert relative URLs to absolute', () => {
      expect(toAbsoluteUrl('/images/logo.png', 'https://example.com')).toBe(
        'https://example.com/images/logo.png',
      );
      expect(toAbsoluteUrl('images/logo.png', 'https://example.com')).toBe(
        'https://example.com/images/logo.png',
      );
    });

    it('should return null for invalid URLs', () => {
      expect(toAbsoluteUrl('not-a-url')).toBe(null);
      expect(toAbsoluteUrl('', 'https://example.com')).toBe(null);
    });
  });

  describe('validateImageUrl', () => {
    it('should return absolute URLs as-is', () => {
      expect(validateImageUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
    });

    it('should return null for relative URLs', () => {
      expect(validateImageUrl('/images/logo.png')).toBe(null);
      expect(validateImageUrl('images/logo.png')).toBe(null);
    });

    it('should return null for invalid input', () => {
      expect(validateImageUrl(null)).toBe(null);
      expect(validateImageUrl(undefined)).toBe(null);
      expect(validateImageUrl('')).toBe(null);
    });
  });

  describe('validateImageAssets', () => {
    it('should filter out invalid images', () => {
      const images = [
        { src: 'https://example.com/image1.png', alt: 'Image 1', key: 'img1' },
        { src: '/relative/image.png', alt: 'Image 2', key: 'img2' },
        { src: 'https://example.com/image3.png', alt: 'Image 3', key: 'img3' },
      ];

      const validated = validateImageAssets(images);
      expect(validated).toHaveLength(2);
      expect(validated[0].src).toBe('https://example.com/image1.png');
      expect(validated[1].src).toBe('https://example.com/image3.png');
    });

    it('should handle missing alt and key fields', () => {
      const images = [{ src: 'https://example.com/image.png' }];

      const validated = validateImageAssets(images);
      expect(validated).toHaveLength(1);
      expect(validated[0].alt).toBe('');
      expect(validated[0].key).toBe('');
    });

    it('should return empty array for invalid input', () => {
      expect(validateImageAssets(null)).toEqual([]);
      expect(validateImageAssets(undefined)).toEqual([]);
      expect(validateImageAssets([])).toEqual([]);
    });
  });
});








