'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabaseClient';
import { clientLogger } from '@/lib/clientLogger';

const SupabaseContext = createContext<SupabaseClient | null>(null);

type SupabaseProviderProps = {
  children: ReactNode;
  client?: SupabaseClient | null;
};

export function SupabaseProvider({ children, client }: SupabaseProviderProps) {
  const instance =
    client ??
    (() => {
      try {
        return getSupabaseClient();
      } catch (error) {
        clientLogger.error('Failed to get Supabase client', error);
        // Return null - components should handle this gracefully
        return null;
      }
    })();

  return <SupabaseContext.Provider value={instance}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
}
