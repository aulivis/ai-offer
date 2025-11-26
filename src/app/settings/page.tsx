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
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  PaintBrushIcon,
  CubeIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import type { TemplateId } from '@/app/pdf/templates/types';
import { SettingsSecurityTab } from '@/components/settings/SettingsSecurityTab';
import { SettingsCompanySection } from '@/components/settings/SettingsCompanySection';
import { SettingsBrandingSection } from '@/components/settings/SettingsBrandingSection';
import { SettingsTemplatesSection } from '@/components/settings/SettingsTemplatesSection';
import { SettingsActivitiesSection } from '@/components/settings/SettingsActivitiesSection';
import { SettingsGuaranteesSection } from '@/components/settings/SettingsGuaranteesSection';
import { SettingsEmailSubscriptionSection } from '@/components/settings/SettingsEmailSubscriptionSection';
import { TestimonialsManager } from '@/components/settings/TestimonialsManager';
import type { Profile, ActivityRow, GuaranteeRow } from '@/components/settings/types';
import { validatePhoneHU, validateTaxHU, validateAddress } from '@/components/settings/types';
import { createClientLogger } from '@/lib/clientLogger';

const ACTIVITIES_COLLAPSE_STORAGE_KEY = 'settings.activities.collapsed';
const GUARANTEES_COLLAPSE_STORAGE_KEY = 'settings.guarantees.collapsed';

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
  const logger = useMemo(
    () => createClientLogger({ userId: user?.id, component: 'SettingsPage' }),
    [user?.id],
  );
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
  const [guarantees, setGuarantees] = useState<GuaranteeRow[]>([]);
  const [guaranteeAddLoading, setGuaranteeAddLoading] = useState(false);
  const [guaranteeBusyId, setGuaranteeBusyId] = useState<string | null>(null);
  const [activitiesCollapsed, setActivitiesCollapsed] = useState(false);
  const [guaranteesCollapsed, setGuaranteesCollapsed] = useState(false);
  const [testimonials, setTestimonials] = useState<
    Array<{
      id: string;
      user_id: string;
      activity_id?: string | null;
      text: string;
      created_at: string;
      updated_at: string;
    }>
  >([]);
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

  const mapGuaranteeRow = useCallback(
    (row: {
      id: string;
      text: string;
      created_at?: string;
      updated_at?: string;
      activity_guarantees?: Array<{ activity_id: string | null }>;
    }): GuaranteeRow => ({
      id: row.id,
      text: row.text,
      activity_ids:
        row.activity_guarantees
          ?.map((link) => link.activity_id)
          .filter((value): value is string => typeof value === 'string') ?? [],
      ...(row.created_at ? { created_at: row.created_at } : {}),
      ...(row.updated_at ? { updated_at: row.updated_at } : {}),
    }),
    [],
  );

  const loadGuarantees = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('guarantees')
      .select('id, text, created_at, updated_at, activity_guarantees(activity_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) {
      logger.error('Failed to load guarantees', error);
      return;
    }
    setGuarantees(
      (data || []).map((row) => mapGuaranteeRow(row as Parameters<typeof mapGuaranteeRow>[0])),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapGuaranteeRow, supabase, user]);

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

  const [activeTab, setActiveTab] = useState<string>('profile');

  // Initialize tab from URL hash if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (
      hash &&
      [
        'profile',
        'security',
        'branding',
        'templates',
        'activities',
        'guarantees',
        'testimonials',
        'notifications',
      ].includes(hash)
    ) {
      setActiveTab(hash);
    }
  }, []);

  const tabs = [
    {
      id: 'profile',
      label: 'Profil',
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: 'security',
      label: 'Biztonság',
      icon: <LockClosedIcon className="h-5 w-5" />,
    },
    {
      id: 'branding',
      label: 'Branding',
      icon: <PaintBrushIcon className="h-5 w-5" />,
    },
    {
      id: 'templates',
      label: 'Sablonok',
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: 'activities',
      label: t('settings.activities.title'),
      icon: <CubeIcon className="h-5 w-5" />,
    },
    {
      id: 'guarantees',
      label: t('settings.guarantees.title'),
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      id: 'testimonials',
      label: 'Ajánlások',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    },
    {
      id: 'notifications',
      label: 'Értesítések',
      icon: <EnvelopeIcon className="h-5 w-5" />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedActivities = window.localStorage.getItem(ACTIVITIES_COLLAPSE_STORAGE_KEY);
    const storedGuarantees = window.localStorage.getItem(GUARANTEES_COLLAPSE_STORAGE_KEY);
    if (storedActivities === '1') {
      setActivitiesCollapsed(true);
    }
    if (storedGuarantees === '1') {
      setGuaranteesCollapsed(true);
    }
  }, []);

  const hasActivityContent = useMemo(
    () =>
      acts.length > 0 ||
      acts.some(
        (activity) =>
          Array.isArray(activity.reference_images) && activity.reference_images.length > 0,
      ),
    [acts],
  );
  const hasGuaranteeContent = guarantees.length > 0;

  useEffect(() => {
    if (hasActivityContent && activitiesCollapsed) {
      setActivitiesCollapsed(false);
    }
  }, [activitiesCollapsed, hasActivityContent]);

  useEffect(() => {
    if (hasGuaranteeContent && guaranteesCollapsed) {
      setGuaranteesCollapsed(false);
    }
  }, [guaranteesCollapsed, hasGuaranteeContent]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (hasActivityContent) {
      window.localStorage.removeItem(ACTIVITIES_COLLAPSE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(ACTIVITIES_COLLAPSE_STORAGE_KEY, activitiesCollapsed ? '1' : '0');
  }, [activitiesCollapsed, hasActivityContent]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (hasGuaranteeContent) {
      window.localStorage.removeItem(GUARANTEES_COLLAPSE_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(GUARANTEES_COLLAPSE_STORAGE_KEY, guaranteesCollapsed ? '1' : '0');
  }, [guaranteesCollapsed, hasGuaranteeContent]);

  const hasGeneralErrors = Object.keys(errors.general).length > 0;
  const hasBrandingErrors = Object.keys(errors.branding).length > 0;
  const hasErrors = hasGeneralErrors || hasBrandingErrors;

  // Use the template ID directly from profile for display (enforcement happens on save)
  const selectedTemplateId =
    (profile.offer_template as TemplateId | null) ?? DEFAULT_OFFER_TEMPLATE_ID;

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
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
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
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
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
    [
      user,
      plan,
      profile,
      hasProfile,
      profileLoadError,
      email,
      selectedTemplateId,
      supabase,
      showToast,
    ],
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
        enable_reference_photos: prof?.enable_reference_photos ?? false,
        enable_testimonials: prof?.enable_testimonials ?? false,
        default_activity_id: prof?.default_activity_id ?? null,
      });
      setNewAct((prev) => ({ ...prev, industries }));

      const { data: list } = await supabase
        .from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries,reference_images')
        .eq('user_id', user.id)
        .order('name');
      if (!active) {
        return;
      }
      setActs((list as ActivityRow[]) || []);

      await loadGuarantees();
      if (!active) {
        return;
      }

      // Load testimonials
      const { data: testimonialsList } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) {
        return;
      }
      setTestimonials((testimonialsList as typeof testimonials) || []);

      setEmail(user.email ?? null);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
    // Only depend on authStatus and user.id, not callbacks or entire user object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id, supabase]);

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
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
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
            .select(
              'brand_logo_path, brand_logo_url, brand_color_primary, brand_color_secondary, offer_template',
            )
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
            enable_reference_photos: profile.enable_reference_photos ?? false,
            enable_testimonials: profile.enable_testimonials ?? false,
            default_activity_id: profile.default_activity_id ?? null,
          })
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
        industries: sanitizedIndustries,
        offer_template: profileData?.offer_template ?? templateId,
        enable_reference_photos: profile.enable_reference_photos ?? false,
        enable_testimonials: profile.enable_testimonials ?? false,
        default_activity_id: profile.default_activity_id ?? null,
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
        error: t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' }),
      };
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return {
        valid: false,
        error: t('errors.settings.logoInvalidExtension'),
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
          title: t('toasts.settings.logoInvalidType.title'),
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
            errorMessage = t('errors.settings.logoTooLarge');
          } else if (error.status === 415) {
            errorMessage = t('errors.settings.logoInvalidType', { types: 'PNG, JPEG, SVG' });
          } else if (error.status === 503) {
            errorMessage = t('errors.settings.logoStorageUnavailable');
          } else if (error.status === 500) {
            errorMessage = t('errors.settings.logoUploadFailed');
          }
          throw new Error(errorMessage);
        }
        throw error;
      }

      const payload: unknown = await response.json();
      let logoPath: string | null = null;
      let logoUrl: string | null = null;

      if (payload && typeof payload === 'object') {
        const typedPayload = payload as {
          path?: unknown;
          signedUrl?: unknown;
          publicUrl?: unknown;
        };

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
        logger.error('Failed to auto-save logo path', saveError);
        try {
          await fetchWithSupabaseAuth('/api/storage/delete-brand-logo', {
            method: 'DELETE',
            defaultErrorMessage: 'Failed to cleanup uploaded logo',
          });
        } catch (cleanupError) {
          logger.error('Failed to cleanup uploaded logo after save failure', cleanupError);
        }

        showToast({
          title: t('toasts.settings.logoUploaded.title'),
          description:
            t('toasts.settings.logoUploaded.description') +
            ' ' +
            t('errors.settings.autoSaveFailed'),
          variant: 'error',
        });
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      logger.error('Logo upload error', error);
      const message =
        error instanceof Error ? error.message : t('errors.settings.logoUploadFailed');
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
        [...prev, ...((ins.data as ActivityRow[]) || [])].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
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

  async function addGuaranteeEntry(text: string) {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    try {
      setGuaranteeAddLoading(true);
      const { error } = await supabase
        .from('guarantees')
        .insert({ user_id: user.id, text: trimmed });
      if (error) {
        throw createSupabaseError(error);
      }
      await loadGuarantees();
      showToast({
        title: t('settings.guarantees.saveSuccess'),
        description: '',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to add guarantee', error, { guaranteeText: trimmed });
      showToast({
        title: t('errors.settings.saveFailed', { message: trimmed }),
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
        variant: 'error',
      });
    } finally {
      setGuaranteeAddLoading(false);
    }
  }

  async function updateGuaranteeEntry(id: string, text: string) {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed) {
      showToast({
        title: t('errors.settings.validationRequired'),
        description: t('settings.guarantees.validationMessage'),
        variant: 'error',
      });
      return;
    }
    try {
      setGuaranteeBusyId(id);
      const { error } = await supabase
        .from('guarantees')
        .update({ text: trimmed })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        throw createSupabaseError(error);
      }
      setGuarantees((prev) =>
        prev.map((guarantee) =>
          guarantee.id === id ? { ...guarantee, text: trimmed } : guarantee,
        ),
      );
      showToast({
        title: t('settings.guarantees.saveSuccess'),
        description: '',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to update guarantee', error, { guaranteeId: id, guaranteeText: text });
      showToast({
        title: t('errors.settings.saveFailed', { message: text }),
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
        variant: 'error',
      });
    } finally {
      setGuaranteeBusyId(null);
    }
  }

  async function deleteGuaranteeEntry(id: string) {
    if (!user) return;
    try {
      setGuaranteeBusyId(id);
      const { error } = await supabase
        .from('guarantees')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        throw createSupabaseError(error);
      }
      setGuarantees((prev) => prev.filter((guarantee) => guarantee.id !== id));
      showToast({
        title: t('settings.guarantees.deleteSuccess'),
        description: '',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to delete guarantee', error, { guaranteeId: id });
      showToast({
        title: t('errors.settings.saveFailed', { message: id }),
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
        variant: 'error',
      });
    } finally {
      setGuaranteeBusyId(null);
    }
  }

  async function toggleGuaranteeAttachment(
    guaranteeId: string,
    activityId: string,
    shouldAttach: boolean,
  ) {
    if (!user) return;
    try {
      setGuaranteeBusyId(guaranteeId);
      if (shouldAttach) {
        const { error } = await supabase
          .from('activity_guarantees')
          .insert({ guarantee_id: guaranteeId, activity_id: activityId, user_id: user.id });
        if (error) {
          throw createSupabaseError(error);
        }
      } else {
        const { error } = await supabase
          .from('activity_guarantees')
          .delete()
          .eq('guarantee_id', guaranteeId)
          .eq('activity_id', activityId)
          .eq('user_id', user.id);
        if (error) {
          throw createSupabaseError(error);
        }
      }
      setGuarantees((prev) =>
        prev.map((guarantee) =>
          guarantee.id === guaranteeId
            ? {
                ...guarantee,
                activity_ids: shouldAttach
                  ? Array.from(new Set([...guarantee.activity_ids, activityId]))
                  : guarantee.activity_ids.filter((value) => value !== activityId),
              }
            : guarantee,
        ),
      );
    } catch (error) {
      logger.error('Failed to toggle guarantee attachment', error, {
        guaranteeId,
        activityId,
        shouldAttach,
      });
      showToast({
        title: t('errors.settings.saveFailed', { message: guaranteeId }),
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
        variant: 'error',
      });
    } finally {
      setGuaranteeBusyId(null);
    }
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
    <div className="relative min-h-screen bg-gradient-to-br from-navy-50 via-slate-50 to-turquoise-50 overflow-hidden">
      {/* Decorative gradient blobs - subtle version for settings */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-navy-200 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: '1s' }}
      ></div>
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl opacity-40"></div>

      <div className="relative z-10">
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
          <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
            {/* Tab navigation */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-sm shadow-xl">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-turquoise-50/20 pointer-events-none"></div>

              {/* Tab header */}
              <div className="relative z-10 border-b border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-white/50">
                <div className="flex items-center gap-2 overflow-x-auto px-6 scrollbar-hide">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      className={`group relative flex items-center gap-2 whitespace-nowrap px-6 py-4 font-semibold transition-all duration-300 flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'text-primary'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {/* Active indicator with gradient */}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-turquoise-500 to-primary rounded-t-full"></span>
                      )}
                      {/* Hover effect */}
                      <span
                        className={`absolute inset-0 bg-slate-50 rounded-t-xl transition-opacity duration-300 ${
                          activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                        }`}
                      ></span>
                      <span className="relative z-10 flex items-center gap-2">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div className="relative z-10 p-8 md:p-10 lg:p-12">
                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'profile' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'profile' && (
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
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'security' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'security' && (
                    <SettingsSecurityTab
                      googleLinked={googleLinked}
                      linkingGoogle={linkingGoogle}
                      email={email}
                      onLinkGoogle={startGoogleLink}
                    />
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'branding' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'branding' && (
                    <div className="space-y-6">
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
                    </div>
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'templates' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'templates' && (
                    <SettingsTemplatesSection
                      selectedTemplateId={selectedTemplateId}
                      plan={plan}
                      onTemplateSelect={handleTemplateSelect}
                    />
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'activities' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'activities' && (
                    <SettingsActivitiesSection
                      activities={acts}
                      newActivity={newAct}
                      saving={actSaving}
                      plan={plan}
                      defaultActivityId={profile.default_activity_id}
                      collapsed={activitiesCollapsed}
                      collapseDisabled={hasActivityContent}
                      onCollapsedChange={(value) => setActivitiesCollapsed(value)}
                      onNewActivityChange={setNewAct}
                      onToggleNewActivityIndustry={toggleNewActIndustry}
                      onAddActivity={addActivity}
                      onDeleteActivity={deleteActivity}
                      onActivityImagesChange={async (activityId, imagePaths) => {
                        if (!user) return;
                        try {
                          const { error } = await supabase
                            .from('activities')
                            .update({ reference_images: imagePaths })
                            .eq('id', activityId)
                            .eq('user_id', user.id);
                          if (error) {
                            throw error;
                          }
                          setActs((prev) =>
                            prev.map((a) =>
                              a.id === activityId ? { ...a, reference_images: imagePaths } : a,
                            ),
                          );
                        } catch (error) {
                          logger.error('Failed to save reference images', error, { activityId });
                          showToast({
                            title: t('errors.settings.saveFailed', {
                              message: 'Nem sikerült menteni a referenciafotókat',
                            }),
                            description: error instanceof Error ? error.message : 'Ismeretlen hiba',
                            variant: 'error',
                          });
                        }
                      }}
                      onDefaultActivityChange={async (activityId) => {
                        if (!user) return;
                        try {
                          setProfile((p) => ({ ...p, default_activity_id: activityId }));
                          const { error } = await supabase
                            .from('profiles')
                            .update({ default_activity_id: activityId })
                            .eq('id', user.id);
                          if (error) {
                            throw error;
                          }
                          showToast({
                            title: t('toasts.settings.saveSuccess'),
                            description: '',
                            variant: 'success',
                          });
                        } catch (error) {
                          logger.error('Failed to save default activity', error, { activityId });
                          showToast({
                            title: t('errors.settings.saveFailed', {
                              message: 'Nem sikerült menteni az alapértelmezett tevékenységet',
                            }),
                            description: error instanceof Error ? error.message : 'Ismeretlen hiba',
                            variant: 'error',
                          });
                        }
                      }}
                      onOpenPlanUpgradeDialog={openPlanUpgradeDialog}
                    />
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'guarantees' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'guarantees' && (
                    <SettingsGuaranteesSection
                      activities={acts}
                      guarantees={guarantees}
                      addLoading={guaranteeAddLoading}
                      busyGuaranteeId={guaranteeBusyId}
                      collapsed={guaranteesCollapsed}
                      collapseDisabled={hasGuaranteeContent}
                      onCollapsedChange={(value) => setGuaranteesCollapsed(value)}
                      onAddGuarantee={addGuaranteeEntry}
                      onUpdateGuarantee={updateGuaranteeEntry}
                      onDeleteGuarantee={deleteGuaranteeEntry}
                      onToggleAttachment={toggleGuaranteeAttachment}
                    />
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'testimonials' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'testimonials' && (
                    <div className="space-y-6">
                      <Card
                        as="section"
                        header={
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                                  <ChatBubbleLeftRightIcon className="relative z-10 h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                                    {t('settings.testimonials.title')}
                                  </h2>
                                  <p className="text-sm md:text-base text-slate-500">
                                    {t('settings.testimonials.subtitle')}
                                  </p>
                                </div>
                              </div>
                              {plan === 'pro' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newValue = !(profile.enable_testimonials ?? false);
                                    setProfile((p) => ({ ...p, enable_testimonials: newValue }));
                                    await saveProfile('all');
                                  }}
                                  disabled={saving}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                    profile.enable_testimonials ? 'bg-primary' : 'bg-slate-300'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      profile.enable_testimonials
                                        ? 'translate-x-5'
                                        : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </CardHeader>
                        }
                      >
                        {plan === 'pro' ? (
                          profile.enable_testimonials ? (
                            <TestimonialsManager
                              testimonials={testimonials}
                              activities={acts}
                              enabled={true}
                              plan={plan}
                              onTestimonialsChange={async () => {
                                if (!user) return;
                                const { data: testimonialsList } = await supabase
                                  .from('testimonials')
                                  .select('*')
                                  .eq('user_id', user.id)
                                  .order('created_at', { ascending: false });
                                setTestimonials((testimonialsList as typeof testimonials) || []);
                              }}
                            />
                          ) : null
                        ) : (
                          <div className="rounded-xl border-2 border-border bg-slate-50/50 p-8 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                              <LockClosedIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="mt-4 text-sm font-semibold text-slate-900">
                              {t('settings.proFeatures.testimonials.upgradeTitle')}
                            </h3>
                            <p className="mt-2 text-xs text-slate-600">
                              {t('settings.proFeatures.testimonials.upgradeDescription')}
                            </p>
                            <Button
                              onClick={() =>
                                openPlanUpgradeDialog({
                                  description: t(
                                    'settings.proFeatures.testimonials.upgradeDescription',
                                  ),
                                })
                              }
                              variant="primary"
                              className="mt-4"
                            >
                              {t('settings.proFeatures.testimonials.upgradeButton')}
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>

                <div
                  className={`transition-all duration-300 ${
                    activeTab === 'notifications' ? 'opacity-100 translate-y-0' : 'hidden'
                  }`}
                >
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <SettingsEmailSubscriptionSection />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AppFrame>
      </div>
    </div>
  );
}
