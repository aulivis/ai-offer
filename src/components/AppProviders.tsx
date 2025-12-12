'use client';

import { useMemo, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

import { SupabaseProvider } from '@/components/SupabaseProvider';
import { PlanUpgradeDialogProvider } from '@/components/PlanUpgradeDialogProvider';
import { BrandingProvider } from '@/components/BrandingProvider';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { missingClientEnvKeys } from '@/env.client';
import { Card } from '@/components/ui/Card';

interface AppProvidersProps {
  children: ReactNode;
}

import { QueryProvider } from '@/providers/QueryProvider';

export function AppProviders({ children }: AppProvidersProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);

  if (missingClientEnvKeys.length > 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <Card className="w-full space-y-4 p-6 text-sm text-fg">
          <p className="font-semibold">Missing required client environment variables.</p>
          <p className="text-fg-muted">
            The following keys must be configured for the offer wizard to load correctly:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-fg">
            {missingClientEnvKeys.map((key) => (
              <li key={key} className="font-mono text-xs">
                {key}
              </li>
            ))}
          </ul>
          <p className="text-fg-muted">
            Please update your deployment environment (for example in Vercel project settings) and
            reload the page.
          </p>
        </Card>
      </div>
    );
  }

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
