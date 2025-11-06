'use client';

import { t } from '@/copy';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  DEFAULT_OFFER_TEMPLATE_ID,
  enforceTemplateForPlan,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth, ApiError } from '@/lib/api';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import { normalizeBrandHex } from '@/lib/branding';
import { resolveEffectivePlan } from '@/lib/subscription';
import { resolveProfileMutationAction } from './profilePersistence';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import {
  KeyIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
  CubeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { TemplateId } from '@/app/pdf/templates/types';
import { SettingsAuthSection } from '@/components/settings/SettingsAuthSection';
import { SettingsCompanySection } from '@/components/settings/SettingsCompanySection';
import { SettingsBrandingSection } from '@/components/settings/SettingsBrandingSection';
import { SettingsTemplatesSection } from '@/components/settings/SettingsTemplatesSection';
import { SettingsActivitiesSection } from '@/components/settings/SettingsActivitiesSection';
import { SectionNav } from '@/components/settings/SectionNav';
import type { Profile, ActivityRow } from '@/components/settings/types';
import { validatePhoneHU, validateTaxHU, validateAddress } from '@/components/settings/types';

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


export default function SettingsPage() {
  const supabase = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({
    industries: [],
    offer_template: DEFAULT_OFFER_TEMPLATE_ID,
  });
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<Error | null>(null);

  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [newAct, setNewAct] = useState({
    name: '',
    unit: 'db',
    price: 0,
    vat: 27,
    industries: [] as string[],
  });
  const [actSaving, setActSaving] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const logoUploadAbortControllerRef = useRef<AbortController | null>(null);

  const googleLinked =
    user?.identities?.some((identity) => identity.provider === 'google') ?? false;

  const errors = useMemo(() => {
    const general: Record<string, string> = {};
    const branding: Record<string, string> = {};

    if (profile.company_phone && !validatePhoneHU(profile.company_phone)) {
      general.phone = t('settings.validation.phone');
    }
    if (profile.company_tax_id && !validateTaxHU(profile.company_tax_id)) {
      general.tax = t('settings.validation.tax');
    }
    if (profile.company_address && !validateAddress(profile.company_address)) {
      general.address = t('settings.validation.address');
    }

    const brandPrimary =
      typeof profile.brand_color_primary === 'string' ? profile.brand_color_primary.trim() : '';
    if (brandPrimary && !normalizeBrandHex(brandPrimary)) {
      branding.brandPrimary = t('settings.validation.hexColor');
    }

    const brandSecondary =
      typeof profile.brand_color_secondary === 'string' ? profile.brand_color_secondary.trim() : '';
    if (brandSecondary && !normalizeBrandHex(brandSecondary)) {
      branding.brandSecondary = t('settings.validation.hexColor');
    }

    return { general, branding };
  }, [profile]);

  useEffect(() => {
    if (!searchParams) return;

    const linkStatus = searchParams.get('link');
    if (!linkStatus) return;

    if (linkStatus === 'google_success') {
      showToast({
        title: t('toasts.googleLink.success.title'),
        description: t('toasts.googleLink.success.description'),
        variant: 'success',
      });
    } else if (linkStatus === 'google_error') {
      showToast({
        title: t('toasts.googleLink.error.title'),
        description: t('toasts.googleLink.error.description'),
        variant: 'error',
      });
    }

    router.replace('/settings', { scroll: false });
  }, [router, searchParams, showToast]);

  const [activeSection, setActiveSection] = useState<string>('auth');

  const sections = [
    {
      id: 'auth',
      label: t('settings.authMethods.title'),
      icon: <KeyIcon className="h-5 w-5" />,
      href: '#auth',
    },
    {
      id: 'company',
      label: t('settings.company.title'),
      icon: <BuildingOfficeIcon className="h-5 w-5" />,
      href: '#company',
    },
    {
      id: 'branding',
      label: t('settings.branding.title'),
      icon: <PaintBrushIcon className="h-5 w-5" />,
      href: '#branding',
    },
    {
      id: 'templates',
      label: t('settings.templates.title'),
      icon: <DocumentTextIcon className="h-5 w-5" />,
      href: '#templates',
    },
    {
      id: 'activities',
      label: t('settings.activities.title'),
      icon: <CubeIcon className="h-5 w-5" />,
      href: '#activities',
    },
  ];

  useEffect(() => {
    if (loading) return;

    const handleScroll = () => {
      const sectionIds = ['auth', 'company', 'branding', 'templates', 'activities'];
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(sectionIds[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  const hasGeneralErrors = Object.keys(errors.general).length > 0;
  const hasBrandingErrors = Object.keys(errors.branding).length > 0;
  const hasErrors = hasGeneralErrors || hasBrandingErrors;

  const primaryPreview = normalizeBrandHex(profile.brand_color_primary) ?? '#1c274c';
  const secondaryPreview = normalizeBrandHex(profile.brand_color_secondary) ?? '#e2e8f0';
  const canUploadBrandLogo = plan !== 'free';
  // Use the template ID directly from profile for display (enforcement happens on save)
  const selectedTemplateId = (profile.offer_template as TemplateId | null) ?? DEFAULT_OFFER_TEMPLATE_ID;

  const handleTemplateSelect = useCallback(
    async (templateId: TemplateId) => {
      // Update profile state immediately for UI feedback
      setProfile((prev) => ({ ...prev, offer_template: templateId }));
      
      // Save directly with the selected template ID
      try {
        setSaving(true);
        if (!user) return;
        
        const primary = normalizeBrandHex(profile.brand_color_primary);
        const secondary = normalizeBrandHex(profile.brand_color_secondary);
        // Use the selected templateId directly, but still enforce plan restrictions
        const templateIdToSave = enforceTemplateForPlan(templateId, plan);
        
        const mutationAction = resolveProfileMutationAction({
          hasProfile,
          loadError: profileLoadError,
        });
        
        let brandingData:
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
            .update({
              brand_logo_path: profile.brand_logo_path ?? null,
              brand_logo_url: profile.brand_logo_url ?? null,
              brand_color_primary: primary,
              brand_color_secondary: secondary,
              offer_template: templateIdToSave,
            })
            .eq('id', user.id)
            .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
            .maybeSingle();
          if (response.error) {
            throw createSupabaseError(response.error);
          }
          brandingData = response.data;
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
                industries: Array.isArray(profile.industries)
                  ? profile.industries
                      .map((industry) => industry.trim())
                      .filter((industry) => industry.length > 0)
                  : [],
                plan,
                brand_logo_path: profile.brand_logo_path ?? null,
                brand_logo_url: profile.brand_logo_url ?? null,
                brand_color_primary: primary,
                brand_color_secondary: secondary,
                offer_template: templateIdToSave,
              },
              { onConflict: 'id' },
            )
            .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
            .maybeSingle();
          if (response.error) {
            throw createSupabaseError(response.error);
          }
          brandingData = response.data;
        }
        
        setHasProfile(true);
        setProfileLoadError(null);
        // Update profile with the saved template ID (use what was actually saved)
        setProfile((prev) => ({
          ...prev,
          brand_logo_path: brandingData?.brand_logo_path ?? prev.brand_logo_path ?? null,
          brand_logo_url: brandingData?.brand_logo_url ?? prev.brand_logo_url ?? null,
          brand_color_primary: brandingData?.brand_color_primary ?? primary ?? null,
          brand_color_secondary: brandingData?.brand_color_secondary ?? secondary ?? null,
          offer_template: brandingData?.offer_template ?? templateIdToSave,
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
        // Revert to previous template on error
        setProfile((prev) => ({ ...prev, offer_template: selectedTemplateId }));
      } finally {
        setSaving(false);
      }
    },
    [user, plan, profile, hasProfile, profileLoadError, email, selectedTemplateId, supabase, showToast],
  );

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    (async () => {
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
      const industries = Array.isArray(prof?.industries)
        ? (prof.industries as string[])
            .map((industry) => (typeof industry === 'string' ? industry.trim() : ''))
            .filter((industry) => industry.length > 0)
        : [];
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
        industries,
        brand_logo_url: prof?.brand_logo_url ?? null,
        brand_logo_path: prof?.brand_logo_path ?? null,
        brand_color_primary: prof?.brand_color_primary ?? '#1c274c',
        brand_color_secondary: prof?.brand_color_secondary ?? '#e2e8f0',
        offer_template: templateId,
      });
      setNewAct((prev) => ({ ...prev, industries }));

      const { data: list } = await supabase
        .from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries')
        .eq('user_id', user.id)
        .order('name');
      if (!active) {
        return;
      }
      setActs((list as ActivityRow[]) || []);
      setEmail(user.email ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [authStatus, showToast, supabase, user]);

  async function saveProfile(scope: 'all' | 'branding') {
    try {
      setSaving(true);
      if (!user) return;
      if (scope === 'branding') {
        if (hasBrandingErrors) {
          showToast({
            title: t('errors.settings.validationRequired'),
            description: t('errors.settings.validationRequired'),
            variant: 'error',
          });
          return;
        }
      } else if (hasErrors) {
        showToast({
          title: t('errors.settings.validationRequired'),
          description: t('errors.settings.validationRequired'),
          variant: 'error',
        });
        return;
      }
      const primary = normalizeBrandHex(profile.brand_color_primary);
      const secondary = normalizeBrandHex(profile.brand_color_secondary);
      const templateId = enforceTemplateForPlan(profile.offer_template ?? null, plan);
      const sanitizedIndustries = Array.isArray(profile.industries)
        ? profile.industries
            .map((industry) => industry.trim())
            .filter((industry) => industry.length > 0)
        : [];
      if (scope === 'branding') {
        const mutationAction = resolveProfileMutationAction({
          hasProfile,
          loadError: profileLoadError,
        });
        let brandingData:
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
            .update({
              brand_logo_path: profile.brand_logo_path ?? null,
              brand_logo_url: profile.brand_logo_url ?? null,
              brand_color_primary: primary,
              brand_color_secondary: secondary,
              offer_template: templateId,
            })
            .eq('id', user.id)
            .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
            .maybeSingle();
          if (response.error) {
            throw createSupabaseError(response.error);
          }
          brandingData = response.data;
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
                industries: sanitizedIndustries,
                plan,
                brand_logo_path: profile.brand_logo_path ?? null,
                brand_logo_url: profile.brand_logo_url ?? null,
                brand_color_primary: primary,
                brand_color_secondary: secondary,
                offer_template: templateId,
              },
              { onConflict: 'id' },
            )
            .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
            .maybeSingle();
          if (response.error) {
            throw createSupabaseError(response.error);
          }
          brandingData = response.data;
        }
        setHasProfile(true);
        setProfileLoadError(null);
        setProfile((prev) => ({
          ...prev,
          brand_logo_path: brandingData?.brand_logo_path ?? profile.brand_logo_path ?? null,
          brand_logo_url: brandingData?.brand_logo_url ?? profile.brand_logo_url ?? null,
          brand_color_primary: brandingData?.brand_color_primary ?? primary ?? null,
          brand_color_secondary: brandingData?.brand_color_secondary ?? secondary ?? null,
          offer_template: brandingData?.offer_template ?? templateId,
        }));
        showToast({
          title: t('toasts.settings.saveSuccess'),
          description: t('toasts.settings.saveSuccess'),
          variant: 'success',
        });
        return;
      }

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
          .update({
            company_name: profile.company_name ?? '',
            company_address: profile.company_address ?? '',
            company_tax_id: profile.company_tax_id ?? '',
            company_phone: profile.company_phone ?? '',
            company_email: profile.company_email ?? '',
            industries: sanitizedIndustries,
            brand_logo_path: profile.brand_logo_path ?? null,
            brand_logo_url: profile.brand_logo_url ?? null,
            brand_color_primary: primary,
            brand_color_secondary: secondary,
            offer_template: templateId,
          })
          .eq('id', user.id)
          .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
              company_email: profile.company_email ?? '',
              industries: sanitizedIndustries,
              plan,
              brand_logo_path: profile.brand_logo_path ?? null,
              brand_logo_url: profile.brand_logo_url ?? null,
              brand_color_primary: primary,
              brand_color_secondary: secondary,
              offer_template: templateId,
            },
            { onConflict: 'id' },
          )
          .select('brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
        industries: sanitizedIndustries,
        offer_template: profileData?.offer_template ?? templateId,
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
    } finally {
      setSaving(false);
    }
  }

  function startGoogleLink() {
    if (linkingGoogle || typeof window === 'undefined') {
      return;
    }

    setLinkingGoogle(true);
    const target = new URL('/api/auth/google/link', window.location.origin);
    target.searchParams.set(
      'redirect_to',
      new URL('/settings?link=google_success', window.location.origin).toString(),
    );
    window.location.href = target.toString();
  }

  function triggerLogoUpload() {
    logoInputRef.current?.click();
  }

  const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'] as const;
  const ALLOWED_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'] as const;

  function validateFileType(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
      return {
        valid: false,
        error:
          t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' }) ||
          'Csak PNG, JPEG vagy SVG fájl tölthető fel.',
      };
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        error:
          t('errors.settings.logoInvalidExtension') ||
          'A fájl kiterjesztése nem megfelelő. Csak PNG, JPEG vagy SVG fájl tölthető fel.',
      };
    }

    return { valid: true };
  }

  async function uploadLogo(file: File) {
    if (logoUploadAbortControllerRef.current) {
      logoUploadAbortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    logoUploadAbortControllerRef.current = abortController;

    setLogoUploading(true);
    setLogoUploadProgress(0);

    try {
      const maxSize = 4 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast({
          title: t('toasts.settings.logoTooLarge.title'),
          description: t('toasts.settings.logoTooLarge.description'),
          variant: 'error',
        });
        return;
      }

      const typeValidation = validateFileType(file);
      if (!typeValidation.valid) {
        showToast({
          title: t('toasts.settings.logoInvalidType.title') || 'Érvénytelen fájltípus',
          description: typeValidation.error || t('toasts.settings.logoInvalidType.description'),
          variant: 'error',
        });
        return;
      }

      if (!user) return;
      const formData = new FormData();
      formData.append('file', file);

      let response: Response;
      try {
        response = await uploadWithProgress('/api/storage/upload-brand-logo', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
          defaultErrorMessage: t('errors.settings.logoUploadFailed'),
          onProgress: (progress) => {
            setLogoUploadProgress(progress.percentage);
          },
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        if (error instanceof ApiError) {
          let errorMessage = error.message;
          if (error.status === 413) {
            errorMessage = t('errors.settings.logoTooLarge') || 'A fájl mérete túl nagy. Maximum 4 MB.';
          } else if (error.status === 415) {
            errorMessage =
              t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' }) ||
              'Csak PNG, JPEG vagy biztonságos SVG logó tölthető fel.';
          } else if (error.status === 503) {
            errorMessage =
              t('errors.settings.logoStorageUnavailable') ||
              'A tárhely jelenleg nem elérhető. Kérjük, próbáld újra később.';
          } else if (error.status === 500) {
            errorMessage = t('errors.settings.logoUploadFailed') || 'Nem sikerült feltölteni a logót. Kérjük, próbáld újra.';
          }
          throw new Error(errorMessage);
        }
        throw error;
      }

      const payload: unknown = await response.json();
      let logoPath: string | null = null;
      let logoUrl: string | null = null;

      if (payload && typeof payload === 'object') {
        const typedPayload = payload as { path?: unknown; signedUrl?: unknown; publicUrl?: unknown };

        if ('path' in typedPayload && typeof typedPayload.path === 'string') {
          logoPath = typedPayload.path;
        }
        if ('signedUrl' in typedPayload && typeof typedPayload.signedUrl === 'string') {
          logoUrl = typedPayload.signedUrl;
        } else if ('publicUrl' in typedPayload && typeof typedPayload.publicUrl === 'string') {
          logoUrl = typedPayload.publicUrl;
        }
      }

      if (!logoPath) {
        throw new Error(t('errors.settings.logoUploadMissingUrl'));
      }

      setProfile((prev) => ({
        ...prev,
        brand_logo_path: logoPath,
        brand_logo_url: logoUrl,
      }));

      try {
        await saveProfile('branding');
        showToast({
          title: t('toasts.settings.logoUploaded.title'),
          description: t('toasts.settings.logoUploaded.description'),
          variant: 'success',
        });
      } catch (saveError) {
        console.error('Failed to auto-save logo path', saveError);
        try {
          await fetchWithSupabaseAuth('/api/storage/delete-brand-logo', {
            method: 'DELETE',
            defaultErrorMessage: 'Failed to cleanup uploaded logo',
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded logo after save failure', cleanupError);
        }

        const saveErrorMessage =
          saveError instanceof Error ? saveError.message : t('errors.settings.saveFailed', { message: '' });
        showToast({
          title: t('toasts.settings.logoUploaded.title'),
          description:
            t('toasts.settings.logoUploaded.description') +
            ' ' +
            (t('errors.settings.autoSaveFailed') || t('errors.settings.saveFailed', { message: saveErrorMessage })),
          variant: 'error',
        });
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      console.error('Logo upload error', error);
      const message = error instanceof Error ? error.message : t('errors.settings.logoUploadFailed');
      showToast({
        title: t('toasts.settings.logoUploadFailed.title'),
        description: message || t('toasts.settings.logoUploadFailed.description'),
        variant: 'error',
      });
    } finally {
      setLogoUploading(false);
      setLogoUploadProgress(null);
      logoUploadAbortControllerRef.current = null;
    }
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo(file).finally(() => {
        if (e.target) e.target.value = '';
      });
    }
  }

  async function addActivity() {
    if (!newAct.name.trim()) {
      showToast({
        title: t('errors.settings.activityNameRequired'),
        description: t('errors.settings.activityNameRequired'),
        variant: 'error',
      });
      return;
    }
    try {
      setActSaving(true);
      if (!user) return;
      const ins = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: newAct.name.trim(),
          unit: newAct.unit || 'db',
          default_unit_price: Number(newAct.price) || 0,
          default_vat: Number(newAct.vat) || 27,
          industries: newAct.industries || [],
        })
        .select();
      setActs((prev) =>
        [...prev, ...((ins.data as ActivityRow[]) || [])].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewAct({ name: '', unit: 'db', price: 0, vat: 27, industries: profile.industries || [] });
    } finally {
      setActSaving(false);
    }
  }

  async function deleteActivity(id: string) {
    await supabase.from('activities').delete().eq('id', id);
    setActs((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleIndustry(rawTarget: string) {
    const target = rawTarget.trim();
    if (!target) return;

    setProfile((p) => {
      const sanitized = (p.industries || []).map((industry) => industry.trim()).filter(Boolean);
      const set = new Set(sanitized);
      if (set.has(target)) {
        set.delete(target);
      } else {
        set.add(target);
      }
      return { ...p, industries: Array.from(set) };
    });
  }

  function toggleNewActIndustry(target: string) {
    setNewAct((a) => {
      const set = new Set(a.industries);
      if (set.has(target)) {
        set.delete(target);
      } else {
        set.add(target);
      }
      return { ...a, industries: Array.from(set) };
    });
  }

  function handleManualIndustry(value: string) {
    const val = value.trim();
    if (!val) return;
    setProfile((p) => {
      const sanitized = (p.industries || []).map((industry) => industry.trim()).filter(Boolean);
      const set = new Set(sanitized);
      set.add(val);
      return { ...p, industries: Array.from(set) };
    });
    setNewIndustry('');
  }

  const handleSectionChange = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 96;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveSection(id);
    }
  }, []);

  if (loading) {
    return (
      <AppFrame title={t('settings.title')} description={t('settings.loadingDescription')}>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title={t('settings.title')}
      description={t('settings.description')}
      actions={
        email ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{t('settings.actions.loggedInAs')}</span>
            <span className="font-semibold text-slate-700">{email}</span>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Enhanced Sidebar Navigation */}
        <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-200">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Beállítások</h2>
            <SectionNav sections={sections} activeSection={activeSection} onSectionChange={handleSectionChange} />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <SettingsAuthSection
            googleLinked={googleLinked}
            linkingGoogle={linkingGoogle}
            onLinkGoogle={startGoogleLink}
          />

          <SettingsCompanySection
            profile={profile}
            errors={errors.general}
            newIndustry={newIndustry}
            onProfileChange={setProfile}
            onNewIndustryChange={setNewIndustry}
            onToggleIndustry={toggleIndustry}
            onAddManualIndustry={handleManualIndustry}
            onSave={() => saveProfile('all')}
            saving={saving}
          />

          <SettingsBrandingSection
            profile={profile}
            plan={plan}
            errors={errors.branding}
            logoUploading={logoUploading}
            logoUploadProgress={logoUploadProgress}
            onProfileChange={setProfile}
            onTriggerLogoUpload={triggerLogoUpload}
            onCancelLogoUpload={() => logoUploadAbortControllerRef.current?.abort()}
            onSave={() => saveProfile('branding')}
            onOpenPlanUpgradeDialog={openPlanUpgradeDialog}
            saving={saving}
          />

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />

          <SettingsTemplatesSection
            selectedTemplateId={selectedTemplateId}
            plan={plan}
            onTemplateSelect={handleTemplateSelect}
          />

          <SettingsActivitiesSection
            activities={acts}
            newActivity={newAct}
            saving={actSaving}
            onNewActivityChange={setNewAct}
            onToggleNewActivityIndustry={toggleNewActIndustry}
            onAddActivity={addActivity}
            onDeleteActivity={deleteActivity}
          />
        </div>
      </div>
    </AppFrame>
  );
}
