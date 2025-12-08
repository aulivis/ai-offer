import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SupabaseProvider, useSupabase } from '../SupabaseProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';

vi.mock('@/lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

const getSupabaseClientMock = vi.mocked(getSupabaseClient);

describe('SupabaseProvider', () => {
  beforeEach(() => {
    getSupabaseClientMock.mockReset();
  });

  it('returns the provided client when one is supplied', () => {
    // Type assertion is safe because we're creating a minimal mock
    // that only needs the properties used in the test
    const sharedClient = { auth: {} } as SupabaseClient;

    const { result } = renderHook(() => useSupabase(), {
      wrapper: ({ children }) => (
        <SupabaseProvider client={sharedClient}>{children}</SupabaseProvider>
      ),
    });

    expect(result.current).toBe(sharedClient);
    expect(getSupabaseClientMock).not.toHaveBeenCalled();
  });

  it('creates a client when none is provided', () => {
    // Type assertion is safe because we're creating a minimal mock
    // that only needs the properties used in the test
    const createdClient = { auth: {} } as SupabaseClient;
    getSupabaseClientMock.mockReturnValue(createdClient);

    const { result } = renderHook(() => useSupabase(), {
      wrapper: ({ children }) => <SupabaseProvider>{children}</SupabaseProvider>,
    });

    expect(result.current).toBe(createdClient);
    expect(getSupabaseClientMock).toHaveBeenCalledTimes(1);
  });

  it('throws an error when the hook is used outside the provider', () => {
    expect(() => renderHook(() => useSupabase())).toThrowError(
      new Error('useSupabase must be used within a SupabaseProvider'),
    );
  });
});
