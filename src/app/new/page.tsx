'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import EditablePriceTable, { PriceRow } from '@/components/EditablePriceTable';
import AppFrame from '@/components/AppFrame';
import { priceTableHtml, summarize } from '@/app/lib/pricing';
import { offerBodyMarkup, OFFER_DOCUMENT_STYLES } from '@/app/lib/offerDocument';
import { useSupabase } from '@/components/SupabaseProvider';
import RichTextEditor from '@/components/RichTextEditor';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { STREAM_TIMEOUT_MS } from '@/lib/aiPreview';
import { useToast } from '@/components/ToastProvider';

type Step1Form = {
  industry: string;
  title: string;
  description: string;
  deadline: string;
  language: 'hu'|'en';
  brandVoice: 'friendly'|'formal';
  style: 'compact'|'detailed';
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Activity = { id:string; name:string; unit:string; default_unit_price:number; default_vat:number; industries:string[] };
type Client = { id:string; company_name:string; address?:string; tax_id?:string; representative?:string; phone?:string; email?:string };

type BrandingState = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
};

type OfferSections = {
  introduction: string;
  project_summary: string;
  scope: string[];
  deliverables: string[];
  schedule: string[];
  assumptions: string[];
  next_steps: string[];
  closing: string;
};

function isOfferSections(value: unknown): value is OfferSections {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  const isNonEmptyString = (key: keyof OfferSections) => {
    const val = obj[key as string];
    return typeof val === 'string' && val.trim().length > 0;
  };

  const isStringArray = (key: keyof OfferSections) => {
    const val = obj[key as string];
    return (
      Array.isArray(val) &&
      val.length > 0 &&
      val.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  };

  return (
    isNonEmptyString('introduction') &&
    isNonEmptyString('project_summary') &&
    isNonEmptyString('closing') &&
    ['scope', 'deliverables', 'schedule', 'assumptions', 'next_steps'].every((key) =>
      isStringArray(key as keyof OfferSections)
    )
  );
}

const inputFieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const textareaClass = 'w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const cardClass = 'rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm';
const PREVIEW_TIMEOUT_SECONDS = Math.ceil(STREAM_TIMEOUT_MS / 1000);

export default function NewOfferWizard() {
  const sb = useSupabase();
  const router = useRouter();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [availableIndustries, setAvailableIndustries] = useState<string[]>(['Marketing','Informatika','Építőipar','Tanácsadás','Szolgáltatás']);

  // 1) alapok
  const [form, setForm] = useState<Step1Form>({
    industry: 'Marketing',
    title: '',
    description: '',
    deadline: '',
    language: 'hu',
    brandVoice: 'friendly',
    style: 'detailed',
  });

  // 1/b) címzett (opcionális) + autocomplete
  const [client, setClient] = useState<ClientForm>({ company_name: '' });
  const [clientList, setClientList] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string|undefined>(undefined);
  const [showClientDrop, setShowClientDrop] = useState(false);

  // 2) tevékenységek / árlista
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([
    { name: 'Konzultáció', qty: 1, unit: 'óra', unitPrice: 15000, vat: 27 }
  ]);

  // preview
  const [previewHtml, setPreviewHtml] = useState<string>('<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(PREVIEW_TIMEOUT_SECONDS);
  const [previewCountdownToken, setPreviewCountdownToken] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout|null>(null);
  const previewAbortRef = useRef<AbortController|null>(null);
  const previewRequestIdRef = useRef(0);
  const previewCountdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [branding, setBranding] = useState<BrandingState>({});
  const [profileCompanyName, setProfileCompanyName] = useState('');

  // edit on step 3
  const [editedHtml, setEditedHtml] = useState<string>('');

  // auth + preload
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    (async () => {
      const { data: prof } = await sb
        .from('profiles')
        .select('industries, company_name, brand_color_primary, brand_color_secondary, brand_logo_url')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) {
        return;
      }
      if (prof?.industries?.length) {
        setAvailableIndustries(prof.industries);
        setForm((f) => ({ ...f, industry: prof.industries?.[0] ?? f.industry }));
      }
      setProfileCompanyName(prof?.company_name ?? '');
      setBranding({
        primaryColor: prof?.brand_color_primary ?? null,
        secondaryColor: prof?.brand_color_secondary ?? null,
        logoUrl: prof?.brand_logo_url ?? null,
      });

      const { data: acts } = await sb
        .from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries')
        .eq('user_id', user.id)
        .order('name');
      if (!active) {
        return;
      }
      setActivities(acts || []);

      const { data: cl } = await sb
        .from('clients')
        .select('id,company_name,address,tax_id,representative,phone,email')
        .eq('user_id', user.id)
        .order('company_name');
      if (!active) {
        return;
      }
      setClientList(cl || []);
    })();

    return () => {
      active = false;
    };
  }, [authStatus, sb, user]);

  useEffect(() => {
    return () => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const clearCountdown = () => {
      if (previewCountdownIntervalRef.current) {
        clearInterval(previewCountdownIntervalRef.current);
        previewCountdownIntervalRef.current = null;
      }
    };

    if (!previewLoading) {
      clearCountdown();
      setPreviewCountdown(PREVIEW_TIMEOUT_SECONDS);
      return clearCountdown;
    }

    clearCountdown();
    setPreviewCountdown(PREVIEW_TIMEOUT_SECONDS);
    previewCountdownIntervalRef.current = setInterval(() => {
      setPreviewCountdown((prev) => {
        if (prev <= 1) {
          clearCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearCountdown;
  }, [previewLoading, previewCountdownToken]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a =>
      (a.industries||[]).length === 0 ||
      a.industries.includes(form.industry)
    );
  }, [activities, form.industry]);

  // === Autocomplete (cég) ===
  const filteredClients = useMemo(() => {
    const q = (client.company_name || '').toLowerCase();
    if (!q) return clientList.slice(0,8);
    return clientList.filter(c => c.company_name.toLowerCase().includes(q)).slice(0,8);
  }, [client.company_name, clientList]);

  function pickClient(c: Client) {
    setClientId(c.id);
    setClient({
      company_name: c.company_name,
      address: c.address || '',
      tax_id: c.tax_id || '',
      representative: c.representative || '',
      phone: c.phone || '',
      email: c.email || '',
    });
    setShowClientDrop(false);
  }

  // === Preview hívó ===
  const callPreview = useCallback(async () => {
    const nextRequestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = nextRequestId;

    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
      previewAbortRef.current = null;
    }

    if (!form.title && !form.description) {
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    let controller: AbortController | null = null;
    try {
      setPreviewLoading(true);
      setPreviewCountdownToken((value) => value + 1);
      setPreviewError(null);
      controller = new AbortController();
      previewAbortRef.current = controller;

      const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
        supabase: sb,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: form.industry,
          title: form.title,
          description: form.description,
          deadline: form.deadline,
          language: form.language,
          brandVoice: form.brandVoice,
          style: form.style,
        }),
        signal: controller.signal,
        authErrorMessage: 'Nem sikerült hitelesíteni az előnézet lekérését.',
        errorMessageBuilder: status => `Hiba az előnézet betöltésekor (${status})`,
        defaultErrorMessage: 'Ismeretlen hiba történt az előnézet lekérése közben.',
      });

      if (!resp.body) {
        const message = 'Az AI nem küldött adatot az előnézethez.';
        setPreviewHtml('<p>(nincs előnézet)</p>');
        setPreviewError(message);
        showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let latestHtml = '';
      let streamErrorMessage: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (!rawEvent || !rawEvent.startsWith('data:')) continue;
          const jsonPart = rawEvent.replace(/^data:\s*/, '');
          if (!jsonPart) continue;

          try {
            const payload = JSON.parse(jsonPart) as { type?: string; html?: string; message?: string };
            if (payload.type === 'delta' || payload.type === 'done') {
              if (typeof payload.html === 'string') {
                latestHtml = payload.html;
                if (previewRequestIdRef.current === nextRequestId) {
                  setPreviewHtml(payload.html || '<p>(nincs előnézet)</p>');
                  if (payload.type === 'done') {
                    setEditedHtml((prev) => prev || (payload.html || ''));
                  }
                }
              }
            } else if (payload.type === 'error') {
              streamErrorMessage =
                typeof payload.message === 'string' && payload.message.trim().length > 0
                  ? payload.message
                  : 'Ismeretlen hiba történt az AI előnézet frissítése közben.';
              break;
            }
          } catch (err: unknown) {
            console.error('Nem sikerült feldolgozni az AI előnézet adatát', err, jsonPart);
          }
        }

        if (streamErrorMessage) {
          try {
            await reader.cancel();
          } catch {
            /* ignore reader cancel errors */
          }
          break;
        }
      }

      if (streamErrorMessage) {
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
          setPreviewError(streamErrorMessage);
        }
        showToast({ title: 'Előnézet hiba', description: streamErrorMessage, variant: 'error' });
        return;
      }

      if (!latestHtml && previewRequestIdRef.current === nextRequestId) {
        setPreviewHtml('<p>(nincs előnézet)</p>');
      }
    } catch (error) {
      if (isAbortError(error)) return;
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Ismeretlen hiba történt az előnézet lekérése közben.';
      console.error('Előnézet hiba:', message, error);
      setPreviewError(message);
      showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
    } finally {
      const isLatest = previewRequestIdRef.current === nextRequestId;
      if (previewAbortRef.current === controller) {
        previewAbortRef.current = null;
      }
      if (isLatest) {
        setPreviewLoading(false);
      }
    }
  }, [
    form.brandVoice,
    form.deadline,
    form.description,
    form.industry,
    form.language,
    form.style,
    form.title,
    showToast,
    sb,
  ]);
  const onBlurTrigger = useCallback(() => {
    void callPreview();
  }, [callPreview]);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void callPreview();
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [callPreview]);

  const totals = useMemo(() => summarize(rows), [rows]);

  const pricePreviewHtml = useMemo(() => priceTableHtml(rows), [rows]);
  const previewMarkup = useMemo(() => {
    const headerCompany = profileCompanyName.trim() || 'Vállalkozásod neve';
    const title = form.title.trim() || 'Árajánlat';
    const body = (editedHtml || previewHtml) || '<p>(nincs előnézet)</p>';
    return offerBodyMarkup({
      title,
      companyName: headerCompany,
      aiBodyHtml: body,
      priceTableHtml: pricePreviewHtml,
      branding,
    });
  }, [branding, editedHtml, form.title, previewHtml, pricePreviewHtml, profileCompanyName]);

  async function ensureClient(): Promise<string|undefined> {
    const name = (client.company_name || '').trim();
    if (!name) return undefined;
    // meglévő?
    if (clientId) return clientId;

    if (!user) return undefined;

    // próbáljuk meglévő alapján
    const { data: match } = await sb
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .ilike('company_name', name)
      .maybeSingle();
    if (match?.id) return match.id;

    // új felvitel
    const ins = await sb
      .from('clients')
      .insert({
        user_id: user.id,
        company_name: name,
        address: client.address || null,
        tax_id: client.tax_id || null,
        representative: client.representative || null,
        phone: client.phone || null,
        email: client.email || null,
      })
      .select('id')
      .single();

    return ins.data?.id;
  }

  async function generate() {
    try {
      setLoading(true);
      const cid = await ensureClient();
      let resp: Response;
      try {
        resp = await fetchWithSupabaseAuth('/api/ai-generate', {
          supabase: sb,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            industry: form.industry,
            description: form.description,
            deadline: form.deadline,
            language: form.language,
            brandVoice: form.brandVoice,
            style: form.style,
            prices: rows,
            aiOverrideHtml: editedHtml || previewHtml,
            clientId: cid,
          }),
          authErrorMessage: 'Nem vagy bejelentkezve.',
          errorMessageBuilder: status => `Hiba a generálásnál (${status})`,
          defaultErrorMessage: 'Ismeretlen hiba történt az ajánlat generálása közben.',
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          alert('Nem vagy bejelentkezve.');
          router.replace('/login');
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Ismeretlen hiba történt az ajánlat generálása közben.';
        alert(message);
        return;
      }

      const raw = await resp.text();
      let payload: unknown = null;
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch (err: unknown) {
          console.error('Nem sikerült értelmezni az AI válaszát', err, raw);
        }
      }

      const payloadObj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
      const okFlag = payloadObj && typeof payloadObj.ok === 'boolean' ? (payloadObj.ok as boolean) : undefined;
      const errorMessage = payloadObj && typeof payloadObj.error === 'string' ? (payloadObj.error as string) : undefined;
      const sectionsData = payloadObj ? (payloadObj.sections as unknown) : null;

      if (okFlag === false) {
        const msg = errorMessage || `Hiba a generálásnál (${resp.status})`;
        alert(msg);
        return;
      }

      if (sectionsData) {
        if (!isOfferSections(sectionsData)) {
          alert('A struktúrált AI válasz hiányos, próbáld újra a generálást.');
          return;
        }
      }

      router.replace('/dashboard');
    } finally { setLoading(false); }
  }

  const wizardSteps: StepIndicatorStep[] = [
    {
      label: 'Projekt részletek',
      status: step === 1 ? 'current' : step > 1 ? 'completed' : 'upcoming',
      onSelect: () => setStep(1),
    },
    {
      label: 'Tételek',
      status: step === 2 ? 'current' : step > 2 ? 'completed' : 'upcoming',
      onSelect: () => setStep(2),
    },
    {
      label: 'Előnézet & PDF',
      status: step === 3 ? 'current' : 'upcoming',
      onSelect: () => setStep(3),
    },
  ];

  return (
    <AppFrame
      title="Új ajánlat"
      description="Kövesd a háromlépéses varázslót: add meg a projekt részleteit, igazítsd a tételeket, majd generáld le a PDF-et."
    >
      <div className="space-y-8">
        <div className={`${cardClass} space-y-4`}>
          <StepIndicator steps={wizardSteps} />
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              AI asszisztens
            </span>
            <span>Az előnézet néhány másodperc alatt frissül, amint megadod a kulcsadatokat.</span>
          </div>
        </div>

        {step === 1 && (
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className={`${cardClass} space-y-6`}>
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Iparág</span>
                  <select
                    className={inputFieldClass}
                    value={form.industry}
                    onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    onBlur={onBlurTrigger}
                  >
                    {availableIndustries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ajánlat címe</span>
                  <input
                    className={inputFieldClass}
                    placeholder="Pl. Weboldal fejlesztés"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    onBlur={onBlurTrigger}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Rövid projektleírás</span>
                  <textarea
                    className={`${textareaClass} h-32`}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    onBlur={onBlurTrigger}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Határidő</span>
                  <input
                    className={inputFieldClass}
                    value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    onBlur={onBlurTrigger}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Nyelv</span>
                  <select
                    className={inputFieldClass}
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value as Step1Form['language'] }))}
                    onBlur={onBlurTrigger}
                  >
                    <option value="hu">Magyar</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Hangnem</span>
                  <select
                    className={inputFieldClass}
                    value={form.brandVoice}
                    onChange={e => setForm(f => ({ ...f, brandVoice: e.target.value as Step1Form['brandVoice'] }))}
                    onBlur={onBlurTrigger}
                  >
                    <option value="friendly">Barátságos</option>
                    <option value="formal">Formális</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ajánlat stílusa</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: 'compact' as const, label: 'Kompakt', description: 'Tömör, lényegre törő ajánlat' },
                    { value: 'detailed' as const, label: 'Részletes', description: 'Kibontott háttérrel és indoklással' },
                  ].map(option => {
                    const active = form.style === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, style: option.value }))}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        <span className="font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-inherit opacity-80">{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Címzett (opcionális)</p>
                    <p className="text-xs text-slate-500">Elmentjük az ügyfelet, így később gyorsabban kitölthető.</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    className={inputFieldClass}
                    placeholder="Cégnév"
                    value={client.company_name}
                    onChange={(e) => { setClientId(undefined); setClient(c => ({ ...c, company_name: e.target.value })); setShowClientDrop(true); }}
                    onFocus={() => setShowClientDrop(true)}
                  />
                  {showClientDrop && filteredClients.length > 0 && (
                    <div className="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left text-sm hover:bg-slate-50"
                          onMouseDown={() => pickClient(c)}
                        >
                          <span className="font-medium text-slate-700">{c.company_name}</span>
                          {c.email ? <span className="text-xs text-slate-400">{c.email}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputFieldClass}
                    placeholder="Cím"
                    value={client.address || ''}
                    onChange={e => setClient(c => ({ ...c, address: e.target.value }))}
                  />
                  <input
                    className={inputFieldClass}
                    placeholder="Adószám"
                    value={client.tax_id || ''}
                    onChange={e => setClient(c => ({ ...c, tax_id: e.target.value }))}
                  />
                  <input
                    className={inputFieldClass}
                    placeholder="Képviselő neve"
                    value={client.representative || ''}
                    onChange={e => setClient(c => ({ ...c, representative: e.target.value }))}
                  />
                  <input
                    className={inputFieldClass}
                    placeholder="Telefon"
                    value={client.phone || ''}
                    onChange={e => setClient(c => ({ ...c, phone: e.target.value }))}
                  />
                  <input
                    className={`${inputFieldClass} sm:col-span-2`}
                    placeholder="E-mail"
                    value={client.email || ''}
                    onChange={e => setClient(c => ({ ...c, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className={`${cardClass} space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">AI előnézet</h2>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">PDF nézet</span>
              </div>
              {previewError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {previewError}
                </div>
              ) : null}
              <div className="min-h-[260px] rounded-2xl border border-slate-200 bg-white/90 p-4 overflow-auto">
                {previewLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                      <div className="flex flex-col">
                        <span>Az AI most készíti az előnézetet…</span>
                        <span className="text-xs text-slate-400">Kb. {previewCountdown} mp van hátra…</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">Ez néhány másodpercet is igénybe vehet.</p>
                  </div>
                ) : (
                  <>
                    <style dangerouslySetInnerHTML={{ __html: OFFER_DOCUMENT_STYLES }} />
                    <div dangerouslySetInnerHTML={{ __html: previewMarkup }} />
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">Az előnézet automatikusan frissül, amikor befejezed a mezők kitöltését.</p>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            {filteredActivities.length > 0 && (
              <div className={`${cardClass} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">Gyors tétel beszúrása</h2>
                    <p className="text-xs text-slate-500">Iparág: {form.industry}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredActivities.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setRows(r => [{ name: a.name, qty: 1, unit: a.unit || 'db', unitPrice: Number(a.default_unit_price || 0), vat: Number(a.default_vat || 27) }, ...r])}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      + {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <EditablePriceTable rows={rows} onChange={setRows} />
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`${cardClass} space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">AI-szöveg szerkesztése</h2>
                <span className="text-xs font-medium text-slate-400">Ez kerül a PDF-be</span>
              </div>
              <style dangerouslySetInnerHTML={{ __html: OFFER_DOCUMENT_STYLES }} />
              <RichTextEditor
                value={editedHtml || previewHtml}
                onChange={(html) => setEditedHtml(html)}
                placeholder="Formázd át a generált szöveget..."
              />
              <p className="text-xs text-slate-500">Tartsd meg a címsorokat és listákat a jobb olvashatóságért.</p>
            </div>

            <div className={`${cardClass} space-y-4`}>
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Összegzés</h2>
                <p className="mt-1 text-xs text-slate-500">A PDF generálása után az ajánlat megjelenik a listádban.</p>
              </div>
              <dl className="grid gap-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Cím</dt>
                  <dd className="font-medium text-slate-700">{form.title || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Iparág</dt>
                  <dd className="font-medium text-slate-700">{form.industry}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Címzett</dt>
                  <dd className="font-medium text-slate-700">{client.company_name || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Stílus</dt>
                  <dd className="font-medium text-slate-700">{form.style === 'compact' ? 'Kompakt' : 'Részletes'}</dd>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <dt className="text-slate-500">Bruttó összesen</dt>
                  <dd className="text-base font-semibold text-slate-900">{totals.gross.toLocaleString('hu-HU')} Ft</dd>
                </div>
              </dl>
              <button
                onClick={generate}
                disabled={loading}
                className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? 'Generálás…' : 'PDF generálása és mentés'}
              </button>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:border-slate-200 disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:text-slate-300"
          >
            Vissza
          </button>
          {step < 3 && (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Tovább
            </button>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
