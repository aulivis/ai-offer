'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabaseClient';

const SupabaseContext = createContext<SupabaseClient | null>(null);

type SupabaseProviderProps = {
  children: ReactNode;
  client?: SupabaseClient;
};

export function SupabaseProvider({ children, client }: SupabaseProviderProps) {
  const instance = client ?? getSupabaseClient();

  return <SupabaseContext.Provider value={instance}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
}
