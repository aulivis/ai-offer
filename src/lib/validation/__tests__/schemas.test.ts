import { describe, expect, it } from 'vitest';
import {
  uuidSchema,
  dateSchema,
  optionalDateSchema,
  deviceIdSchema,
  optionalDeviceIdSchema,
  urlSchema,
  optionalUrlSchema,
  nonNegativeIntegerSchema,
  optionalNonNegativeIntegerSchema,
  trimmedStringSchema,
  optionalTrimmedStringSchema,
  usageQuerySchema,
  oauthRedirectSchema,
} from '../schemas';

describe('uuidSchema', () => {
  it('validates valid UUIDs', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(uuidSchema.safeParse('00000000-0000-0000-0000-000000000000').success).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716').success).toBe(false);
    expect(uuidSchema.safeParse('').success).toBe(false);
  });
});

describe('dateSchema', () => {
  it('validates valid ISO dates', () => {
    expect(dateSchema.safeParse('2024-07-05').success).toBe(true);
    expect(dateSchema.safeParse('2024-01-01').success).toBe(true);
    expect(dateSchema.safeParse('2024-12-31').success).toBe(true);
  });

  it('rejects invalid dates', () => {
    expect(dateSchema.safeParse('2024/07/05').success).toBe(false);
    expect(dateSchema.safeParse('07-05-2024').success).toBe(false);
    expect(dateSchema.safeParse('2024-7-5').success).toBe(false);
    expect(dateSchema.safeParse('invalid').success).toBe(false);
    expect(dateSchema.safeParse('').success).toBe(false);
  });

  it('trims whitespace', () => {
    expect(dateSchema.safeParse('  2024-07-05  ').success).toBe(true);
  });
});

describe('optionalDateSchema', () => {
  it('accepts valid dates', () => {
    expect(optionalDateSchema.safeParse('2024-07-05').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(optionalDateSchema.safeParse(null).success).toBe(true);
    expect(optionalDateSchema.safeParse(undefined).success).toBe(true);
    expect(optionalDateSchema.safeParse('').success).toBe(true);
  });

  it('rejects invalid dates', () => {
    expect(optionalDateSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('deviceIdSchema', () => {
  it('validates valid device IDs', () => {
    expect(deviceIdSchema.safeParse('device-123').success).toBe(true);
    expect(deviceIdSchema.safeParse('device_123').success).toBe(true);
    expect(deviceIdSchema.safeParse('device123').success).toBe(true);
    expect(deviceIdSchema.safeParse('a'.repeat(100)).success).toBe(true);
  });

  it('rejects invalid device IDs', () => {
    expect(deviceIdSchema.safeParse('').success).toBe(false);
    expect(deviceIdSchema.safeParse('a'.repeat(101)).success).toBe(false);
    expect(deviceIdSchema.safeParse('device@123').success).toBe(false);
    expect(deviceIdSchema.safeParse('device 123').success).toBe(false);
  });
});

describe('optionalDeviceIdSchema', () => {
  it('accepts valid device IDs', () => {
    expect(optionalDeviceIdSchema.safeParse('device-123').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(optionalDeviceIdSchema.safeParse(null).success).toBe(true);
    expect(optionalDeviceIdSchema.safeParse(undefined).success).toBe(true);
    expect(optionalDeviceIdSchema.safeParse('').success).toBe(true);
  });
});

describe('urlSchema', () => {
  it('validates valid URLs', () => {
    expect(urlSchema().safeParse('https://example.com').success).toBe(true);
    expect(urlSchema().safeParse('http://example.com/path').success).toBe(true);
    expect(urlSchema().safeParse('https://example.com:8080/path?query=1').success).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(urlSchema().safeParse('not-a-url').success).toBe(false);
    expect(urlSchema().safeParse('example.com').success).toBe(false);
    expect(urlSchema().safeParse('').success).toBe(false);
  });

  it('trims whitespace', () => {
    expect(urlSchema().safeParse('  https://example.com  ').success).toBe(true);
  });
});

describe('optionalUrlSchema', () => {
  it('accepts valid URLs', () => {
    expect(optionalUrlSchema().safeParse('https://example.com').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(optionalUrlSchema().safeParse(null).success).toBe(true);
    expect(optionalUrlSchema().safeParse(undefined).success).toBe(true);
    expect(optionalUrlSchema().safeParse('').success).toBe(true);
  });
});

describe('nonNegativeIntegerSchema', () => {
  it('validates non-negative integers', () => {
    expect(nonNegativeIntegerSchema.safeParse(0).success).toBe(true);
    expect(nonNegativeIntegerSchema.safeParse(1).success).toBe(true);
    expect(nonNegativeIntegerSchema.safeParse(100).success).toBe(true);
  });

  it('rejects negative numbers', () => {
    expect(nonNegativeIntegerSchema.safeParse(-1).success).toBe(false);
  });

  it('rejects non-integers', () => {
    expect(nonNegativeIntegerSchema.safeParse(1.5).success).toBe(false);
  });
});

describe('optionalNonNegativeIntegerSchema', () => {
  it('accepts valid integers', () => {
    expect(optionalNonNegativeIntegerSchema.safeParse(5).success).toBe(true);
    expect(optionalNonNegativeIntegerSchema.safeParse('5').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(optionalNonNegativeIntegerSchema.safeParse(null).success).toBe(true);
    expect(optionalNonNegativeIntegerSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(optionalNonNegativeIntegerSchema.safeParse(-1).success).toBe(false);
    expect(optionalNonNegativeIntegerSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('trimmedStringSchema', () => {
  it('validates strings with minimum length', () => {
    expect(trimmedStringSchema(1).safeParse('a').success).toBe(true);
    expect(trimmedStringSchema(3).safeParse('abc').success).toBe(true);
  });

  it('rejects strings below minimum length', () => {
    expect(trimmedStringSchema(3).safeParse('ab').success).toBe(false);
    expect(trimmedStringSchema(1).safeParse('').success).toBe(false);
  });

  it('respects maximum length', () => {
    expect(trimmedStringSchema(1, 5).safeParse('abcde').success).toBe(true);
    expect(trimmedStringSchema(1, 5).safeParse('abcdef').success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = trimmedStringSchema(1).safeParse('  hello  ');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('hello');
    }
  });
});

describe('optionalTrimmedStringSchema', () => {
  it('accepts valid strings', () => {
    expect(optionalTrimmedStringSchema().safeParse('hello').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(optionalTrimmedStringSchema().safeParse(null).success).toBe(true);
    expect(optionalTrimmedStringSchema().safeParse(undefined).success).toBe(true);
    expect(optionalTrimmedStringSchema().safeParse('').success).toBe(true);
  });
});

describe('usageQuerySchema', () => {
  it('validates valid usage query parameters', () => {
    expect(
      usageQuerySchema.safeParse({
        period_start: '2024-07-01',
        device_id: 'device-123',
      }).success,
    ).toBe(true);
  });

  it('accepts partial parameters', () => {
    expect(usageQuerySchema.safeParse({ period_start: '2024-07-01' }).success).toBe(true);
    expect(usageQuerySchema.safeParse({ device_id: 'device-123' }).success).toBe(true);
    expect(usageQuerySchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid dates', () => {
    expect(
      usageQuerySchema.safeParse({
        period_start: 'invalid-date',
        device_id: 'device-123',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid device IDs', () => {
    expect(
      usageQuerySchema.safeParse({
        period_start: '2024-07-01',
        device_id: 'device@123',
      }).success,
    ).toBe(false);
  });
});

describe('oauthRedirectSchema', () => {
  it('validates valid redirect URLs', () => {
    expect(oauthRedirectSchema.safeParse('https://example.com/callback').success).toBe(true);
  });

  it('accepts null and undefined', () => {
    expect(oauthRedirectSchema.safeParse(null).success).toBe(true);
    expect(oauthRedirectSchema.safeParse(undefined).success).toBe(true);
    expect(oauthRedirectSchema.safeParse('').success).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(oauthRedirectSchema.safeParse('not-a-url').success).toBe(false);
  });
});













