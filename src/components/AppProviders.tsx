'use client';

import { useMemo, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import { SupabaseProvider } from '@/components/SupabaseProvider';
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
        <PlanUpgradeDialogProvider>
          <BrandingProvider>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 6000,
                style: {
                  background: 'var(--color-bg)',
                  color: 'var(--color-fg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '1rem',
                  padding: '1rem',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--color-success)',
                    secondary: 'var(--color-bg)',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--color-danger)',
                    secondary: 'var(--color-bg)',
                  },
                },
              }}
            />
          </BrandingProvider>
        </PlanUpgradeDialogProvider>
      </SupabaseProvider>
    </QueryProvider>
  );
}
