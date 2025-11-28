'use client';

import { useMemo, type ReactNode } from 'react';

import { SupabaseProvider } from '@/components/SupabaseProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { PlanUpgradeDialogProvider } from '@/components/PlanUpgradeDialogProvider';
import { BrandingProvider } from '@/components/BrandingProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface AppProvidersProps {
  children: ReactNode;
}

import { QueryProvider } from '@/providers/QueryProvider';

export function AppProviders({ children }: AppProvidersProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  return (
    <QueryProvider>
      <SupabaseProvider client={supabase}>
        <ToastProvider>
          <PlanUpgradeDialogProvider>
            <BrandingProvider>{children}</BrandingProvider>
          </PlanUpgradeDialogProvider>
        </ToastProvider>
      </SupabaseProvider>
    </QueryProvider>
  );
}
