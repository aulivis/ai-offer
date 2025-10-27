'use client';

import { t } from '@/copy';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
import { resolveEffectivePlan } from '@/lib/subscription';
import { resolveProfileMutationAction } from './profilePersistence';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';

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

function normalizeColorHex(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(trimmed)) return null;
  return `#${trimmed.slice(1).toLowerCase()}`;
}

function createSupabaseError(error: SupabaseErrorLike | null | undefined): Error {
  if (error) {
    const parts = [error.message, error.details, error.hint]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter((part) => part.length > 0);
    if (parts.length > 0) {
      return new Error(parts.join(' '));
    }
  }
  return new Error('Ismeretlen hiba történt a mentés közben.');
}

export default function SettingsPage() {
  const supabase = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
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
      general.phone = 'Magyar formátumú telefonszámot adj meg (pl. +36301234567).';
    }
    if (profile.company_tax_id && !validateTaxHU(profile.company_tax_id)) {
      general.tax = 'Adószám formátum: 12345678-1-12';
    }
    if (profile.company_address && !validateAddress(profile.company_address)) {
      general.address = 'A cím legyen legalább 8 karakter.';
    }

    const brandPrimary =
      typeof profile.brand_color_primary === 'string' ? profile.brand_color_primary.trim() : '';
    if (brandPrimary && !normalizeColorHex(brandPrimary)) {
      branding.brandPrimary = 'Adj meg egy #RRGGBB formátumú hex színt.';
    }

    const brandSecondary =
      typeof profile.brand_color_secondary === 'string' ? profile.brand_color_secondary.trim() : '';
    if (brandSecondary && !normalizeColorHex(brandSecondary)) {
      branding.brandSecondary = 'Adj meg egy #RRGGBB formátumú hex színt.';
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
        title: 'Google fiók összekapcsolva',
        description: 'Mostantól a Google fiókoddal is bejelentkezhetsz.',
        variant: 'success',
      });
    } else if (linkStatus === 'google_error') {
      showToast({
        title: 'Nem sikerült összekapcsolni a Google fiókot',
        description: 'Kérjük, próbáld újra egy kicsit később.',
        variant: 'error',
      });
    }

    router.replace('/settings', { scroll: false });
  }, [router, searchParams, showToast]);

  const hasGeneralErrors = Object.keys(errors.general).length > 0;
  const hasBrandingErrors = Object.keys(errors.branding).length > 0;
  const hasErrors = hasGeneralErrors || hasBrandingErrors;

  const primaryPreview = normalizeColorHex(profile.brand_color_primary) ?? '#0f172a';
  const secondaryPreview = normalizeColorHex(profile.brand_color_secondary) ?? '#f3f4f6';
  const selectedTemplateId = enforceTemplateForPlan(profile.offer_template ?? null, plan);
  const canUseProTemplates = plan === 'pro';

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
              Ártáblázat
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
              Projekt részletek
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
          title: 'Nem sikerült betölteni a profilod',
          description: loadError.message || 'Kérjük, próbáld újra egy kicsit később.',
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
        brand_color_primary: prof?.brand_color_primary ?? '#0f172a',
        brand_color_secondary: prof?.brand_color_secondary ?? '#f3f4f6',
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
          alert('Kérjük, javítsd a piros mezőket.');
          return;
        }
      } else if (hasErrors) {
        alert('Kérjük, javítsd a piros mezőket.');
        return;
      }
      const primary = normalizeColorHex(profile.brand_color_primary);
      const secondary = normalizeColorHex(profile.brand_color_secondary);
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
        alert('Mentve!');
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
      alert('Mentve!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ismeretlen hiba történt a mentés közben.';
      alert(`Nem sikerült menteni: ${message}`);
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
          title: 'Túl nagy fájl',
          description: 'A logó mérete legfeljebb 4 MB lehet.',
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
        defaultErrorMessage: 'Nem sikerült feltölteni a logót. Próbáld újra.',
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
        throw new Error('A Supabase nem adott vissza használható URL-t a logóhoz.');
      }

      setProfile((prev) => ({ ...prev, brand_logo_url: logoUrl }));
      showToast({
        title: 'Logó feltöltve',
        description: 'Ne felejtsd el a mentést.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Logo upload error', error);
      const message =
        error instanceof Error ? error.message : 'Nem sikerült feltölteni a logót. Próbáld újra.';
      showToast({
        title: 'Logó feltöltése sikertelen',
        description: message,
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
      alert('Add meg a tevékenység nevét.');
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
      <AppFrame
        title="Beállítások"
        description="Add meg a cégadatokat és hozd létre a gyakran használt tételek sablonjait."
      >
        <Card className="text-sm text-slate-500">Betöltés…</Card>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title="Beállítások"
      description="Az itt megadott információk automatikusan megjelennek az ajánlatokban és a generált PDF-ekben."
      actions={
        email ? (
          <span className="text-sm text-slate-400">
            Belépve: <span className="font-medium text-slate-600">{email}</span>
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
              <h2 className="text-lg font-semibold text-slate-900">Bejelentkezési módok</h2>
              <p className="text-sm text-slate-500">
                Kapcsold össze a Google fiókodat a gyorsabb belépéshez.
              </p>
            </CardHeader>
          }
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-white p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">
                {googleLinked
                  ? 'A Google fiókod már össze van kapcsolva.'
                  : 'Kapcsold össze a Google fiókodat.'}
              </p>
              <p className="text-xs text-slate-500">
                {googleLinked
                  ? 'A következő bejelentkezéskor használhatod a Google fiókodat is.'
                  : 'Az összekapcsolás után a Google fiókoddal is bejelentkezhetsz az alkalmazásba.'}
              </p>
            </div>
            <Button
              type="button"
              onClick={startGoogleLink}
              disabled={googleLinked || linkingGoogle}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {googleLinked
                ? 'Google fiók csatlakoztatva'
                : linkingGoogle
                  ? 'Átirányítás…'
                  : 'Google összekapcsolása'}
            </Button>
          </div>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Cégadatok</h2>
              <p className="text-sm text-slate-500">
                Töltsd ki a számlázási és kapcsolatfelvételi adatokat.
              </p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cégnév"
              value={profile.company_name || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
            />
            <Input
              label="Adószám"
              placeholder="12345678-1-12"
              value={profile.company_tax_id || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company_tax_id: e.target.value }))}
              error={errors.general.tax}
            />
            <div className="md:col-span-2">
              <Input
                label="Cím"
                placeholder="Irányítószám, település, utca, házszám"
                value={profile.company_address || ''}
                onChange={(e) => setProfile((p) => ({ ...p, company_address: e.target.value }))}
                error={errors.general.address}
              />
            </div>
            <Input
              label="Telefon"
              placeholder="+36301234567"
              value={profile.company_phone || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company_phone: e.target.value }))}
              error={errors.general.phone}
            />
            <Input
              label="E-mail"
              value={profile.company_email || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company_email: e.target.value }))}
            />
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Iparágak (több is választható)
              </span>
              <p className="text-xs text-slate-400">
                Az itt megadott iparágak az ajánlatvarázslóban is megjelennek.
              </p>
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
                  label="Új iparág hozzáadása"
                  placeholder="Pl. Nonprofit"
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
                Hozzáadás
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
                <span className="text-xs text-slate-400">Még nincs kiválasztott iparág.</span>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => saveProfile('all')}
            disabled={saving || hasErrors}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Mentés…' : 'Mentés'}
          </Button>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Márka megjelenés</h2>
              <p className="text-sm text-slate-500">
                Állítsd be a logót és a színeket, amelyek megjelennek az ajánlatok PDF-jeiben.
              </p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-fg">Elsődleges szín</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryPreview}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, brand_color_primary: e.target.value }))
                  }
                  className="h-11 w-16 cursor-pointer rounded-md border border-border bg-white"
                />
                <div className="flex-1">
                  <Input
                    value={profile.brand_color_primary || ''}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_primary: e.target.value }))
                    }
                    placeholder="#0f172a"
                    className="py-2 text-sm font-mono"
                    error={errors.branding.brandPrimary}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-fg">Másodlagos szín</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryPreview}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, brand_color_secondary: e.target.value }))
                  }
                  className="h-11 w-16 cursor-pointer rounded-md border border-border bg-white"
                />
                <div className="flex-1">
                  <Input
                    value={profile.brand_color_secondary || ''}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, brand_color_secondary: e.target.value }))
                    }
                    placeholder="#f3f4f6"
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
                  alt="Feltöltött logó"
                  className="h-16 w-16 flex-none rounded-lg border border-border bg-white object-contain p-1"
                />
              ) : (
                <div className="flex h-16 w-16 flex-none items-center justify-center rounded-lg border border-border bg-white text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Nincs logó
                </div>
              )}
              <div className="flex-1 text-sm text-slate-500">
                <p className="font-semibold text-slate-700">Logó feltöltése</p>
                <p className="text-xs text-slate-400">
                  PNG, JPG vagy SVG formátum támogatott. Maximum 4 MB.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={triggerLogoUpload}
                    disabled={logoUploading}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {logoUploading ? 'Feltöltés…' : 'Logó feltöltése'}
                  </Button>
                  {profile.brand_logo_url && (
                    <a
                      href={profile.brand_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Megnyitás új lapon
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-dashed border-border bg-slate-50/60 p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Minta előnézet
              </span>
              <div
                className="rounded-2xl border border-border p-4 shadow-inner"
                style={{ background: secondaryPreview }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: primaryPreview }}
                >
                  Céged neve
                </p>
                <p className="mt-2 text-base font-semibold" style={{ color: primaryPreview }}>
                  Ajánlat címe
                </p>
                <p className="text-xs text-slate-600">
                  Így jelenik meg a fejléced a generált dokumentumokban.
                </p>
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
              {saving ? 'Mentés…' : 'Márka mentése'}
            </Button>
          </div>
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Ajánlat sablonok</h2>
              <p className="text-sm text-slate-500">
                Válaszd ki, milyen stílusban készüljön el a PDF ajánlat. A sablonok automatikusan a
                megadott márkaszíneket használják.
              </p>
            </CardHeader>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {OFFER_TEMPLATES.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const requiresPro = offerTemplateRequiresPro(template.id);
              const disabled = requiresPro && !canUseProTemplates;
              const cardClassNames = [
                'flex h-full w-full flex-col gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-border shadow-lg ring-2 ring-slate-900/10'
                  : 'border-border hover:border-border',
                disabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm',
              ].join(' ');
              return (
                <Button
                  key={template.id}
                  type="button"
                  className={cardClassNames}
                  onClick={() => {
                    if (disabled) return;
                    setProfile((prev) => ({ ...prev, offer_template: template.id }));
                  }}
                  disabled={disabled}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{template.label}</span>
                    {requiresPro && (
                      <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        Pro
                      </span>
                    )}
                    {isSelected && (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Aktív
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{template.description}</p>
                  {renderTemplatePreview(template.previewVariant)}
                  {disabled && (
                    <p className="text-xs font-medium text-amber-600">
                      Pro előfizetéssel érhető el.
                    </p>
                  )}
                </Button>
              );
            })}
          </div>

          {!canUseProTemplates && (
            <p className="text-xs text-slate-500">
              A Prémium sablon a Pro csomaggal választható. Frissíts a számlázási oldalon, ha
              szükséged van rá.
            </p>
          )}
        </Card>

        <Card
          as="section"
          className="space-y-6"
          header={
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Tevékenység-sablonok</h2>
              <p className="text-sm text-slate-500">
                Adj meg előre gyakori tételeket mértékegységgel, díjjal és kapcsolódó iparágakkal.
              </p>
            </CardHeader>
          }
        >
          <div className="grid items-end gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Input
                label="Megnevezés"
                placeholder="Pl. Webfejlesztés"
                value={newAct.name}
                onChange={(e) => setNewAct((a) => ({ ...a, name: e.target.value }))}
              />
            </div>
            <Input
              label="Mértékegység"
              placeholder="db / óra / m²"
              value={newAct.unit}
              onChange={(e) => setNewAct((a) => ({ ...a, unit: e.target.value }))}
            />
            <Input
              label="Alap díj (nettó, Ft)"
              type="number"
              min={0}
              value={newAct.price}
              onChange={(e) => setNewAct((a) => ({ ...a, price: Number(e.target.value) }))}
            />
            <Input
              label="ÁFA %"
              type="number"
              min={0}
              value={newAct.vat}
              onChange={(e) => setNewAct((a) => ({ ...a, vat: Number(e.target.value) }))}
            />
            <div className="lg:col-span-5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Iparágak ehhez a tételhez
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
            {actSaving ? 'Hozzáadás…' : 'Tevékenység hozzáadása'}
          </Button>

          <div className="grid gap-3 md:grid-cols-2">
            {acts.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{a.name}</h3>
                    <p className="text-xs text-slate-500">
                      Egység: {a.unit} • Díj:{' '}
                      {Number(a.default_unit_price || 0).toLocaleString('hu-HU')} Ft • ÁFA:{' '}
                      {a.default_vat}%
                    </p>
                  </div>
                  <Button
                    onClick={() => deleteActivity(a.id)}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Törlés
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Iparágak: {(a.industries || []).join(', ') || '—'}
                </p>
              </div>
            ))}
            {acts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-white/70 p-6 text-sm text-slate-500">
                Még nincs sablon. Adj hozzá legalább egy gyakran használt tételt.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}
