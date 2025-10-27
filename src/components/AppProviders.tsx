'use client';

import { useMemo, type ReactNode } from 'react';

import { SupabaseProvider } from '@/components/SupabaseProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  return (
    <SupabaseProvider client={supabase}>
      <ToastProvider>{children}</ToastProvider>
    </SupabaseProvider>
  );
}
