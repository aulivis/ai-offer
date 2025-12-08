/**
 * Test utilities for creating properly typed mocks.
 * These utilities replace unsafe `as any` type assertions with proper type definitions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Mock } from 'vitest';

/**
 * Creates a properly typed mock Supabase client for testing.
 * Only includes the methods that are actually used in tests.
 */
export type MockSupabaseClient = {
  rpc: Mock;
  from: Mock;
  // Add other Supabase methods as needed for tests
};

/**
 * Creates a mock Supabase client with proper typing.
 * This is safer than using `as any` because it explicitly defines
 * which methods are available on the mock.
 */
export function createMockSupabaseClient(
  overrides?: Partial<MockSupabaseClient>,
): MockSupabaseClient {
  const defaultMock: MockSupabaseClient = {
    rpc: () => ({ data: null, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
      }),
      update: () => ({
        eq: () => ({
          select: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    ...overrides,
  };

  return defaultMock;
}

/**
 * Type helper to use mock client with SupabaseClient type.
 * Use this when you need to pass the mock to functions expecting SupabaseClient.
 * The mock will be type-compatible as long as only the mocked methods are used.
 */
export type MockSupabaseClientForTests = Pick<SupabaseClient, 'rpc' | 'from'>;

/**
 * Creates a mock client that can be used where SupabaseClient is expected.
 * Note: This still requires the mock to implement the methods being used.
 */
export function createTypedMockSupabaseClient(
  mocks: MockSupabaseClient,
): MockSupabaseClientForTests {
  return {
    rpc: mocks.rpc as unknown as SupabaseClient['rpc'],
    from: mocks.from as unknown as SupabaseClient['from'],
  };
}

/**
 * Rate limiting client type for tests
 */
export type RateLimitClient = {
  rpc: Mock;
  from: Mock;
};

/**
 * Creates a mock rate limit client.
 */
export function createMockRateLimitClient(overrides?: Partial<RateLimitClient>): RateLimitClient {
  return {
    rpc: () => ({ data: null, error: null }),
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    ...overrides,
  };
}


