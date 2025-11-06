'use client';

import { t } from '@/copy';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { ChangeEvent, SVGProps } from 'react';
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
import { getBrandLogoUrl } from '@/lib/branding';
import { resolveEffectivePlan } from '@/lib/subscription';
import { resolveProfileMutationAction } from './profilePersistence';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  KeyIcon,
  BuildingOfficeIcon,
  PaintBrushIcon,
  CubeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  EyeIcon,
  LockClosedIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import type { TemplateId } from '@/app/pdf/templates/types';

type Profile = {
  company_name?: string;
  company_address?: string;
  company_tax_id?: string;
  company_phone?: string;
  company_email?: string;
  industries?: string[];
  brand_logo_url?: string | null;
  brand_logo_path?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  offer_template?: string | null;
};

type ActivityRow = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};

const ALL_INDUSTRIES_HU = [
  'Marketing',
  'Informatika',
  'Építőipar',
  'Tanácsadás',
  'Szolgáltatás',
  'Gyártás',
  'Oktatás',
  'Egészségügy',
  'Pénzügy',
  'E-kereskedelem',
  'Ingatlan',
];

function validatePhoneHU(v: string) {
  const cleaned = v.replace(/[()\s.-]/g, '');
  return /^\+?\d{9,16}$/.test(cleaned);
}
function validateTaxHU(v: string) {
  return /^\d{8}-\d-\d{2}$/.test(v.trim());
}
function validateAddress(v: string) {
  return (v?.trim()?.length || 0) >= 8;
}

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

// Enhanced Logo Preview Component
function LogoPreview({ logoPath }: { logoPath: string | null | undefined }) {
  const supabase = useSupabase();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    (async () => {
      if (!logoPath) {
        if (active) {
          setLogoUrl(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const url = await getBrandLogoUrl(supabase, logoPath, null);
        if (active) {
          setLogoUrl(url);
          setIsLoading(false);
        }
      } catch (error) {
        console.debug('Failed to load logo preview:', error);
        if (active) {
          setLogoUrl(null);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [supabase, logoPath]);

  if (isLoading) {
    return (
      <div className="flex h-24 w-24 flex-none items-center justify-center animate-pulse rounded-xl border-2 border-dashed border-border bg-slate-100">
        <PhotoIcon className="h-8 w-8 text-slate-400" />
      </div>
    );
  }

  if (logoUrl) {
    return (
      <div className="group relative h-24 w-24 flex-none overflow-hidden rounded-xl border-2 border-border bg-white shadow-sm transition-all hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={t('settings.branding.logoPreviewAlt')}
          className="h-full w-full object-contain p-2"
          onError={() => setLogoUrl(null)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5" />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50">
      <PhotoIcon className="h-8 w-8 text-slate-400" />
    </div>
  );
}

// Enhanced Color Picker Component
function ColorPicker({
  label,
  value,
  onChange,
  error,
  previewColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  previewColor: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-900">{label}</label>
      <div className="flex items-center gap-3">
        <div className="group relative h-14 w-20 flex-shrink-0">
          <input
            type="color"
            value={previewColor}
            onChange={(e) => onChange(e.target.value)}
            aria-label={label}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-xl border-2 border-border opacity-0 transition-all hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-border shadow-inner transition-all group-hover:shadow-md"
            style={{ backgroundColor: previewColor }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/0 transition-all group-hover:bg-white/10" />
        </div>
        <div className="flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#1c274c"
            className="font-mono text-sm"
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

// Section Navigation Component
function SectionNav({
  sections,
  activeSection,
  onSectionChange,
}: {
  sections: Array<{ id: string; label: string; icon: React.ReactNode }>;
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  return (
    <nav className="space-y-1" aria-label="Settings sections">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSectionChange(section.id)}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
            activeSection === section.id
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          aria-current={activeSection === section.id ? 'page' : undefined}
        >
          <span className={`flex-shrink-0 ${activeSection === section.id ? 'text-primary' : 'text-slate-400'}`}>
            {section.icon}
          </span>
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
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
  const selectedTemplateId = enforceTemplateForPlan(profile.offer_template ?? null, plan);

  const handleTemplateSelect = useCallback(
    async (templateId: TemplateId) => {
      setProfile((prev) => ({ ...prev, offer_template: templateId }));
      await saveProfile('branding');
    },
    [saveProfile],
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
          offer_template: enforceTemplateForPlan(
            typeof brandingData?.offer_template === 'string' ? brandingData.offer_template : templateId,
            plan,
          ),
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
        offer_template: enforceTemplateForPlan(
          typeof profileData?.offer_template === 'string' ? profileData.offer_template : templateId,
          plan,
        ),
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
          {/* Authentication Methods Section */}
          <Card
            id="auth"
            as="section"
            className="scroll-mt-24"
            header={
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <KeyIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t('settings.authMethods.title')}</h2>
                    <p className="text-sm text-slate-500">{t('settings.authMethods.subtitle')}</p>
                  </div>
                </div>
              </CardHeader>
            }
          >
            <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-white p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {googleLinked
                        ? t('settings.authMethods.googleLinked.title')
                        : t('settings.authMethods.googleNotLinked.title')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {googleLinked
                        ? t('settings.authMethods.googleLinked.description')
                        : t('settings.authMethods.googleNotLinked.description')}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={startGoogleLink}
                disabled={googleLinked || linkingGoogle}
                variant={googleLinked ? 'secondary' : 'primary'}
                className="w-full md:w-auto"
              >
                {googleLinked ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    {t('settings.authMethods.googleLinked.button')}
                  </>
                ) : linkingGoogle ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('settings.authMethods.googleLinking')}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t('settings.authMethods.connectGoogle')}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Company Information Section */}
          <Card
            id="company"
            as="section"
            className="scroll-mt-24"
            header={
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <BuildingOfficeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t('settings.company.title')}</h2>
                    <p className="text-sm text-slate-500">{t('settings.company.subtitle')}</p>
                  </div>
                </div>
              </CardHeader>
            }
          >
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label={t('settings.company.fields.name')}
                  value={profile.company_name || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
                />
                <Input
                  label={t('settings.company.fields.taxId')}
                  placeholder={t('settings.company.placeholders.taxId')}
                  value={profile.company_tax_id || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, company_tax_id: e.target.value }))}
                  error={errors.general.tax}
                />
                <div className="md:col-span-2">
                  <Input
                    label={t('settings.company.fields.address')}
                    placeholder={t('settings.company.placeholders.address')}
                    value={profile.company_address || ''}
                    onChange={(e) => setProfile((p) => ({ ...p, company_address: e.target.value }))}
                    error={errors.general.address}
                  />
                </div>
                <Input
                  label={t('settings.company.fields.phone')}
                  placeholder={t('settings.company.placeholders.phone')}
                  value={profile.company_phone || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, company_phone: e.target.value }))}
                  error={errors.general.phone}
                />
                <Input
                  label={t('settings.company.fields.email')}
                  type="email"
                  value={profile.company_email || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, company_email: e.target.value }))}
                />
              </div>

              <div className="space-y-4 rounded-xl border border-border/60 bg-slate-50/50 p-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    {t('settings.company.industries.heading')}
                  </label>
                  <p className="mt-1 text-xs text-slate-500">{t('settings.company.industries.helper')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_INDUSTRIES_HU.map((ind) => {
                    const active = profile.industries?.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-border bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-50'
                        }`}
                      >
                        {active && <CheckCircleIcon className="h-3.5 w-3.5" />}
                        {ind}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label={t('settings.company.industries.addLabel')}
                      placeholder={t('settings.company.industries.addPlaceholder')}
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleManualIndustry(newIndustry);
                        }
                      }}
                    />
                  </div>
                  <Button variant="secondary" onClick={() => handleManualIndustry(newIndustry)} className="sm:w-auto">
                    <PlusIcon className="h-4 w-4" />
                    {t('settings.company.industries.addButton')}
                  </Button>
                </div>

                {(profile.industries || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(profile.industries || []).map((ind) => (
                      <span
                        key={ind}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                      >
                        {ind}
                        <button
                          type="button"
                          onClick={() => toggleIndustry(ind)}
                          className="rounded-full hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`${ind} eltávolítása`}
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-border pt-6">
                <Button
                  type="button"
                  onClick={() => saveProfile('all')}
                  disabled={saving || hasErrors}
                  loading={saving}
                  size="lg"
                >
                  {saving ? t('settings.company.saving') : t('settings.company.save')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Branding Section */}
          <Card
            id="branding"
            as="section"
            className="scroll-mt-24"
            header={
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <PaintBrushIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t('settings.branding.title')}</h2>
                    <p className="text-sm text-slate-500">{t('settings.branding.subtitle')}</p>
                  </div>
                </div>
              </CardHeader>
            }
          >
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <ColorPicker
                  label={t('settings.branding.primaryLabel')}
                  value={profile.brand_color_primary || ''}
                  onChange={(value) => setProfile((p) => ({ ...p, brand_color_primary: value }))}
                  error={errors.branding.brandPrimary}
                  previewColor={primaryPreview}
                />
                <ColorPicker
                  label={t('settings.branding.secondaryLabel')}
                  value={profile.brand_color_secondary || ''}
                  onChange={(value) => setProfile((p) => ({ ...p, brand_color_secondary: value }))}
                  error={errors.branding.brandSecondary}
                  previewColor={secondaryPreview}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-slate-50 to-white p-6">
                  <div className="flex items-start gap-4">
                    <LogoPreview logoPath={profile.brand_logo_path} />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {t('settings.branding.logoUpload.title')}
                        </h3>
                        <p className="text-xs text-slate-500">{t('settings.branding.logoUpload.helper')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => {
                            if (!canUploadBrandLogo) {
                              openPlanUpgradeDialog({
                                description: t('app.planUpgradeModal.reasons.brandingLogo'),
                              });
                              return;
                            }
                            triggerLogoUpload();
                          }}
                          disabled={logoUploading || !canUploadBrandLogo}
                          variant={canUploadBrandLogo ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {logoUploading ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {t('settings.branding.logoUpload.uploading')}
                            </>
                          ) : canUploadBrandLogo ? (
                            <>
                              <PhotoIcon className="h-4 w-4" />
                              {t('settings.branding.logoUpload.button')}
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="h-4 w-4" />
                              {t('settings.branding.logoUpload.lockedButton')}
                            </>
                          )}
                        </Button>
                        {logoUploading && logoUploadAbortControllerRef.current && (
                          <Button
                            type="button"
                            onClick={() => logoUploadAbortControllerRef.current?.abort()}
                            variant="ghost"
                            size="sm"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            {t('settings.branding.logoUpload.cancel') || 'Mégse'}
                          </Button>
                        )}
                        {profile.brand_logo_path && (
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!profile.brand_logo_path) return;
                              try {
                                const url = await getBrandLogoUrl(supabase, profile.brand_logo_path, null);
                                if (url) window.open(url, '_blank', 'noopener,noreferrer');
                              } catch (error) {
                                console.error('Failed to open logo:', error);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <EyeIcon className="h-4 w-4" />
                            {t('settings.branding.logoUpload.openInNewTab')}
                          </Button>
                        )}
                      </div>
                      {logoUploading && logoUploadProgress !== null && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>{t('settings.branding.logoUpload.progress') || 'Feltöltés...'}</span>
                            <span className="font-semibold">{logoUploadProgress}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-primary transition-all duration-300 ease-out"
                              style={{ width: `${logoUploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {!canUploadBrandLogo && (
                        <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
                          <LockClosedIcon className="h-3.5 w-3.5" />
                          {t('settings.branding.logoUpload.lockedMessage')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />

              <div className="flex items-center justify-end border-t border-border pt-6">
                <Button
                  type="button"
                  onClick={() => saveProfile('branding')}
                  disabled={saving || hasBrandingErrors}
                  loading={saving}
                  size="lg"
                >
                  {saving ? t('settings.branding.saving') : t('settings.branding.save')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Templates Section */}
          <Card
            id="templates"
            as="section"
            className="scroll-mt-24"
            header={
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <DocumentTextIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t('settings.templates.title')}</h2>
                    <p className="text-sm text-slate-500">{t('settings.templates.subtitle')}</p>
                  </div>
                </div>
              </CardHeader>
            }
          >
            <div className="space-y-6">
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                plan={plan}
                onTemplateSelect={handleTemplateSelect}
                gridCols={3}
                showDescription={true}
              />
            </div>
          </Card>

          {/* Activities Section */}
          <Card
            id="activities"
            as="section"
            className="scroll-mt-24"
            header={
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <CubeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t('settings.activities.title')}</h2>
                    <p className="text-sm text-slate-500">{t('settings.activities.subtitle')}</p>
                  </div>
                </div>
              </CardHeader>
            }
          >
            <div className="space-y-6">
              <div className="rounded-xl border border-border/60 bg-slate-50/50 p-6">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Új tevékenység hozzáadása</h3>
                <div className="grid gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <Input
                      label={t('settings.activities.fields.name')}
                      placeholder={t('settings.activities.placeholders.name')}
                      value={newAct.name}
                      onChange={(e) => setNewAct((a) => ({ ...a, name: e.target.value }))}
                    />
                  </div>
                  <Input
                    label={t('settings.activities.fields.unit')}
                    placeholder={t('settings.activities.placeholders.unit')}
                    value={newAct.unit}
                    onChange={(e) => setNewAct((a) => ({ ...a, unit: e.target.value }))}
                  />
                  <Input
                    label={t('settings.activities.fields.price')}
                    type="number"
                    min={0}
                    value={newAct.price}
                    onChange={(e) => setNewAct((a) => ({ ...a, price: Number(e.target.value) }))}
                  />
                  <Input
                    label={t('settings.activities.fields.vat')}
                    type="number"
                    min={0}
                    max={100}
                    value={newAct.vat}
                    onChange={(e) => setNewAct((a) => ({ ...a, vat: Number(e.target.value) }))}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('settings.activities.industries.heading')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_INDUSTRIES_HU.map((ind) => {
                      const active = newAct.industries.includes(ind);
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => toggleNewActIndustry(ind)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'border-primary bg-primary text-white shadow-sm'
                              : 'border-border bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-50'
                          }`}
                        >
                          {active && <CheckCircleIcon className="h-3 w-3" />}
                          {ind}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={addActivity} disabled={actSaving} loading={actSaving} variant="secondary">
                    <PlusIcon className="h-4 w-4" />
                    {actSaving ? t('settings.activities.saving') : t('settings.activities.add')}
                  </Button>
                </div>
              </div>

              {acts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {acts.map((a) => (
                    <div
                      key={a.id}
                      className="group relative rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-sm font-semibold text-slate-900">{a.name}</h3>
                          <p className="text-xs text-slate-600">
                            {t('settings.activities.summary', {
                              unit: a.unit,
                              price: Number(a.default_unit_price || 0).toLocaleString('hu-HU'),
                              vat: a.default_vat,
                            })}
                          </p>
                          {(a.industries || []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(a.industries || []).slice(0, 3).map((ind) => (
                                <span
                                  key={ind}
                                  className="inline-flex items-center rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                >
                                  {ind}
                                </span>
                              ))}
                              {(a.industries || []).length > 3 && (
                                <span className="inline-flex items-center rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  +{(a.industries || []).length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteActivity(a.id)}
                          className="flex-shrink-0 rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          aria-label={`${a.name} törlése`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-12 text-center">
                  <CubeIcon className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-4 text-sm font-medium text-slate-600">{t('settings.activities.empty')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Adjon hozzá tevékenységeket a gyorsabb ajánlatkészítéshez
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppFrame>
  );
}
