'use client';

import { t } from '@/copy';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import EditablePriceTable, { createPriceRow, PriceRow } from '@/components/EditablePriceTable';
import AppFrame from '@/components/AppFrame';
import { summarize } from '@/app/lib/pricing';
import { OFFER_DOCUMENT_STYLES } from '@/app/lib/offerDocument';
import { type SubscriptionPlan } from '@/app/lib/offerTemplates';
import { useSupabase } from '@/components/SupabaseProvider';
import RichTextEditor, { type RichTextEditorHandle } from '@/components/RichTextEditor';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { STREAM_TIMEOUT_MESSAGE } from '@/lib/aiPreview';
import { useToast } from '@/components/ToastProvider';
import { resolveEffectivePlan } from '@/lib/subscription';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  type ProjectDetailKey,
  type ProjectDetails,
} from '@/lib/projectDetails';

type Step1Form = {
  industry: string;
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: 'hu' | 'en';
  brandVoice: 'friendly' | 'formal';
  style: 'compact' | 'detailed';
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};
type Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
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

type OfferImageAsset = {
  key: string;
  name: string;
  dataUrl: string;
  alt: string;
  size: number;
  mime: string;
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
      isStringArray(key as keyof OfferSections),
    )
  );
}

const PROJECT_DETAIL_FIELDS: ProjectDetailKey[] = [
  'overview',
  'deliverables',
  'timeline',
  'constraints',
];
const PROJECT_DETAIL_LIMITS: Record<ProjectDetailKey, number> = {
  overview: 600,
  deliverables: 400,
  timeline: 400,
  constraints: 400,
};
const MAX_PREVIEW_TIMEOUT_RETRIES = 2;
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_SIZE_MB = Math.round((MAX_IMAGE_SIZE_BYTES / (1024 * 1024)) * 10) / 10;

type PreparedImagePayload = { key: string; dataUrl: string; alt: string };

function prepareImagesForSubmission(
  html: string,
  assets: OfferImageAsset[],
): {
  html: string;
  images: PreparedImagePayload[];
} {
  const source = html || '';
  if (assets.length === 0 || source.trim().length === 0) {
    return { html: source, images: [] };
  }

  if (typeof document === 'undefined') {
    return { html: source, images: [] };
  }

  const template = document.createElement('template');
  template.innerHTML = source;
  const assetMap = new Map(assets.map((asset) => [asset.key, asset]));
  const usedImages: PreparedImagePayload[] = [];

  const nodes = template.content.querySelectorAll<HTMLImageElement>('img');
  nodes.forEach((node) => {
    const key = node.getAttribute('data-offer-image-key');
    if (!key) {
      node.remove();
      return;
    }
    const asset = assetMap.get(key);
    if (!asset) {
      node.remove();
      return;
    }
    node.removeAttribute('src');
    node.setAttribute('data-offer-image-key', key);
    if (asset.alt) {
      node.setAttribute('alt', asset.alt);
    } else {
      node.removeAttribute('alt');
    }
    usedImages.push({ key, dataUrl: asset.dataUrl, alt: asset.alt });
  });

  return { html: template.innerHTML, images: usedImages };
}

export default function NewOfferWizard() {
  const sb = useSupabase();
  const router = useRouter();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');

  const [availableIndustries, setAvailableIndustries] = useState<string[]>([
    'Marketing',
    'Informatika',
    'Építőipar',
    'Tanácsadás',
    'Szolgáltatás',
  ]);

  // 1) alapok
  const [form, setForm] = useState<Step1Form>({
    industry: 'Marketing',
    title: '',
    projectDetails: { ...emptyProjectDetails },
    deadline: '',
    language: 'hu',
    brandVoice: 'friendly',
    style: 'detailed',
  });
  const [detailsTipsOpen, setDetailsTipsOpen] = useState(false);

  // 1/b) címzett (opcionális) + autocomplete
  const [client, setClient] = useState<ClientForm>({ company_name: '' });
  const [clientList, setClientList] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string | undefined>(undefined);
  const [showClientDrop, setShowClientDrop] = useState(false);

  // 2) tevékenységek / árlista
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([
    createPriceRow({ name: 'Konzultáció', qty: 1, unit: 'óra', unitPrice: 15000, vat: 27 }),
  ]);

  // preview
  const [previewHtml, setPreviewHtml] = useState<string>(
    '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>',
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLocked, setPreviewLocked] = useState(false);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);

  // edit on step 3
  const [editedHtml, setEditedHtml] = useState<string>('');
  const richTextEditorRef = useRef<RichTextEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageAssets, setImageAssets] = useState<OfferImageAsset[]>([]);
  const isProPlan = plan === 'pro';

  // auth + preload
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    let active = true;

    (async () => {
      const { data: prof } = await sb
        .from('profiles')
        .select(
          'industries, company_name, brand_color_primary, brand_color_secondary, brand_logo_url, plan, offer_template',
        )
        .eq('id', user.id)
        .maybeSingle();
      if (!active) {
        return;
      }
      if (prof?.industries?.length) {
        setAvailableIndustries(prof.industries);
        setForm((f) => ({ ...f, industry: prof.industries?.[0] ?? f.industry }));
      }
      const normalizedPlan = resolveEffectivePlan(prof?.plan ?? null);
      setPlan(normalizedPlan);

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
    setImageAssets((prev) => {
      if (!prev.length) {
        return prev;
      }
      const source = (editedHtml || previewHtml || '').trim();
      if (!source) {
        return [];
      }
      const template = document.createElement('template');
      template.innerHTML = source;
      const keys = new Set(
        Array.from(template.content.querySelectorAll('img[data-offer-image-key]'))
          .map((node) => node.getAttribute('data-offer-image-key'))
          .filter((value): value is string => typeof value === 'string' && value.length > 0),
      );
      const filtered = prev.filter((asset) => keys.has(asset.key));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [editedHtml, previewHtml]);

  useEffect(() => {
    return () => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
      }
    };
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) => (a.industries || []).length === 0 || a.industries.includes(form.industry),
    );
  }, [activities, form.industry]);
  const projectDetailsText = useMemo(() => {
    const normalized = projectDetailFields.reduce<ProjectDetails>(
      (acc, key) => {
        acc[key] = form.projectDetails[key].trim();
        return acc;
      },
      { ...emptyProjectDetails },
    );

    return formatProjectDetailsForPrompt(normalized);
  }, [form.projectDetails]);
  const hasPreviewInputs = form.title.trim().length > 0 && projectDetailsText.trim().length > 0;
  const imageLimitReached = imageAssets.length >= MAX_IMAGE_COUNT;

  // === Autocomplete (cég) ===
  const filteredClients = useMemo(() => {
    const q = (client.company_name || '').toLowerCase();
    if (!q) return clientList.slice(0, 8);
    return clientList.filter((c) => c.company_name.toLowerCase().includes(q)).slice(0, 8);
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
    if (previewLocked) {
      return;
    }

    const hasTitle = form.title.trim().length > 0;
    const hasDescription = projectDetailsText.trim().length > 0;
    if (!hasTitle || !hasDescription) {
      setPreviewLoading(false);
      return;
    }

    type AttemptResult =
      | { status: 'success' }
      | { status: 'timeout'; message: string }
      | { status: 'error'; message: string }
      | { status: 'aborted' };

    const runAttempt = async (): Promise<AttemptResult> => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
        previewAbortRef.current = null;
      }

      const nextRequestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = nextRequestId;

      const controller = new AbortController();
      previewAbortRef.current = controller;

      try {
        const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
          (acc, key) => {
            acc[key] = form.projectDetails[key].trim();
            return acc;
          },
          { ...emptyProjectDetails },
        );

        const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: form.industry,
            title: form.title,
            projectDetails: normalizedDetails,
            deadline: form.deadline,
            language: form.language,
            brandVoice: form.brandVoice,
            style: form.style,
          }),
          signal: controller.signal,
          authErrorMessage: t('errors.preview.authError'),
          errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
          defaultErrorMessage: t('errors.preview.fetchUnknown'),
        });

        if (!resp.body) {
          const message = t('errors.preview.noData');
          if (previewRequestIdRef.current === nextRequestId) {
            setPreviewHtml('<p>(nincs előnézet)</p>');
            setPreviewLocked(false);
          }
          return { status: 'error', message };
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
              const payload = JSON.parse(jsonPart) as {
                type?: string;
                html?: string;
                message?: string;
              };
              if (payload.type === 'delta' || payload.type === 'done') {
                if (typeof payload.html === 'string') {
                  latestHtml = payload.html;
                  if (previewRequestIdRef.current === nextRequestId) {
                    setPreviewHtml(payload.html || '<p>(nincs előnézet)</p>');
                    if (payload.type === 'done') {
                      setEditedHtml((prev) => prev || payload.html || '');
                      setPreviewLocked(true);
                    }
                  }
                }
              } else if (payload.type === 'error') {
                streamErrorMessage =
                  typeof payload.message === 'string' && payload.message.trim().length > 0
                    ? payload.message
                    : t('errors.preview.streamUnknown');
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
            setPreviewLocked(false);
          }
          if (streamErrorMessage === STREAM_TIMEOUT_MESSAGE) {
            return { status: 'timeout', message: streamErrorMessage };
          }
          return { status: 'error', message: streamErrorMessage };
        }

        if (!latestHtml && previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
        }

        return { status: 'success' };
      } catch (error) {
        if (isAbortError(error)) {
          return { status: 'aborted' };
        }
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t('errors.preview.fetchUnknown');
        console.error('Előnézet hiba:', message, error);
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewHtml('<p>(nincs előnézet)</p>');
          setPreviewLocked(false);
        }
        return { status: 'error', message };
      } finally {
        if (previewAbortRef.current === controller) {
          previewAbortRef.current = null;
        }
      }
    };

    setPreviewLoading(true);

    try {
      for (let attempt = 0; attempt <= MAX_PREVIEW_TIMEOUT_RETRIES; attempt += 1) {
        const result = await runAttempt();
        if (result.status === 'success') {
          return;
        }
        if (result.status === 'aborted') {
          return;
        }
        if (result.status === 'timeout') {
          if (attempt < MAX_PREVIEW_TIMEOUT_RETRIES) {
            const retryIndex = attempt + 1;
            const totalAttempts = MAX_PREVIEW_TIMEOUT_RETRIES + 1;
            showToast({
              title: t('toasts.preview.retrying.title'),
              description: `${result.message} ${t('toasts.preview.retrying.description', {
                current: retryIndex,
                total: totalAttempts,
              })}`,
              variant: 'warning',
            });
            continue;
          }
          const finalMessage = `${result.message} ${t('toasts.preview.finalFailureSuffix')}`;
          showToast({
            title: t('toasts.preview.error.title'),
            description: finalMessage,
            variant: 'error',
          });
          return;
        }
        if (result.status === 'error') {
          if (result.message) {
            showToast({
              title: t('toasts.preview.error.title'),
              description: result.message,
              variant: 'error',
            });
          }
          return;
        }
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [
    form.brandVoice,
    form.deadline,
    form.projectDetails,
    form.industry,
    form.language,
    form.style,
    form.title,
    previewLocked,
    projectDetailsText,
    showToast,
  ]);

  const handleGeneratePreview = useCallback(() => {
    if (previewLocked) {
      return;
    }
    if (!hasPreviewInputs) {
      showToast({
        title: t('toasts.preview.missingData.title'),
        description: t('toasts.preview.missingData.description'),
        variant: 'warning',
      });
      return;
    }
    void callPreview();
  }, [callPreview, hasPreviewInputs, previewLocked, showToast]);

  useEffect(() => {
    if (step !== 3) {
      return;
    }
    if (previewLocked || previewLoading || !hasPreviewInputs) {
      return;
    }
    void callPreview();
  }, [callPreview, hasPreviewInputs, previewLoading, previewLocked, step]);

  const handlePickImage = useCallback(() => {
    if (!isProPlan) {
      openPlanUpgradeDialog({
        description: t('app.planUpgradeModal.reasons.previewImages'),
      });
      return;
    }
    if (!previewLocked) {
      showToast({
        title: t('toasts.preview.requiresInitialPreview.title'),
        description: t('toasts.preview.requiresInitialPreview.description'),
        variant: 'info',
      });
      return;
    }
    fileInputRef.current?.click();
  }, [isProPlan, openPlanUpgradeDialog, previewLocked, showToast]);

  const handleImageInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }
      if (!isProPlan) {
        openPlanUpgradeDialog({
          description: t('app.planUpgradeModal.reasons.previewImages'),
        });
        event.target.value = '';
        return;
      }
      if (!previewLocked) {
        event.target.value = '';
        return;
      }

      const remainingSlots = MAX_IMAGE_COUNT - imageAssets.length;
      if (remainingSlots <= 0) {
        showToast({
          title: t('toasts.preview.limitReached.title'),
          description: t('toasts.preview.limitReached.description', { count: MAX_IMAGE_COUNT }),
          variant: 'warning',
        });
        event.target.value = '';
        return;
      }

      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const newAssets: OfferImageAsset[] = [];

      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          showToast({
            title: t('toasts.preview.invalidImageType.title'),
            description: t('toasts.preview.invalidImageType.description', { name: file.name }),
            variant: 'error',
          });
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          showToast({
            title: t('toasts.preview.imageTooLarge.title'),
            description: t('toasts.preview.imageTooLarge.description', {
              name: file.name,
              size: MAX_IMAGE_SIZE_MB,
            }),
            variant: 'error',
          });
          continue;
        }

        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('read-error'));
            reader.readAsDataURL(file);
          });
          const key = crypto.randomUUID();
          const baseAlt = file.name.replace(/\.[^/.]+$/, '').trim() || 'Kép';
          newAssets.push({
            key,
            name: file.name,
            dataUrl,
            alt: baseAlt.slice(0, 80),
            size: file.size,
            mime: file.type || 'image/png',
          });
        } catch (error) {
          console.error('Nem sikerült beolvasni a képet', error);
          showToast({
            title: t('toasts.preview.imageReadError.title'),
            description: t('toasts.preview.imageReadError.description', { name: file.name }),
            variant: 'error',
          });
        }
      }

      if (newAssets.length) {
        setImageAssets((prev) => [...prev, ...newAssets]);
        newAssets.forEach((asset) => {
          richTextEditorRef.current?.insertImage({
            src: asset.dataUrl,
            alt: asset.alt,
            dataKey: asset.key,
          });
        });
      }

      event.target.value = '';
    },
    [
      imageAssets.length,
      isProPlan,
      openPlanUpgradeDialog,
      previewLocked,
      richTextEditorRef,
      showToast,
    ],
  );

  const handleRemoveImage = useCallback((key: string) => {
    setImageAssets((prev) => prev.filter((asset) => asset.key !== key));
    richTextEditorRef.current?.removeImageByKey(key);
  }, []);

  const totals = useMemo(() => summarize(rows), [rows]);

  async function ensureClient(): Promise<string | undefined> {
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
      if (!previewLocked) {
        showToast({
          title: t('toasts.preview.backgroundGeneration.title'),
          description: t('toasts.preview.backgroundGeneration.description'),
          variant: 'info',
        });
      }
      setLoading(true);
      const cid = await ensureClient();
      let resp: Response;
      const baseHtml = previewLocked ? (editedHtml || previewHtml || '').trim() : '';
      let htmlForApi = baseHtml;
      let imagePayload: PreparedImagePayload[] = [];
      if (previewLocked && isProPlan && imageAssets.length > 0) {
        const prepared = prepareImagesForSubmission(baseHtml, imageAssets);
        htmlForApi = prepared.html;
        imagePayload = prepared.images;
      }
      try {
        const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
          (acc, key) => {
            acc[key] = form.projectDetails[key].trim();
            return acc;
          },
          { ...emptyProjectDetails },
        );

        resp = await fetchWithSupabaseAuth('/api/ai-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            industry: form.industry,
            projectDetails: normalizedDetails,
            deadline: form.deadline,
            language: form.language,
            brandVoice: form.brandVoice,
            style: form.style,
            prices: rows,
            aiOverrideHtml: htmlForApi,
            clientId: cid,
            imageAssets: imagePayload,
          }),
          authErrorMessage: t('errors.auth.notLoggedIn'),
          errorMessageBuilder: (status) => t('errors.offer.generateStatus', { status }),
          defaultErrorMessage: t('errors.offer.generateUnknown'),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          alert(t('errors.auth.notLoggedIn'));
          router.replace('/login');
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t('errors.offer.generateUnknown');
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

      const payloadObj =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
      const okFlag =
        payloadObj && typeof payloadObj.ok === 'boolean' ? (payloadObj.ok as boolean) : undefined;
      const errorMessage =
        payloadObj && typeof payloadObj.error === 'string'
          ? (payloadObj.error as string)
          : undefined;
      const sectionsData = payloadObj ? (payloadObj.sections as unknown) : null;

      if (okFlag === false) {
        const msg = errorMessage || t('errors.offer.generateStatus', { status: resp.status });
        alert(msg);
        return;
      }

      if (sectionsData) {
        if (!isOfferSections(sectionsData)) {
          alert(t('errors.offer.missingStructure'));
          return;
        }
      }

      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  const goToStep = useCallback(
    (nextStep: number) => {
      const clampedStep = Math.max(1, Math.min(3, nextStep));
      if (step === 1 && clampedStep > 1) {
        handleGeneratePreview();
      }
      setStep(clampedStep);
    },
    [handleGeneratePreview, step],
  );

  const wizardSteps: StepIndicatorStep[] = [
    {
      label: t('offers.wizard.steps.details'),
      status: step === 1 ? 'current' : step > 1 ? 'completed' : 'upcoming',
      onSelect: () => goToStep(1),
    },
    {
      label: t('offers.wizard.steps.pricing'),
      status: step === 2 ? 'current' : step > 2 ? 'completed' : 'upcoming',
      onSelect: () => goToStep(2),
    },
    {
      label: t('offers.wizard.steps.previewPdf'),
      status: step === 3 ? 'current' : 'upcoming',
      onSelect: () => goToStep(3),
    },
  ];

  return (
    <AppFrame title={t('offers.wizard.pageTitle')} description={t('offers.wizard.pageDescription')}>
      <div className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div
            className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-slate-500/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-slate-700/40 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {t('offers.wizard.hero.badge')}
              </span>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t('offers.wizard.hero.title')}
                </p>
                <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
                  {t('offers.wizard.hero.description')}
                </p>
              </div>
            </div>
            <dl className="grid gap-4 text-left text-xs text-slate-200 sm:grid-cols-3 sm:text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner backdrop-blur">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  {t('offers.wizard.hero.highlights.guided.title')}
                </dt>
                <dd className="mt-2 text-base font-semibold text-white sm:text-lg">
                  {t('offers.wizard.hero.highlights.guided.value')}
                </dd>
                <dd className="mt-1 text-[13px] text-slate-200/80">
                  {t('offers.wizard.hero.highlights.guided.subtitle')}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner backdrop-blur">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  {t('offers.wizard.hero.highlights.preview.title')}
                </dt>
                <dd className="mt-2 text-base font-semibold text-white sm:text-lg">
                  {t('offers.wizard.hero.highlights.preview.value')}
                </dd>
                <dd className="mt-1 text-[13px] text-slate-200/80">
                  {t('offers.wizard.hero.highlights.preview.subtitle')}
                </dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner backdrop-blur">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  {t('offers.wizard.hero.highlights.delivery.title')}
                </dt>
                <dd className="mt-2 text-base font-semibold text-white sm:text-lg">
                  {t('offers.wizard.hero.highlights.delivery.value')}
                </dd>
                <dd className="mt-1 text-[13px] text-slate-200/80">
                  {t('offers.wizard.hero.highlights.delivery.subtitle')}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <Card className="space-y-6 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-7">
          <StepIndicator steps={wizardSteps} />
        </Card>

        {step === 1 && (
          <section className="space-y-6">
            <Card className="space-y-8 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-8 md:space-y-10">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('offers.wizard.steps.details')}
                </h2>
                <p className="text-sm text-slate-600">
                  {t('offers.wizard.forms.details.sections.overviewHint')}
                </p>
              </div>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t('offers.wizard.forms.details.sections.style')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('offers.wizard.forms.details.sections.styleHelper')}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      value: 'compact' as const,
                      label: t('offers.wizard.forms.details.styleOptions.compact.label'),
                      description: t(
                        'offers.wizard.forms.details.styleOptions.compact.description',
                      ),
                    },
                    {
                      value: 'detailed' as const,
                      label: t('offers.wizard.forms.details.styleOptions.detailed.label'),
                      description: t(
                        'offers.wizard.forms.details.styleOptions.detailed.description',
                      ),
                    },
                  ].map((option) => {
                    const active = form.style === option.value;
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, style: option.value }))}
                        className={`flex h-full w-full flex-col items-start gap-1 rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                            : 'border-border/70 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                        }`}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs text-current/80">{option.description}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t('offers.wizard.forms.details.sections.overview')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('offers.wizard.forms.details.sections.overviewHelper')}
                  </p>
                </div>
                <div className="grid gap-6">
                  {form.style === 'detailed' ? (
                    <Select
                      label={t('offers.wizard.forms.details.industryLabel')}
                      value={form.industry}
                      onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    >
                      {availableIndustries.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </Select>
                  ) : null}

                  <Input
                    label={t('offers.wizard.forms.details.titleLabel')}
                    placeholder={t('offers.wizard.forms.details.titlePlaceholder')}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />

                  <Textarea
                    label={t('offers.wizard.forms.details.descriptionLabel')}
                    placeholder={t('offers.wizard.forms.details.descriptionPlaceholder')}
                    value={form.projectDetails.overview}
                    maxLength={PROJECT_DETAIL_LIMITS.overview}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        projectDetails: {
                          ...f.projectDetails,
                          overview: e.target.value,
                        },
                      }))
                    }
                  />

                  {form.style === 'detailed' ? (
                    <div className="space-y-4">
                      <div className="space-y-4 rounded-2xl border border-border/70 bg-white/70 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-fg">
                              {t('offers.wizard.forms.details.tips.title')}
                            </p>
                            <p className="text-xs text-fg-muted">
                              {t('offers.wizard.forms.details.tips.subtitle')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailsTipsOpen((value) => !value)}
                            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg transition hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {detailsTipsOpen
                              ? t('offers.wizard.forms.details.tips.hide')
                              : t('offers.wizard.forms.details.tips.show')}
                          </button>
                        </div>
                        {detailsTipsOpen && (
                          <ul className="list-disc space-y-2 pl-5 text-xs text-fg-muted">
                            <li>{t('offers.wizard.forms.details.tips.items.overview')}</li>
                            <li>{t('offers.wizard.forms.details.tips.items.deliverables')}</li>
                            <li>{t('offers.wizard.forms.details.tips.items.timeline')}</li>
                            <li>{t('offers.wizard.forms.details.tips.items.constraints')}</li>
                          </ul>
                        )}
                      </div>

                      {PROJECT_DETAIL_FIELDS.filter((field) => field !== 'overview').map(
                        (field) => (
                          <Textarea
                            key={field}
                            value={form.projectDetails[field]}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                projectDetails: {
                                  ...prev.projectDetails,
                                  [field]: event.target.value,
                                },
                              }))
                            }
                            label={t(`offers.wizard.forms.details.fields.${field}.label` as const)}
                            placeholder={t(
                              `offers.wizard.forms.details.fields.${field}.placeholder` as const,
                            )}
                            help={t(`offers.wizard.forms.details.fields.${field}.help` as const)}
                            maxLength={PROJECT_DETAIL_LIMITS[field]}
                            showCounter
                            className="min-h-[7.5rem]"
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              </section>

              {form.style === 'detailed' ? (
                <section className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {t('offers.wizard.forms.details.sections.scope')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('offers.wizard.forms.details.sections.scopeHelper')}
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <Input
                      label={t('offers.wizard.forms.details.deadlineLabel')}
                      value={form.deadline}
                      onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                    />
                    <Select
                      label={t('offers.wizard.forms.details.languageLabel')}
                      value={form.language}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          language: e.target.value as Step1Form['language'],
                        }))
                      }
                    >
                      <option value="hu">
                        {t('offers.wizard.forms.details.languageOptions.hu')}
                      </option>
                      <option value="en">
                        {t('offers.wizard.forms.details.languageOptions.en')}
                      </option>
                    </Select>
                    <Select
                      label={t('offers.wizard.forms.details.voiceLabel')}
                      value={form.brandVoice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          brandVoice: e.target.value as Step1Form['brandVoice'],
                        }))
                      }
                    >
                      <option value="friendly">
                        {t('offers.wizard.forms.details.voiceOptions.friendly')}
                      </option>
                      <option value="formal">
                        {t('offers.wizard.forms.details.voiceOptions.formal')}
                      </option>
                    </Select>
                  </div>
                </section>
              ) : null}

              <section className="space-y-5 rounded-2xl border border-dashed border-border/70 bg-slate-50/80 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {t('offers.wizard.forms.details.sections.client')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('offers.wizard.forms.details.sections.clientHelper')}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    label={t('offers.wizard.forms.details.clientLookupLabel')}
                    placeholder={t('offers.wizard.forms.details.clientLookupPlaceholder')}
                    value={client.company_name}
                    onChange={(e) => {
                      setClientId(undefined);
                      setClient((c) => ({ ...c, company_name: e.target.value }));
                      setShowClientDrop(true);
                    }}
                    onFocus={() => setShowClientDrop(true)}
                  />
                  {showClientDrop && filteredClients.length > 0 && (
                    <div className="absolute z-10 mt-2 max-h-52 w-full overflow-auto rounded-2xl border border-border/70 bg-white shadow-xl">
                      {filteredClients.map((c) => (
                        <Button
                          key={c.id}
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 rounded-none border-none px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          onMouseDown={() => pickClient(c)}
                        >
                          <span className="font-medium text-slate-700">{c.company_name}</span>
                          {c.email ? (
                            <span className="text-xs text-slate-500">{c.email}</span>
                          ) : null}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label={t('offers.wizard.forms.details.clientFieldAddress')}
                    placeholder={t('offers.wizard.forms.details.clientFieldAddress')}
                    value={client.address || ''}
                    onChange={(e) => setClient((c) => ({ ...c, address: e.target.value }))}
                  />
                  <Input
                    label={t('offers.wizard.forms.details.clientFieldTax')}
                    placeholder={t('offers.wizard.forms.details.clientFieldTax')}
                    value={client.tax_id || ''}
                    onChange={(e) => setClient((c) => ({ ...c, tax_id: e.target.value }))}
                  />
                  <Input
                    label={t('offers.wizard.forms.details.clientFieldRepresentative')}
                    placeholder={t('offers.wizard.forms.details.clientFieldRepresentative')}
                    value={client.representative || ''}
                    onChange={(e) => setClient((c) => ({ ...c, representative: e.target.value }))}
                  />
                  <Input
                    label={t('offers.wizard.forms.details.clientFieldPhone')}
                    placeholder={t('offers.wizard.forms.details.clientFieldPhone')}
                    value={client.phone || ''}
                    onChange={(e) => setClient((c) => ({ ...c, phone: e.target.value }))}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t('offers.wizard.forms.details.clientFieldEmail')}
                      placeholder={t('offers.wizard.forms.details.clientFieldEmail')}
                      value={client.email || ''}
                      onChange={(e) => setClient((c) => ({ ...c, email: e.target.value }))}
                    />
                  </div>
                </div>
              </section>
            </Card>
          </section>
        )}
        {step === 2 && (
          <section className="space-y-6">
            {filteredActivities.length > 0 && (
              <Card className="space-y-4 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {t('offers.wizard.forms.details.quickInsertTitle')}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('offers.wizard.forms.details.quickInsertIndustryLabel')}: {form.industry}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    {filteredActivities.length} tétel
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredActivities.map((a) => (
                    <Button
                      key={a.id}
                      type="button"
                      onClick={() =>
                        setRows((r) => [
                          createPriceRow({
                            name: a.name,
                            qty: 1,
                            unit: a.unit || 'db',
                            unitPrice: Number(a.default_unit_price || 0),
                            vat: Number(a.default_vat || 27),
                          }),
                          ...r,
                        ])
                      }
                      className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      + {a.name}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            <EditablePriceTable rows={rows} onChange={setRows} />
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-6 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">AI-szöveg szerkesztése</h2>
                  <p className="text-xs text-slate-500">
                    Ez a tartalom kerül a PDF-be – finomhangold bátran.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Élő előnézet
                </span>
              </div>
              <style dangerouslySetInnerHTML={{ __html: OFFER_DOCUMENT_STYLES }} />
              <RichTextEditor
                ref={richTextEditorRef}
                value={editedHtml || previewHtml}
                onChange={(html) => setEditedHtml(html)}
                placeholder={t('richTextEditor.placeholderHint')}
              />
              <p className="text-xs text-slate-500">{t('richTextEditor.placeholderReminder')}</p>
              {isProPlan ? (
                <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Képek a PDF-hez</p>
                      <p className="text-xs text-slate-500">
                        Legfeljebb {MAX_IMAGE_COUNT} kép tölthető fel, {MAX_IMAGE_SIZE_MB} MB
                        fájlméretig.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handlePickImage}
                      disabled={imageLimitReached || !previewLocked || previewLoading}
                      className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
                    >
                      Kép beszúrása
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageInputChange}
                  />
                  {!previewLocked ? (
                    <p className="text-xs text-slate-500">
                      Előbb generáld le az AI előnézetet, utána adhatod hozzá a képeket.
                    </p>
                  ) : null}
                  {imageAssets.length > 0 ? (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {imageAssets.map((asset) => {
                        const sizeKb = Math.max(1, Math.ceil(asset.size / 1024));
                        return (
                          <li
                            key={asset.key}
                            className="flex gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-sm"
                          >
                            <img
                              src={asset.dataUrl}
                              alt={asset.alt}
                              className="h-16 w-16 rounded-lg object-cover shadow-sm"
                            />
                            <div className="flex flex-1 flex-col justify-between text-xs text-slate-500">
                              <div>
                                <p className="font-semibold text-slate-700">{asset.name}</p>
                                <p className="mt-0.5">
                                  {sizeKb} KB • alt: {asset.alt}
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleRemoveImage(asset.key)}
                                className="self-start text-xs font-semibold text-rose-600 transition hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                Eltávolítás
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Még nem adtál hozzá képeket. A beszúrt képek csak a kész PDF-ben jelennek meg.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-slate-50/60 p-5">
                  <p className="text-xs text-slate-500">
                    {t('richTextEditor.imageSection.proUpsell')}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      openPlanUpgradeDialog({
                        description: t('app.planUpgradeModal.reasons.previewImages'),
                      })
                    }
                    className="self-start"
                  >
                    {t('app.planUpgradeModal.primaryCta')}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="space-y-5 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-7">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Összegzés</h2>
                <p className="mt-1 text-xs text-slate-500">
                  A PDF generálása után az ajánlat megjelenik a listádban.
                </p>
              </div>
              <dl className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Cím</dt>
                  <dd className="font-medium text-slate-800">{form.title || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Iparág</dt>
                  <dd className="font-medium text-slate-800">{form.industry}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Címzett</dt>
                  <dd className="font-medium text-slate-800">{client.company_name || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Stílus</dt>
                  <dd className="font-medium text-slate-800">
                    {form.style === 'compact' ? 'Kompakt' : 'Részletes'}
                  </dd>
                </div>
              </dl>
              <div className="rounded-2xl border border-border/70 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Bruttó összesen</span>
                  <span className="text-base font-semibold text-slate-900">
                    {totals.gross.toLocaleString('hu-HU')} Ft
                  </span>
                </div>
              </div>
              <Button
                onClick={generate}
                disabled={loading}
                className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? 'Generálás…' : 'PDF generálása és mentés'}
              </Button>
            </Card>
          </section>
        )}

        <div className="sticky bottom-0 left-0 right-0 z-30 -mx-6 -mb-6 border-t border-border/70 bg-white/95 px-6 py-4 shadow-[0_-12px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-full border border-border/70 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:border-border disabled:text-slate-300"
            >
              Vissza
            </Button>
            {step < 3 && (
              <Button
                onClick={() => goToStep(step + 1)}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-200"
              >
                Tovább
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
