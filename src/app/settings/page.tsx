'use client';

import { t } from '@/copy';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, SVGProps } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  DEFAULT_OFFER_TEMPLATE_ID,
  OFFER_TEMPLATES,
  enforceTemplateForPlan,
  offerTemplateRequiresPro,
  type OfferTemplateId,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { normalizeBrandHex } from '@/lib/branding';
import { resolveEffectivePlan } from '@/lib/subscription';
import { resolveProfileMutationAction } from './profilePersistence';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';

type Profile = {
  company_name?: string;
  company_address?: string;
  company_tax_id?: string;
  company_phone?: string;
  company_email?: string;
  industries?: string[];
  brand_logo_url?: string | null;
  brand_color_primary?: string | null;
  brand_color_secondary?: string | null;
  offer_template?: OfferTemplateId | null;
};

type ActivityRow = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z"
        fill="currentColor"
      />
    </svg>
  );
}

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
  // 12345678-1-12
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
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!searchParams) {
      return;
    }

    const linkStatus = searchParams.get('link');
    if (!linkStatus) {
      return;
    }

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

  const hasGeneralErrors = Object.keys(errors.general).length > 0;
  const hasBrandingErrors = Object.keys(errors.branding).length > 0;
  const hasErrors = hasGeneralErrors || hasBrandingErrors;

  const primaryPreview = normalizeBrandHex(profile.brand_color_primary) ?? '#1c274c';
  const secondaryPreview = normalizeBrandHex(profile.brand_color_secondary) ?? '#e2e8f0';
  const selectedTemplateId = enforceTemplateForPlan(profile.offer_template ?? null, plan);
  const canUseProTemplates = plan === 'pro';
  const canUploadBrandLogo = plan !== 'free';

  function renderTemplatePreview(variant: 'modern' | 'premium') {
    if (variant === 'premium') {
      return (
        <div className="flex h-28 flex-col overflow-hidden rounded-2xl border border-border bg-white">
          <div
            className="h-16 w-full"
            style={{
              background: `linear-gradient(135deg, ${primaryPreview}, ${secondaryPreview})`,
            }}
          />
          <div className="flex flex-1 items-center gap-2 px-3 py-2 text-[10px] text-slate-500">
            <div className="h-9 w-9 rounded-2xl border border-border bg-white/80 shadow-sm" />
            <div className="flex-1 rounded-lg border border-border/70 bg-white px-2 py-1">
              {t('settings.branding.preview.tableLabel')}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-28 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white">
        <div className="h-1.5 w-full" style={{ backgroundColor: primaryPreview }} />
        <div className="px-3 py-2 text-[10px] text-slate-500">
          <div className="h-3 w-2/5 rounded-full" style={{ backgroundColor: primaryPreview }} />
          <div className="mt-3 grid grid-cols-4 gap-1">
            <div
              className="col-span-3 rounded-md border border-border/80 bg-white px-2 py-1 shadow-sm"
              style={{ borderTopColor: primaryPreview }}
            >
              {t('settings.branding.preview.detailsLabel')}
            </div>
            <div className="col-span-1 rounded-md border border-border bg-slate-50" />
          </div>
        </div>
      </div>
    );
  }

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
          alert(t('errors.settings.validationRequired'));
          return;
        }
      } else if (hasErrors) {
        alert(t('errors.settings.validationRequired'));
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
              brand_logo_url: profile.brand_logo_url ?? null,
              brand_color_primary: primary,
              brand_color_secondary: secondary,
              offer_template: templateId,
            })
            .eq('id', user.id)
            .select('brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
                brand_logo_url: profile.brand_logo_url ?? null,
                brand_color_primary: primary,
                brand_color_secondary: secondary,
                offer_template: templateId,
              },
              { onConflict: 'id' },
            )
            .select('brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
          brand_logo_url: brandingData?.brand_logo_url ?? profile.brand_logo_url ?? null,
          brand_color_primary: brandingData?.brand_color_primary ?? primary ?? null,
          brand_color_secondary: brandingData?.brand_color_secondary ?? secondary ?? null,
          offer_template: enforceTemplateForPlan(
            typeof brandingData?.offer_template === 'string'
              ? brandingData.offer_template
              : templateId,
            plan,
          ),
        }));
        alert(t('toasts.settings.saveSuccess'));
        return;
      }

      const mutationAction = resolveProfileMutationAction({
        hasProfile,
        loadError: profileLoadError,
      });
      let profileData:
        | {
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
            brand_logo_url: profile.brand_logo_url ?? null,
            brand_color_primary: primary,
            brand_color_secondary: secondary,
            offer_template: templateId,
          })
          .eq('id', user.id)
          .select('brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
              brand_logo_url: profile.brand_logo_url ?? null,
              brand_color_primary: primary,
              brand_color_secondary: secondary,
              offer_template: templateId,
            },
            { onConflict: 'id' },
          )
          .select('brand_logo_url, brand_color_primary, brand_color_secondary, offer_template')
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
        brand_logo_url: profileData?.brand_logo_url ?? prev.brand_logo_url ?? null,
        brand_color_primary: profileData?.brand_color_primary ?? primary ?? null,
        brand_color_secondary: profileData?.brand_color_secondary ?? secondary ?? null,
        industries: sanitizedIndustries,
        offer_template: enforceTemplateForPlan(
          typeof profileData?.offer_template === 'string' ? profileData.offer_template : templateId,
          plan,
        ),
      }));
      alert(t('toasts.settings.saveSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.settings.saveUnknown');
      alert(t('errors.settings.saveFailed', { message }));
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

  async function uploadLogo(file: File) {
    setLogoUploading(true);
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
      if (!user) return;
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithSupabaseAuth('/api/storage/upload-brand-logo', {
        method: 'POST',
        body: formData,
        defaultErrorMessage: t('errors.settings.logoUploadFailed'),
      });

      const payload: unknown = await response.json();
      let logoUrl: unknown = null;

      if (payload && typeof payload === 'object') {
        if ('signedUrl' in payload) {
          logoUrl = (payload as { signedUrl?: unknown }).signedUrl ?? null;
        }
        if (!logoUrl && 'publicUrl' in payload) {
          logoUrl = (payload as { publicUrl?: unknown }).publicUrl ?? null;
        }
      }

      if (typeof logoUrl !== 'string' || !logoUrl) {
        throw new Error(t('errors.settings.logoUploadMissingUrl'));
      }

      setProfile((prev) => ({ ...prev, brand_logo_url: logoUrl }));
      showToast({
        title: t('toasts.settings.logoUploaded.title'),
        description: t('toasts.settings.logoUploaded.description'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Logo upload error', error);
      const message =
        error instanceof Error ? error.message : t('errors.settings.logoUploadFailed');
      showToast({
        title: t('toasts.settings.logoUploadFailed.title'),
        description: message || t('toasts.settings.logoUploadFailed.description'),
        variant: 'error',
      });
    } finally {
      setLogoUploading(false);
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
      alert(t('errors.settings.activityNameRequired'));
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
        <Card className="text-sm text-slate-500">{t('settings.loading')}</Card>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title={t('settings.title')}
      description={t('settings.description')}
      actions={
        email ? (
          <span className="text-sm text-slate-400">
            {t('settings.actions.loggedInAs')}{' '}
            <span className="font-medium text-slate-600">{email}</span>
          </span>
        ) : null
      }
    >
      <div className="space-y-8">
        <Card
          as="section"
          className="space-y-4"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('settings.authMethods.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('settings.authMethods.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">
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
            <Button
              type="button"
              onClick={startGoogleLink}
              disabled={googleLinked || linkingGoogle}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {googleLinked
                ? t('settings.authMethods.googleLinked.button')
                : linkingGoogle
                  ? t('settings.authMethods.googleLinking')
                  : t('settings.authMethods.connectGoogle')}
            </Button>
          </div>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('settings.company.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('settings.company.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
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
              value={profile.company_email || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company_email: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.company.industries.heading')}
              </span>
              <p className="text-xs text-slate-400">{t('settings.company.industries.helper')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_INDUSTRIES_HU.map((ind) => {
                const active = profile.industries?.includes(ind);
                return (
                  <Button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'border-border bg-slate-900 text-white' : 'border-border text-slate-600 hover:border-border hover:text-slate-900'}`}
                  >
                    {ind}
                  </Button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="sm:flex-1">
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
              <Button
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => handleManualIndustry(newIndustry)}
              >
                {t('settings.company.industries.addButton')}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(profile.industries || []).map((ind) => (
                <span
                  key={ind}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {ind}
                </span>
              ))}
              {(profile.industries || []).length === 0 && (
                <span className="text-xs text-slate-400">
                  {t('settings.company.industries.empty')}
                </span>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => saveProfile('all')}
            disabled={saving || hasErrors}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? t('settings.company.saving') : t('settings.company.save')}
          </Button>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('settings.branding.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('settings.branding.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-fg">
                {t('settings.branding.primaryLabel')}
              </span>
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-16">
                  <input
                    type="color"
                    value={primaryPreview}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_primary: e.target.value }))
                    }
                    aria-label={t('settings.branding.primaryLabel')}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md opacity-0"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md border border-border shadow-inner"
                    style={{ backgroundColor: primaryPreview }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={profile.brand_color_primary || ''}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_primary: e.target.value }))
                    }
                    placeholder={t('settings.branding.placeholders.primary')}
                    className="py-2 text-sm font-mono"
                    error={errors.branding.brandPrimary}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-fg">
                {t('settings.branding.secondaryLabel')}
              </span>
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-16">
                  <input
                    type="color"
                    value={secondaryPreview}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_secondary: e.target.value }))
                    }
                    aria-label={t('settings.branding.secondaryLabel')}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md opacity-0"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md border border-border shadow-inner"
                    style={{ backgroundColor: secondaryPreview }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={profile.brand_color_secondary || ''}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_secondary: e.target.value }))
                    }
                    placeholder={t('settings.branding.placeholders.secondary')}
                    className="py-2 text-sm font-mono"
                    error={errors.branding.brandSecondary}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-1 items-start gap-4 rounded-2xl border border-dashed border-border bg-slate-50/60 p-4">
              {profile.brand_logo_url ? (
                // A kis méretű előnézethez nem szükséges képtömörítés, ezért marad a sima <img> elem.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.brand_logo_url}
                  alt={t('settings.branding.logoPreviewAlt')}
                  className="h-16 w-16 flex-none rounded-lg border border-border bg-white object-contain p-1"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/logo-placeholder.svg"
                  alt={t('settings.branding.logoPlaceholderAlt')}
                  className="h-16 w-16 flex-none rounded-lg border border-border bg-white object-contain p-1"
                />
              )}
              <div className="flex-1 text-sm text-slate-500">
                <p className="font-semibold text-slate-700">
                  {t('settings.branding.logoUpload.title')}
                </p>
                <p className="text-xs text-slate-400">{t('settings.branding.logoUpload.helper')}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    disabled={logoUploading && canUploadBrandLogo}
                    aria-disabled={!canUploadBrandLogo}
                    className={[
                      'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed',
                      canUploadBrandLogo
                        ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400'
                        : 'cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {canUploadBrandLogo ? (
                      logoUploading ? (
                        t('settings.branding.logoUpload.uploading')
                      ) : (
                        t('settings.branding.logoUpload.button')
                      )
                    ) : (
                      <>
                        <LockIcon className="h-4 w-4" />
                        {t('settings.branding.logoUpload.lockedButton')}
                      </>
                    )}
                  </Button>
                  {profile.brand_logo_url && (
                    <a
                      href={profile.brand_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {t('settings.branding.logoUpload.openInNewTab')}
                    </a>
                  )}
                </div>
                {!canUploadBrandLogo && (
                  <p className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-600">
                    <LockIcon className="h-3.5 w-3.5" />
                    {t('settings.branding.logoUpload.lockedMessage')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-dashed border-border bg-slate-50/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('settings.branding.preview.title')}
              </span>
              <div
                className="rounded-2xl border border-border p-4 shadow-inner"
                style={{ background: secondaryPreview }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: primaryPreview }}
                >
                  {t('settings.branding.preview.company')}
                </p>
                <p className="mt-2 text-base font-semibold" style={{ color: primaryPreview }}>
                  {t('settings.branding.preview.offer')}
                </p>
                <p className="text-xs text-slate-600">{t('settings.branding.preview.helper')}</p>
                <div
                  className="mt-4 h-1.5 w-24 rounded-full"
                  style={{ background: primaryPreview }}
                />
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

          <div className="flex items-center justify-end pt-2">
            <Button
              type="button"
              onClick={() => saveProfile('branding')}
              disabled={saving || hasBrandingErrors}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? t('settings.branding.saving') : t('settings.branding.save')}
            </Button>
          </div>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('settings.templates.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('settings.templates.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {OFFER_TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const requiresPro = offerTemplateRequiresPro(template.id);
              const requiresUpgrade = requiresPro && !canUseProTemplates;
              const cardClassNames = [
                'flex h-full w-full flex-col gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-border shadow-lg ring-2 ring-slate-900/10'
                  : 'border-border hover:border-border',
                requiresUpgrade ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm',
              ].join(' ');
              return (
                <Button
                  key={template.id}
                  type="button"
                  className={cardClassNames}
                  aria-disabled={requiresUpgrade}
                  onClick={() => {
                    if (requiresUpgrade) {
                      openPlanUpgradeDialog({
                        description: t('app.planUpgradeModal.reasons.proTemplates'),
                      });
                      return;
                    }
                    setProfile((prev) => ({ ...prev, offer_template: template.id }));
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{template.label}</span>
                    {requiresPro && (
                      <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {t('settings.templates.proBadge')}
                      </span>
                    )}
                    {isSelected && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {t('settings.templates.activeBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{template.description}</p>
                  {renderTemplatePreview(template.previewVariant)}
                  {requiresUpgrade && (
                    <p className="text-xs font-medium text-amber-600">
                      {t('settings.templates.proOnly')}
                    </p>
                  )}
                </Button>
              );
            })}
          </div>

          {!canUseProTemplates && (
            <p className="text-xs text-slate-500">{t('settings.templates.upgradeHint')}</p>
          )}
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('settings.activities.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('settings.activities.subtitle')}</p>
            </CardHeader>
          }
        >
          <div className="grid items-end gap-4 lg:grid-cols-5">
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
              value={newAct.vat}
              onChange={(e) => setNewAct((a) => ({ ...a, vat: Number(e.target.value) }))}
            />
            <div className="lg:col-span-5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.activities.industries.heading')}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_INDUSTRIES_HU.map((ind) => {
                  const active = newAct.industries.includes(ind);
                  return (
                    <Button
                      key={ind}
                      type="button"
                      onClick={() => toggleNewActIndustry(ind)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? 'border-border bg-slate-900 text-white' : 'border-border text-slate-600 hover:border-border hover:text-slate-900'}`}
                    >
                      {ind}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            onClick={addActivity}
            disabled={actSaving}
            className="inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actSaving ? t('settings.activities.saving') : t('settings.activities.add')}
          </Button>

          <div className="grid gap-3 md:grid-cols-2">
            {acts.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{a.name}</h3>
                    <p className="text-xs text-slate-500">
                      {t('settings.activities.summary', {
                        unit: a.unit,
                        price: Number(a.default_unit_price || 0).toLocaleString('hu-HU'),
                        vat: a.default_vat,
                      })}
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteActivity(a.id)}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t('settings.activities.delete')}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {t('settings.activities.assignedIndustries', {
                    list: (a.industries || []).join(', ') || '—',
                  })}
                </p>
              </div>
            ))}
            {acts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-white/70 p-6 text-sm text-slate-500">
                {t('settings.activities.empty')}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}
