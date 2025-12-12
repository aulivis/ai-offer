'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabaseClient';
import { clientLogger } from '@/lib/clientLogger';

const SupabaseContext = createContext<SupabaseClient | null>(null);

type SupabaseProviderProps = {
  children: ReactNode;
  client?: SupabaseClient | null;
};

export function SupabaseProvider({ children, client }: SupabaseProviderProps) {
  const instance = useMemo(() => {
    if (client) {
      return client;
    }
    try {
      return getSupabaseClient();
    } catch (error) {
      clientLogger.error('Failed to get Supabase client', error);
      // Return null - AppProviders should have caught this and shown error UI
      // But if we get here, return null and let useSupabase throw a helpful error
      return null;
    }
  }, [client]);

  // If instance is null, we'll let useSupabase throw a helpful error when it's called
  // This prevents the component from crashing during render
  return <SupabaseContext.Provider value={instance}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient {
  const context = useContext(SupabaseContext);

  if (context === null) {
    // This can happen if:
    // 1. Context is used outside provider (default value)
    // 2. Supabase client failed to initialize
    throw new Error(
      'Supabase client is not available. This may be due to missing environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) or a configuration error. Please check your environment configuration.',
    );
  }

  return context;
}

/**
 * Safe accessor that returns the Supabase client when available.
 * Unlike useSupabase, this variant will not throw if the client is missing.
 */
export function useOptionalSupabase(): SupabaseClient | null {
  return useContext(SupabaseContext);
}
