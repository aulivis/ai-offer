'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useSupabase } from '@/components/SupabaseProvider';
import { useAuthSession } from '@/hooks/useAuthSession';
import { deriveBrandMonogram, normalizeBrandHex, getBrandLogoUrl } from '@/lib/branding';
import { createClientLogger } from '@/lib/clientLogger';

const FALLBACK_COLORS = {
  primary: '#1c274c',
  secondary: '#e2e8f0',
  text: '#0f172a',
  muted: '#334155',
  border: '#475569',
  bg: '#ffffff',
  primaryContrast: '#ffffff',
} as const;

function contrastFromHex(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

type BrandingFetchState = {
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  companyName: string | null;
  isLoading: boolean;
};

const DEFAULT_FETCH_STATE: BrandingFetchState = {
  primaryColor: null,
  secondaryColor: null,
  logoUrl: null,
  companyName: null,
  isLoading: false,
};

type BrandingContextValue = {
  companyName: string | null;
  logoUrl: string | null;
  monogram: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    muted: string;
    border: string;
    bg: string;
    primaryContrast: string;
  };
  hasBranding: boolean;
  isLoading: boolean;
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

type BrandingProviderProps = {
  children: ReactNode;
};

export function BrandingProvider({ children }: BrandingProviderProps) {
  const supabase = useSupabase();
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const logger = useMemo(
    () => createClientLogger({ userId, component: 'BrandingProvider' }),
    [userId],
  );
  const [state, setState] = useState<BrandingFetchState>(DEFAULT_FETCH_STATE);

  useEffect(() => {
    if (status !== 'authenticated' || !userId) {
      // Show default Vyndi logo when not authenticated
      setState({
        ...DEFAULT_FETCH_STATE,
        logoUrl: '/vyndi-logo.png',
        isLoading: false,
      });
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, isLoading: true }));

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'company_name, brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary',
          )
          .eq('id', userId)
          .maybeSingle();

        if (!active) {
          return;
        }

        if (error) {
          logger.error('Failed to load branding settings', error);
          setState(DEFAULT_FETCH_STATE);
          return;
        }

        const companyName =
          typeof data?.company_name === 'string' ? data.company_name.trim() || null : null;
        const primaryColor = normalizeBrandHex(data?.brand_color_primary ?? null);
        const secondaryColor = normalizeBrandHex(data?.brand_color_secondary ?? null);

        // Generate signed URL on-demand from path (preferred) or use legacy URL
        let logoUrl: string | null = null;
        try {
          logoUrl = await getBrandLogoUrl(
            supabase,
            data?.brand_logo_path ?? null,
            data?.brand_logo_url ?? null,
          );
        } catch (_error) {
          // Silently handle storage errors (e.g., bucket doesn't exist, file not found)
          // This prevents errors on landing page when user is not authenticated
          // Only log in development to reduce noise
          if (process.env.NODE_ENV !== 'production') {
            logger.debug('Could not load brand logo URL', undefined, {
              logoPath: data?.brand_logo_path,
              logoUrl: data?.brand_logo_url,
            });
          }
          logoUrl = null;
        }

        // Fallback to default Vyndi logo if no user logo is available
        if (!logoUrl) {
          logoUrl = '/vyndi-logo.png';
        }

        if (!active) {
          return;
        }

        setState({
          companyName,
          primaryColor,
          secondaryColor,
          logoUrl,
          isLoading: false,
        });
      } catch (error) {
        if (!active) {
          return;
        }
        logger.error('Failed to load branding settings', error);
        setState(DEFAULT_FETCH_STATE);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, supabase, userId]);

  const colors = useMemo(() => {
    const primary = state.primaryColor ?? FALLBACK_COLORS.primary;
    return {
      primary,
      secondary: state.secondaryColor ?? FALLBACK_COLORS.secondary,
      text: FALLBACK_COLORS.text,
      muted: FALLBACK_COLORS.muted,
      border: FALLBACK_COLORS.border,
      bg: FALLBACK_COLORS.bg,
      primaryContrast: contrastFromHex(primary),
    } as const;
  }, [state.primaryColor, state.secondaryColor]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const entries: Array<[string, string]> = [
      ['--brand-primary', colors.primary],
      ['--brand-secondary', colors.secondary],
      ['--brand-text', colors.text],
      ['--brand-muted', colors.muted],
      ['--brand-border', colors.border],
      ['--brand-bg', colors.bg],
      ['--brand-primary-contrast', colors.primaryContrast],
      ['--text', colors.text],
      ['--muted', colors.muted],
      ['--border', colors.border],
      ['--bg', colors.bg],
    ];

    entries.forEach(([variable, value]) => {
      root.style.setProperty(variable, value);
    });

    return () => {
      entries.forEach(([variable]) => {
        root.style.removeProperty(variable);
      });
    };
  }, [colors]);

  const value: BrandingContextValue = useMemo(() => {
    const companyName = state.companyName;
    const logoUrl = state.logoUrl;
    const monogram = deriveBrandMonogram(companyName);
    const hasBranding = Boolean(state.primaryColor || state.secondaryColor || logoUrl);

    return {
      companyName,
      logoUrl,
      monogram,
      colors,
      hasBranding,
      isLoading: state.isLoading,
    };
  }, [
    colors,
    state.companyName,
    state.isLoading,
    state.logoUrl,
    state.primaryColor,
    state.secondaryColor,
  ]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
