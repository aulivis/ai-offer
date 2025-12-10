'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createClientLogger } from '@/lib/clientLogger';
import { t } from '@/copy';
import {
  DEFAULT_OFFER_TEMPLATE_ID,
  enforceTemplateForPlan,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import { normalizeBrandHex } from '@/lib/branding';
import { resolveEffectivePlan } from '@/lib/subscription';
import { resolveProfileMutationAction } from '@/app/settings/profilePersistence';
import type { Profile } from '@/components/settings/types';

type SupabaseErrorLike = {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function createSupabaseError(error: SupabaseErrorLike | null | undefined): Error {
  if (error) {
    const parts = [error.message, error.details, error.hint]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter((part) => part.length > 0);
    if (parts.length > 0) {
      return new Error(parts.join(' '));
    }
  }
  return new Error(t('errors.settings.saveUnknown'));
}

export function useProfileSettings() {
  const supabase = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () =>
      createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useProfileSettings' }),
    [user?.id],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    offer_template: DEFAULT_OFFER_TEMPLATE_ID,
  });
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    try {
      const { data: prof, error: loadError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (loadError) {
        setProfileLoadError(loadError);
        showToast({
          title: t('toasts.settings.profileLoadFailed.title'),
          description: loadError.message || t('toasts.settings.profileLoadFailed.description'),
          variant: 'error',
        });
        setLoading(false);
        return;
      }

      setProfileLoadError(null);
      const normalizedPlan = resolveEffectivePlan(prof?.plan ?? null);
      setHasProfile(Boolean(prof));
      setPlan(normalizedPlan);
      const templateId = enforceTemplateForPlan(
        typeof prof?.offer_template === 'string' ? prof.offer_template : null,
        normalizedPlan,
      );
      setProfile({
        company_name: prof?.company_name ?? '',
        company_address: prof?.company_address ?? '',
        company_tax_id: prof?.company_tax_id ?? '',
        company_phone: prof?.company_phone ?? '',
        company_email: prof?.company_email ?? user.email ?? '',
        brand_logo_url: prof?.brand_logo_url ?? null,
        brand_logo_path: prof?.brand_logo_path ?? null,
        brand_color_primary: prof?.brand_color_primary ?? '#1c274c',
        brand_color_secondary: prof?.brand_color_secondary ?? '#e2e8f0',
        offer_template: templateId,
        enable_reference_photos: prof?.enable_reference_photos ?? false,
        enable_testimonials: true, // Always enabled
        default_activity_id: prof?.default_activity_id ?? null,
      });

      setEmail(user.email ?? null);
      setLoading(false);
    } catch (error) {
      if (!active) {
        return;
      }
      logger.error('Failed to load profile', error);
      showToast({
        title: t('toasts.settings.profileLoadFailed.title'),
        description:
          error instanceof Error
            ? error.message
            : t('toasts.settings.profileLoadFailed.description'),
        variant: 'error',
      });
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [authStatus, user, supabase, showToast, logger]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(
    async (scope: 'all' | 'branding') => {
      try {
        setSaving(true);
        if (!user) return;

        const primary = normalizeBrandHex(profile.brand_color_primary);
        const secondary = normalizeBrandHex(profile.brand_color_secondary);
        const templateId = enforceTemplateForPlan(profile.offer_template ?? null, plan);

        const mutationAction = resolveProfileMutationAction({
          hasProfile,
          loadError: profileLoadError,
        });

        let profileData:
          | {
              brand_logo_path: string | null;
              brand_logo_url: string | null;
              brand_color_primary: string | null;
              brand_color_secondary: string | null;
              offer_template: string | null;
            }
          | null
          | undefined;

        if (mutationAction === 'update') {
          const response = await supabase
            .from('profiles')
            .update(
              scope === 'branding'
                ? {
                    brand_logo_path: profile.brand_logo_path ?? null,
                    brand_logo_url: profile.brand_logo_url ?? null,
                    brand_color_primary: primary,
                    brand_color_secondary: secondary,
                    offer_template: templateId,
                  }
                : {
                    company_name: profile.company_name ?? '',
                    company_address: profile.company_address ?? '',
                    company_tax_id: profile.company_tax_id ?? '',
                    company_phone: profile.company_phone ?? '',
                    company_email: profile.company_email ?? '',
                    brand_logo_path: profile.brand_logo_path ?? null,
                    brand_logo_url: profile.brand_logo_url ?? null,
                    brand_color_primary: primary,
                    brand_color_secondary: secondary,
                    offer_template: templateId,
                    enable_reference_photos: profile.enable_reference_photos ?? false,
                    enable_testimonials: true, // Always enabled
                    default_activity_id: profile.default_activity_id ?? null,
                  },
            )
            .eq('id', user.id)
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
            .maybeSingle();

          if (response.error) {
            throw createSupabaseError(response.error);
          }
          profileData = response.data;
        } else {
          const response = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                company_name: profile.company_name ?? '',
                company_address: profile.company_address ?? '',
                company_tax_id: profile.company_tax_id ?? '',
                company_phone: profile.company_phone ?? '',
                company_email: profile.company_email?.trim() || email || '',
                plan,
                brand_logo_path: profile.brand_logo_path ?? null,
                brand_logo_url: profile.brand_logo_url ?? null,
                brand_color_primary: primary,
                brand_color_secondary: secondary,
                offer_template: templateId,
                enable_testimonials: true, // Always enabled
                ...(scope === 'all'
                  ? { enable_reference_photos: profile.enable_reference_photos ?? false }
                  : {}),
              },
              { onConflict: 'id' },
            )
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
            .maybeSingle();

          if (response.error) {
            throw createSupabaseError(response.error);
          }
          profileData = response.data;
        }

        setHasProfile(true);
        setProfileLoadError(null);
        setProfile((prev) => ({
          ...prev,
          brand_logo_path: profileData?.brand_logo_path ?? prev.brand_logo_path ?? null,
          brand_logo_url: profileData?.brand_logo_url ?? prev.brand_logo_url ?? null,
          brand_color_primary: profileData?.brand_color_primary ?? primary ?? null,
          brand_color_secondary: profileData?.brand_color_secondary ?? secondary ?? null,
          offer_template: profileData?.offer_template ?? templateId,
          ...(scope === 'all'
            ? {
                enable_reference_photos: profile.enable_reference_photos ?? false,
                enable_testimonials: true,
                default_activity_id: profile.default_activity_id ?? null,
              }
            : {}),
        }));

        showToast({
          title: t('toasts.settings.saveSuccess'),
          description: t('toasts.settings.saveSuccess'),
          variant: 'success',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : t('errors.settings.saveUnknown');
        showToast({
          title: t('errors.settings.saveFailed', { message }),
          description: message,
          variant: 'error',
        });
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user, plan, profile, hasProfile, profileLoadError, email, supabase, showToast],
  );

  return {
    loading,
    saving,
    email,
    profile,
    setProfile,
    plan,
    hasProfile,
    profileLoadError,
    saveProfile,
    reloadProfile: loadProfile,
  };
}
