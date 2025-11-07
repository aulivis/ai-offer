'use client';

import { t } from '@/copy';
import {
  ChangeEvent,
  FormEvent,
  SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import EditablePriceTable, { createPriceRow, PriceRow } from '@/components/EditablePriceTable';
import AppFrame from '@/components/AppFrame';
import { WizardStep1Details } from '@/components/offers/WizardStep1Details';
import { WizardStep2Pricing } from '@/components/offers/WizardStep2Pricing';
import { WizardActionBar } from '@/components/offers/WizardActionBar';
import { useWizardValidation } from '@/hooks/useWizardValidation';
import { useWizardKeyboardShortcuts } from '@/hooks/useWizardKeyboardShortcuts';
import { useRealTimeValidation } from '@/hooks/useRealTimeValidation';
import { useOfferForm } from '@/hooks/useOfferForm';
import { useClientAutocomplete } from '@/hooks/useClientAutocomplete';
import { useQuotaManagement } from '@/hooks/useQuotaManagement';
import { summarize } from '@/app/lib/pricing';
import {
  DEFAULT_OFFER_TEMPLATE_ID,
  normalizeTemplateId,
  type SubscriptionPlan,
} from '@/app/lib/offerTemplates';
import type { TemplateId } from '@/app/pdf/templates/types';
import type { WizardStep } from '@/types/wizard';
import { useSupabase } from '@/components/SupabaseProvider';
import RichTextEditor, { type RichTextEditorHandle } from '@/components/RichTextEditor';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { STREAM_TIMEOUT_MESSAGE } from '@/lib/aiPreview';
import { useToast } from '@/components/ToastProvider';
import { resolveEffectivePlan } from '@/lib/subscription';
import { currentMonthStart } from '@/lib/services/usage';
import { getBrandLogoUrl } from '@/lib/branding';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import { listTemplates } from '@/app/pdf/templates/engineRegistry';
import type { OfferTemplate, TemplateTier } from '@/app/pdf/templates/types';
import {
  emptyProjectDetails,
  formatProjectDetailsForPrompt,
  projectDetailFields,
  type ProjectDetailKey,
  type ProjectDetails,
} from '@/lib/projectDetails';
import { useIframeAutoHeight } from '@/hooks/useIframeAutoHeight';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WIZARD_CONFIG, MAX_IMAGE_SIZE_MB } from '@/constants/wizard';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { PreviewMarginGuides } from '@/components/offers/PreviewMarginGuides';
import { WizardProgressIndicator } from '@/components/offers/WizardProgressIndicator';
import { DraftSaveIndicator } from '@/components/offers/DraftSaveIndicator';
import { SkeletonLoader, PreviewSkeletonLoader } from '@/components/offers/SkeletonLoader';
import { FullscreenPreviewModal } from '@/components/offers/FullscreenPreviewModal';

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

function LockBadgeIcon(props: SVGProps<SVGSVGElement>) {
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

type QuotaSnapshot = {
  limit: number | null;
  used: number;
  pending: number;
  periodStart: string | null;
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
const MAX_PREVIEW_TIMEOUT_RETRIES = WIZARD_CONFIG.MAX_PREVIEW_RETRIES;
const MAX_IMAGE_COUNT = WIZARD_CONFIG.MAX_IMAGE_COUNT;
const MAX_IMAGE_SIZE_BYTES = WIZARD_CONFIG.MAX_IMAGE_SIZE_BYTES;


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

const DEFAULT_PREVIEW_PLACEHOLDER_HTML =
  '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>';

const DEFAULT_FREE_TEMPLATE_ID: TemplateId = 'free.minimal@1.0.0';

type OfferTextTemplatePayload = {
  industry: string;
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: Step1Form['language'];
  brandVoice: Step1Form['brandVoice'];
  style: Step1Form['style'];
};

type OfferTextTemplate = OfferTextTemplatePayload & {
  id: string;
  name: string;
  updatedAt: string | null;
};

function normalizeTemplateProjectDetails(value: unknown): ProjectDetails | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const input = value as Record<string, unknown>;
  const normalized = { ...emptyProjectDetails };

  for (const key of projectDetailFields) {
    const raw = input[key];
    normalized[key] = typeof raw === 'string' ? raw : '';
  }

  return normalized;
}

function parseTemplatePayload(value: unknown): OfferTextTemplatePayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const projectDetails = normalizeTemplateProjectDetails(obj.projectDetails);
  if (!projectDetails) {
    return null;
  }

  const language = obj.language === 'hu' || obj.language === 'en' ? obj.language : 'hu';
  const brandVoice =
    obj.brandVoice === 'friendly' || obj.brandVoice === 'formal' ? obj.brandVoice : 'friendly';
  const style = obj.style === 'compact' || obj.style === 'detailed' ? obj.style : 'detailed';

  return {
    industry: typeof obj.industry === 'string' ? obj.industry : '',
    title: typeof obj.title === 'string' ? obj.title : '',
    projectDetails,
    deadline: typeof obj.deadline === 'string' ? obj.deadline : '',
    language,
    brandVoice,
    style,
  };
}

function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}

function parseTemplateRow(row: {
  id?: unknown;
  name?: unknown;
  payload?: unknown;
  updated_at?: unknown;
}): OfferTextTemplate | null {
  if (typeof row.id !== 'string' || typeof row.name !== 'string') {
    return null;
  }

  const payload = parseTemplatePayload(row.payload);
  if (!payload) {
    return null;
  }

  const updatedAt = typeof row.updated_at === 'string' ? row.updated_at : null;

  return {
    id: row.id,
    name: row.name,
    updatedAt,
    ...payload,
  };
}

function sortTemplates(list: OfferTextTemplate[]): OfferTextTemplate[] {
  return [...list].sort((a, b) => {
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    if (aTime !== bTime) {
      return bTime - aTime;
    }
    return a.name.localeCompare(b.name, 'hu');
  });
}

export default function NewOfferWizard() {
  const sb = useSupabase();
  const router = useRouter();
  const { status: authStatus, user } = useRequireAuth();
  const { showToast } = useToast();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const { validateStep1, validateStep2 } = useWizardValidation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>('free');
  const [profileCompanyName, setProfileCompanyName] = useState('');
  const [pdfBranding, setPdfBranding] = useState<{
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
  }>({
    primaryColor: null,
    secondaryColor: null,
    logoUrl: null,
  });
  const [selectedPdfTemplateId, setSelectedPdfTemplateId] = useState<TemplateId | null>(null);

  const allPdfTemplates = useMemo(
    () => listTemplates() as Array<OfferTemplate & { legacyId?: string }>,
    [],
  );
  const userTemplateTier = planToTemplateTier(plan);
  const availablePdfTemplates = useMemo(() => {
    if (userTemplateTier === 'premium') {
      return allPdfTemplates;
    }
    return allPdfTemplates.filter((template) => template.tier === 'free');
  }, [allPdfTemplates, userTemplateTier]);
  const lockedPdfTemplates = useMemo(() => {
    if (userTemplateTier === 'premium') {
      return [] as Array<OfferTemplate>;
    }
    return allPdfTemplates.filter((template) => template.tier === 'premium');
  }, [allPdfTemplates, userTemplateTier]);
  const lockedTemplateDefaultHighlight = t('offers.wizard.previewTemplates.lockedValueProp');
  const lockedTemplateSummaries = useMemo(
    () =>
      lockedPdfTemplates.map((template) => ({
        label: template.label,
        highlight: template.marketingHighlight ?? lockedTemplateDefaultHighlight,
      })),
    [lockedPdfTemplates, lockedTemplateDefaultHighlight],
  );

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

  // edit on step 3 (declared early for use in draft persistence)
  const [editedHtml, setEditedHtml] = useState<string>('');

  // Draft persistence
  const wizardDraftData = useMemo(
    () => ({
      step,
      form,
      client,
      rows,
      editedHtml,
      selectedPdfTemplateId,
    }),
    [step, form, client, rows, editedHtml, selectedPdfTemplateId],
  );
  const { loadDraft, clearDraft } = useDraftPersistence('new-offer', wizardDraftData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);

  // Update last saved timestamp when draft data changes
  useEffect(() => {
    if (step > 0) {
      setDraftSaving(true);
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        setDraftSaving(false);
      }, 2100); // Slightly after the 2s debounce
      return () => clearTimeout(timer);
    }
  }, [wizardDraftData, step]);

  // Load draft on mount (only once)
  useEffect(() => {
    const saved = loadDraft();
    if (saved && saved.step) {
      // Restore draft state
      setStep(saved.step);
      if (saved.form) setForm(saved.form);
      if (saved.client) setClient(saved.client);
      if (saved.rows) setRows(saved.rows);
      if (saved.editedHtml) setEditedHtml(saved.editedHtml);
      if (saved.selectedPdfTemplateId) setSelectedPdfTemplateId(saved.selectedPdfTemplateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Real-time validation with debouncing (must be after form and rows declarations)
  const { errors: validationErrors, isValid: isStepValid } = useRealTimeValidation({
    step,
    title: form.title,
    projectDetails: form.projectDetails,
    pricingRows: rows,
    onValidationChange: () => {
      // Validation errors are automatically updated by the hook
    },
  });

  // preview
  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLocked, setPreviewLocked] = useState(false);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);
  const [previewDocumentHtml, setPreviewDocumentHtml] = useState('');
  const previewDocumentAbortRef = useRef<AbortController | null>(null);
  const {
    frameRef: previewFrameRef,
    height: previewFrameHeight,
    updateHeight: updatePreviewFrameHeight,
  } = useIframeAutoHeight({ minHeight: 720 });
  const {
    frameRef: modalPreviewFrameRef,
    height: modalPreviewFrameHeight,
    updateHeight: updateModalPreviewFrameHeight,
  } = useIframeAutoHeight({ minHeight: 720 });

  // edit on step 3 (state moved above for draft persistence)
  const richTextEditorRef = useRef<RichTextEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageAssets, setImageAssets] = useState<OfferImageAsset[]>([]);
  
  // Preview controls
  const [previewZoom, setPreviewZoom] = useState(100);
  const [showMarginGuides, setShowMarginGuides] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [fullscreenZoom, setFullscreenZoom] = useState(100);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Update modal iframe height when modal opens or preview content changes
  useEffect(() => {
    if (isPreviewModalOpen && previewDocumentHtml) {
      // Small delay to ensure iframe is rendered
      const timer = setTimeout(() => {
        updateModalPreviewFrameHeight();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPreviewModalOpen, previewDocumentHtml, updateModalPreviewFrameHeight]);
  const [textTemplates, setTextTemplates] = useState<OfferTextTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNameError, setTemplateNameError] = useState<string | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const templateModalTitleId = useId();
  const templateModalDescriptionId = useId();
  const templateNameFieldId = useId();
  const [quotaSnapshot, setQuotaSnapshot] = useState<QuotaSnapshot | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const isProPlan = plan === 'pro';
  const showLockedTemplates = !isProPlan && lockedTemplateSummaries.length > 0;
  const quotaLimit = quotaSnapshot?.limit ?? null;
  const quotaUsed = quotaSnapshot?.used ?? 0;
  const quotaPending = quotaSnapshot?.pending ?? 0;
  const remainingQuota = useMemo(() => {
    if (quotaLimit === null) {
      return Number.POSITIVE_INFINITY;
    }
    const remaining = quotaLimit - quotaUsed - quotaPending;
    return remaining > 0 ? remaining : 0;
  }, [quotaLimit, quotaPending, quotaUsed]);
  const isQuotaExhausted = quotaLimit !== null && remainingQuota <= 0;
  const quotaTitle = isQuotaExhausted
    ? t('offers.wizard.quota.exhaustedTitle')
    : t('offers.wizard.quota.availableTitle');
  const quotaDescription = useMemo(() => {
    if (quotaLoading) {
      return t('offers.wizard.quota.loading');
    }
    if (quotaError) {
      return quotaError;
    }
    if (isQuotaExhausted) {
      return t('offers.wizard.quota.exhaustedDescription');
    }
    return t('offers.wizard.quota.availableDescription');
  }, [isQuotaExhausted, quotaError, quotaLoading, t]);
  const quotaRemainingText = useMemo(() => {
    if (quotaLoading || quotaError) {
      return null;
    }
    if (quotaLimit === null) {
      return t('offers.wizard.quota.unlimited');
    }
    return t('offers.wizard.quota.remainingLabel', {
      remaining: remainingQuota,
      limit: quotaLimit,
    });
  }, [quotaError, quotaLimit, quotaLoading, remainingQuota, t]);
  const quotaPendingText = useMemo(() => {
    if (quotaLoading || quotaError || quotaLimit === null || quotaPending <= 0) {
      return null;
    }
    return t('offers.wizard.quota.pendingInfo', { count: quotaPending });
  }, [quotaError, quotaLimit, quotaLoading, quotaPending, t]);

  useEffect(() => {
    if (!availablePdfTemplates.length) {
      return;
    }
    if (
      selectedPdfTemplateId &&
      availablePdfTemplates.some((template) => template.id === selectedPdfTemplateId)
    ) {
      return;
    }
    setSelectedPdfTemplateId(availablePdfTemplates[0]?.id ?? DEFAULT_FREE_TEMPLATE_ID);
  }, [availablePdfTemplates, selectedPdfTemplateId]);

  const selectedPdfTemplate = useMemo(() => {
    if (!selectedPdfTemplateId) {
      return null;
    }
    return (
      availablePdfTemplates.find((template) => template.id === selectedPdfTemplateId) ||
      allPdfTemplates.find((template) => template.id === selectedPdfTemplateId) ||
      null
    );
  }, [allPdfTemplates, availablePdfTemplates, selectedPdfTemplateId]);
  const selectedPdfTemplateLabel = selectedPdfTemplate?.label ?? null;

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
          'industries, company_name, brand_color_primary, brand_color_secondary, brand_logo_path, brand_logo_url, plan, offer_template',
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
      setProfileCompanyName(typeof prof?.company_name === 'string' ? prof.company_name : '');
      
      // Generate signed URL on-demand from path (preferred) or use legacy URL
      const logoUrl = await getBrandLogoUrl(
        sb,
        typeof prof?.brand_logo_path === 'string' ? prof.brand_logo_path : null,
        typeof prof?.brand_logo_url === 'string' ? prof.brand_logo_url : null,
      );
      
      setPdfBranding({
        primaryColor:
          typeof prof?.brand_color_primary === 'string' ? prof.brand_color_primary : null,
        secondaryColor:
          typeof prof?.brand_color_secondary === 'string' ? prof.brand_color_secondary : null,
        logoUrl,
      });

      setQuotaLoading(true);
      try {
        const { iso: expectedPeriod } = currentMonthStart();
        const params = new URLSearchParams({ period_start: expectedPeriod });

        const response = await fetchWithSupabaseAuth(
          `/api/usage/with-pending?${params.toString()}`,
          { method: 'GET', defaultErrorMessage: t('errors.requestFailed') },
        );

        if (!active) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as unknown;
        
        // Parse the response similar to dashboard
        if (!payload || typeof payload !== 'object') {
          throw new Error('Invalid usage response payload.');
        }

        const record = payload as Record<string, unknown>;
        const planValue = record.plan;
        if (planValue !== 'free' && planValue !== 'standard' && planValue !== 'pro') {
          throw new Error('Invalid plan in usage response.');
        }

        let limit: number | null = null;
        if (record.limit === null) {
          limit = null;
        } else if (record.limit !== undefined) {
          const numericLimit = Number(record.limit);
          if (Number.isFinite(numericLimit)) {
            limit = numericLimit;
          } else {
            throw new Error('Invalid limit in usage response.');
          }
        }

        const confirmedValue = Number(record.confirmed);
        const confirmed = Number.isFinite(confirmedValue) ? confirmedValue : 0;

        const pendingUserValue = Number(record.pendingUser);
        const pendingUser = Number.isFinite(pendingUserValue) ? pendingUserValue : 0;

        const periodStart = typeof record.periodStart === 'string' ? record.periodStart : '';

        if (!periodStart) {
          throw new Error('Missing periodStart in usage response.');
        }

        setQuotaSnapshot({
          limit,
          used: confirmed,
          pending: pendingUser,
          periodStart,
        });
        setQuotaError(null);
      } catch (quotaLoadError) {
        if (!active) {
          return;
        }
        console.error('Failed to load usage quota for new offer wizard.', quotaLoadError);
        if (normalizedPlan === 'pro') {
          setQuotaSnapshot({ limit: null, used: 0, pending: 0, periodStart: null });
          setQuotaError(null);
        } else {
          setQuotaSnapshot(null);
          setQuotaError(t('offers.wizard.quota.loadFailed'));
        }
      } finally {
        if (active) {
          setQuotaLoading(false);
        }
      }

      const planTierForTemplates = planToTemplateTier(normalizedPlan);
      const templatesForPlan =
        planTierForTemplates === 'premium'
          ? allPdfTemplates
          : allPdfTemplates.filter((template) => template.tier === 'free');
      const preferredTemplateId = normalizeTemplateId(
        typeof prof?.offer_template === 'string' ? prof.offer_template : null,
      );
      const initialTemplateId =
        preferredTemplateId &&
        templatesForPlan.some((template) => template.id === preferredTemplateId)
          ? preferredTemplateId
          : (templatesForPlan[0]?.id ?? DEFAULT_FREE_TEMPLATE_ID);
      setSelectedPdfTemplateId(initialTemplateId);

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

      const { data: templateRows } = await sb
        .from('offer_text_templates')
        .select('id,name,payload,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false, nullsFirst: false });
      if (!active) {
        return;
      }
      const parsedTemplates =
        templateRows
          ?.map((row) =>
            parseTemplateRow(
              row as {
                id?: unknown;
                name?: unknown;
                payload?: unknown;
                updated_at?: unknown;
              },
            ),
          )
          .filter((item): item is OfferTextTemplate => item !== null) ?? [];
      setTextTemplates(sortTemplates(parsedTemplates));
    })();

    return () => {
      active = false;
    };
  }, [allPdfTemplates, authStatus, sb, t, user]);

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

  useEffect(() => {
    if (selectedTemplateId && !textTemplates.some((tpl) => tpl.id === selectedTemplateId)) {
      setSelectedTemplateId('');
    }
  }, [selectedTemplateId, textTemplates]);

  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) => (a.industries || []).length === 0 || a.industries.includes(form.industry),
    );
  }, [activities, form.industry]);
  const previewBodyHtml = useMemo(() => {
    const trimmed = (editedHtml || previewHtml || '').trim();
    if (!trimmed) {
      return DEFAULT_PREVIEW_PLACEHOLDER_HTML;
    }
    return trimmed;
  }, [editedHtml, previewHtml]);
  const selectedLegacyTemplateId = useMemo<TemplateId>(() => {
    // Use the template ID directly (no longer need legacy ID)
    return selectedPdfTemplate?.id ?? DEFAULT_OFFER_TEMPLATE_ID;
  }, [selectedPdfTemplate]);

  useEffect(() => {
    const controller = new AbortController();
    if (previewDocumentAbortRef.current) {
      previewDocumentAbortRef.current.abort();
    }
    previewDocumentAbortRef.current = controller;

    const templateId = selectedPdfTemplateId ?? DEFAULT_FREE_TEMPLATE_ID;
    const payload = {
      title: form.title,
      companyName: profileCompanyName,
      bodyHtml: previewBodyHtml,
      rows: rows.map(({ name, qty, unit, unitPrice, vat }) => ({
        name,
        qty,
        unit,
        unitPrice,
        vat,
      })),
      templateId,
      legacyTemplateId: selectedLegacyTemplateId,
      locale: form.language,
      branding: {
        primaryColor: pdfBranding.primaryColor,
        secondaryColor: pdfBranding.secondaryColor,
        logoUrl: pdfBranding.logoUrl,
      },
    };

    (async () => {
      try {
        const response = await fetchWithSupabaseAuth('/api/offer-preview/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
          defaultErrorMessage: t('errors.preview.fetchUnknown'),
          errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
        });
        const html = await response.text();
        if (!controller.signal.aborted) {
          setPreviewDocumentHtml(html);
        }
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        console.error('Failed to render preview document', error);
        if (!controller.signal.aborted) {
          const fallbackMessage = t('errors.preview.fetchUnknown');
          setPreviewDocumentHtml(
            `<!DOCTYPE html>\n<html><head><meta charset="UTF-8" /></head><body><main><p>${fallbackMessage}</p></main></body></html>`,
          );
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [
    form.language,
    form.title,
    pdfBranding.logoUrl,
    pdfBranding.primaryColor,
    pdfBranding.secondaryColor,
    previewBodyHtml,
    profileCompanyName,
    rows,
    selectedLegacyTemplateId,
    selectedPdfTemplateId,
  ]);

  useEffect(() => {
    updatePreviewFrameHeight();
  }, [previewDocumentHtml, updatePreviewFrameHeight]);
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

  const handlePdfTemplateChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const templateId = event.target.value as TemplateId;
      if (!templateId) {
        return;
      }
      const isAllowed = availablePdfTemplates.some((template) => template.id === templateId);
      if (!isAllowed) {
        return;
      }
      setSelectedPdfTemplateId(templateId);
    },
    [availablePdfTemplates],
  );

  const handleTemplateSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const templateId = event.target.value;
      setSelectedTemplateId(templateId);
      if (!templateId) {
        return;
      }

      const template = textTemplates.find((item) => item.id === templateId);
      if (!template) {
        return;
      }

      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
        previewAbortRef.current = null;
        previewRequestIdRef.current += 1;
      }

      setForm((prev) => ({
        ...prev,
        industry: template.industry,
        title: template.title,
        projectDetails: { ...template.projectDetails },
        deadline: template.deadline,
        language: template.language,
        brandVoice: template.brandVoice,
        style: template.style,
      }));
      setPreviewLocked(false);
      setPreviewLoading(false);
      setPreviewHtml(DEFAULT_PREVIEW_PLACEHOLDER_HTML);
      setEditedHtml('');
      setImageAssets([]);

      showToast({
        title: t('toasts.templates.applied.title', { name: template.name }),
        description: t('toasts.templates.applied.description', { name: template.name }),
        variant: 'success',
      });
    },
    [showToast, textTemplates],
  );

  const handleOpenTemplateModal = useCallback(() => {
    const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
      (acc, key) => {
        acc[key] = form.projectDetails[key].trim();
        return acc;
      },
      { ...emptyProjectDetails },
    );
    const trimmedTitle = form.title.trim();

    if (!trimmedTitle || normalizedDetails.overview.trim().length === 0) {
      showToast({
        title: t('toasts.templates.missingFields.title'),
        description: t('toasts.templates.missingFields.description'),
        variant: 'error',
      });
      return;
    }

    setTemplateName(trimmedTitle);
    setTemplateNameError(null);
    setTemplateModalOpen(true);
  }, [form.projectDetails, form.title, showToast]);

  const handleTemplateModalClose = useCallback(() => {
    if (templateSaving) {
      return;
    }
    setTemplateModalOpen(false);
    setTemplateName('');
    setTemplateNameError(null);
  }, [templateSaving]);

  const handleTemplateNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setTemplateName(event.target.value);
      if (templateNameError) {
        setTemplateNameError(null);
      }
    },
    [templateNameError],
  );

  const handleTemplateSave = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!user) {
        showToast({
          title: t('errors.auth.notLoggedIn'),
          description: t('errors.auth.notLoggedIn'),
          variant: 'error',
        });
        return;
      }

      const trimmedName = templateName.trim();
      if (!trimmedName) {
        setTemplateNameError(t('offers.wizard.forms.details.templates.modal.nameRequired'));
        return;
      }

      const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
        (acc, key) => {
          acc[key] = form.projectDetails[key].trim();
          return acc;
        },
        { ...emptyProjectDetails },
      );
      const trimmedTitle = form.title.trim();

      if (!trimmedTitle || normalizedDetails.overview.trim().length === 0) {
        showToast({
          title: t('toasts.templates.missingFields.title'),
          description: t('toasts.templates.missingFields.description'),
          variant: 'error',
        });
        return;
      }

      const payload: OfferTextTemplatePayload = {
        industry: form.industry,
        title: trimmedTitle,
        projectDetails: normalizedDetails,
        deadline: form.deadline.trim(),
        language: form.language,
        brandVoice: form.brandVoice,
        style: form.style,
      };

      setTemplateSaving(true);

      try {
        const { data, error } = await sb
          .from('offer_text_templates')
          .insert({
            user_id: user.id,
            name: trimmedName,
            payload,
          })
          .select('id,name,payload,updated_at')
          .single();

        if (error) {
          throw error;
        }

        const parsed = data
          ? parseTemplateRow(
              data as {
                id?: unknown;
                name?: unknown;
                payload?: unknown;
                updated_at?: unknown;
              },
            )
          : null;

        if (!parsed) {
          throw new Error('invalid-template-payload');
        }

        setTextTemplates((prev) =>
          sortTemplates([...prev.filter((item) => item.id !== parsed.id), parsed]),
        );
        setSelectedTemplateId(parsed.id);
        showToast({
          title: t('toasts.templates.saved.title'),
          description: t('toasts.templates.saved.description', { name: parsed.name }),
          variant: 'success',
        });
        setTemplateModalOpen(false);
        setTemplateName('');
        setTemplateNameError(null);
      } catch (error: unknown) {
        console.error('Nem sikerült menteni a szövegsablont', error);
        showToast({
          title: t('toasts.templates.saveFailed.title'),
          description: t('toasts.templates.saveFailed.description'),
          variant: 'error',
        });
      } finally {
        setTemplateSaving(false);
      }
    },
    [
      form.brandVoice,
      form.deadline,
      form.industry,
      form.language,
      form.projectDetails,
      form.style,
      form.title,
      sb,
      showToast,
      templateName,
      user,
    ],
  );

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
        console.error(t('api.preview.error'), message, error);
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
    if (quotaLoading) {
      showToast({
        title: t('offers.wizard.quota.loading'),
        description: t('offers.wizard.quota.loading'),
        variant: 'info',
      });
      return;
    }
    if (isQuotaExhausted) {
      showToast({
        title: t('offers.wizard.quota.exhaustedToastTitle'),
        description: t('offers.wizard.quota.exhaustedToastDescription'),
        variant: 'warning',
      });
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
  }, [callPreview, hasPreviewInputs, isQuotaExhausted, previewLocked, quotaLoading, showToast, t]);

  useEffect(() => {
    if (step !== 3) {
      return;
    }
    if (quotaLoading) {
      return;
    }
    if (isQuotaExhausted || previewLocked || previewLoading || !hasPreviewInputs) {
      return;
    }
    void callPreview();
  }, [
    callPreview,
    hasPreviewInputs,
    isQuotaExhausted,
    previewLoading,
    previewLocked,
    quotaLoading,
    step,
  ]);

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
      if (quotaLoading) {
        showToast({
          title: t('offers.wizard.quota.loading'),
          description: t('offers.wizard.quota.loading'),
          variant: 'info',
        });
        return;
      }
      if (isQuotaExhausted) {
        showToast({
          title: t('offers.wizard.quota.exhaustedToastTitle'),
          description: t('offers.wizard.quota.exhaustedToastDescription'),
          variant: 'warning',
        });
        return;
      }
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
      
      // Clear draft on successful generation
      const clearDraftOnSuccess = () => {
        clearDraft();
        handleSuccessfulGeneration();
      };
      try {
        const normalizedDetails = projectDetailFields.reduce<ProjectDetails>(
          (acc, key) => {
            acc[key] = form.projectDetails[key].trim();
            return acc;
          },
          { ...emptyProjectDetails },
        );

        const serializedPrices = rows.map(({ name, qty, unit, unitPrice, vat }) => ({
          name,
          qty,
          unit,
          unitPrice,
          vat,
        }));

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
            prices: serializedPrices,
            aiOverrideHtml: htmlForApi,
            clientId: cid,
            imageAssets: imagePayload,
            templateId: selectedPdfTemplateId ?? DEFAULT_FREE_TEMPLATE_ID,
          }),
          authErrorMessage: t('errors.auth.notLoggedIn'),
          errorMessageBuilder: (status) => t('errors.offer.generateStatus', { status }),
          defaultErrorMessage: t('errors.offer.generateUnknown'),
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          showToast({
            title: t('errors.auth.notLoggedIn'),
            description: t('errors.auth.notLoggedIn'),
            variant: 'error',
          });
          router.replace('/login');
          return;
        }

        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : t('errors.offer.generateUnknown');
        showToast({
          title: t('toasts.offers.saveFailed.title'),
          description: message,
          variant: 'error',
        });
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
      const responseStatus = payloadObj && typeof payloadObj.status === 'string' ? payloadObj.status : undefined;
      const textSaved = payloadObj && typeof payloadObj.textSaved === 'boolean' ? payloadObj.textSaved : false;
      const responseNote = payloadObj && typeof payloadObj.note === 'string' ? payloadObj.note : undefined;

      if (okFlag === false) {
        const msg = errorMessage || t('errors.offer.generateStatus', { status: resp.status });
        showToast({
          title: t('toasts.offers.saveFailed.title'),
          description: msg,
          variant: 'error',
        });
        return;
      }

      if (sectionsData) {
        if (!isOfferSections(sectionsData)) {
          showToast({
            title: t('toasts.offers.saveFailed.title'),
            description: t('errors.offer.missingStructure'),
            variant: 'error',
          });
          return;
        }
      }

      // If PDF generation failed but text was saved, show a warning
      if (okFlag === true && responseStatus === 'failed' && textSaved) {
        showToast({
          title: t('toasts.offers.textSaved.title'),
          description: responseNote || t('toasts.offers.textSaved.description'),
          variant: 'warning',
        });
      }

      clearDraft();
      
      // Wait a moment for quota to be updated on the backend before redirecting
      // This gives the PDF worker time to increment the quota counter
      // The delay ensures the dashboard will show the updated quota
      // Also trigger quota recalculation on dashboard by adding a refresh parameter
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add a timestamp query parameter to force dashboard to refresh quota
      const refreshParam = new URLSearchParams({ refresh: Date.now().toString() });
      router.replace(`/dashboard?${refreshParam.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  // Real-time validation is handled by useRealTimeValidation hook

  const goToStep = useCallback(
    (nextStep: number) => {
      const clampedStep = Math.max(1, Math.min(3, nextStep));
      const movingForward = clampedStep > step;
      
      // Validate before moving forward
      if (movingForward) {
        if (quotaLoading) {
          showToast({
            title: t('offers.wizard.quota.loading'),
            description: t('offers.wizard.quota.loading'),
            variant: 'info',
          });
          return;
        }
        if (isQuotaExhausted) {
          showToast({
            title: t('offers.wizard.quota.exhaustedToastTitle'),
            description: t('offers.wizard.quota.exhaustedToastDescription'),
            variant: 'warning',
          });
          return;
        }
        
        // Validate current step before proceeding (using real-time validation)
        if (step === 1) {
          if (validationErrors.title || validationErrors.projectDetails.overview) {
            showToast({
              title: t('offers.wizard.validation.titleRequired'),
              description: t('offers.wizard.validation.overviewRequired'),
              variant: 'warning',
            });
            return;
          }
        } else if (step === 2) {
          if (validationErrors.pricing) {
            showToast({
              title: t('offers.wizard.validation.pricingRequired'),
              description: validationErrors.pricing,
              variant: 'warning',
            });
            return;
          }
        }
      }
      
      if (step === 1 && clampedStep > 1) {
        handleGeneratePreview();
      }
      setStep(clampedStep);
    },
    [handleGeneratePreview, isQuotaExhausted, quotaLoading, showToast, step, t, validationErrors],
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
      label: t('offers.wizard.steps.summary'),
      status: step === 3 ? 'current' : 'upcoming',
      onSelect: () => goToStep(3),
    },
  ];

  // Calculate progress
  const completedFields = useMemo(() => {
    const step1Completed =
      (form.title.trim() ? 1 : 0) +
      (form.projectDetails.overview.trim() ? 1 : 0) +
      (form.projectDetails.deliverables.trim() ? 0.5 : 0) +
      (form.projectDetails.timeline.trim() ? 0.5 : 0) +
      (form.projectDetails.constraints.trim() ? 0.5 : 0);
    const step2Completed = rows.filter((r) => r.name.trim() && r.unitPrice > 0).length;
    const step3Completed = previewLocked ? 1 : 0;

    return {
      step1: Math.min(step1Completed, 3),
      step2: Math.min(step2Completed, 1),
      step3: step3Completed,
    };
  }, [form, rows, previewLocked]);

  const totalFields = {
    step1: 3, // title, overview, and at least one detail field
    step2: 1, // at least one pricing row
    step3: 1, // preview generated
  };

  // Clear draft on successful generation
  const handleSuccessfulGeneration = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Keyboard shortcuts
  useWizardKeyboardShortcuts({
    step: step as WizardStep,
    onNext: () => goToStep(Math.min(3, step + 1)),
    onPrev: () => goToStep(Math.max(1, step - 1)),
    onSubmit: generate,
    isNextDisabled: isQuotaExhausted || quotaLoading,
    isSubmitDisabled: loading || isQuotaExhausted || quotaLoading || !previewLocked,
    enabled: !loading,
  });

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Wizard error:', error, errorInfo);
      }}
    >
      <AppFrame title={t('offers.wizard.pageTitle')} description={t('offers.wizard.pageDescription')}>
        {/* Skip link for accessibility */}
        <a
          href="#wizard-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Ugrás a tartalomhoz
        </a>
        <div className="space-y-6 sm:space-y-8" id="wizard-content">
          <Card className="space-y-4 border-none bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5 sm:space-y-6">
            <StepIndicator steps={wizardSteps} />
            <WizardProgressIndicator
              step={step as WizardStep}
              completedFields={completedFields}
              totalFields={totalFields}
            />
          </Card>
          
          {/* Draft save indicator */}
          <DraftSaveIndicator isSaving={draftSaving} lastSaved={lastSaved} />

        {step === 1 && (
          <section className="space-y-6">
            <WizardStep1Details
              form={form}
              onFormChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
              client={client}
              onClientChange={(updates) => setClient((prev) => ({ ...prev, ...updates }))}
              clientList={clientList}
              onClientSelect={pickClient}
              availableIndustries={availableIndustries}
              validationErrors={validationErrors}
              showClientDropdown={showClientDrop}
              onClientDropdownToggle={setShowClientDrop}
              filteredClients={filteredClients}
              textTemplates={textTemplates.map((t) => ({ id: t.id, name: t.name }))}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={(templateId) => {
                const event = { target: { value: templateId } } as ChangeEvent<HTMLSelectElement>;
                handleTemplateSelect(event);
              }}
              quotaInfo={{
                title: quotaTitle,
                description: quotaDescription,
                remainingText: quotaRemainingText,
                pendingText: quotaPendingText,
                isExhausted: isQuotaExhausted,
              }}
            />
          </section>
        )}
        {step === 1 && false && (
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

              <div
                className={`rounded-2xl border p-4 transition ${
                  isQuotaExhausted
                    ? 'border-rose-200 bg-rose-50/90 text-rose-700'
                    : 'border-slate-200 bg-slate-50/90 text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{quotaTitle}</p>
                  <p className="text-xs text-current/80">{quotaDescription}</p>
                  {quotaRemainingText ? (
                    <p className="text-xs font-semibold text-current">{quotaRemainingText}</p>
                  ) : null}
                  {quotaPendingText ? (
                    <p className="text-[11px] text-current/70">{quotaPendingText}</p>
                  ) : null}
                </div>
              </div>

              <section className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-white/70 p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {t('offers.wizard.forms.details.templates.heading')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('offers.wizard.forms.details.templates.helper')}
                  </p>
                </div>
                {textTemplates.length > 0 ? (
                  <Select
                    label={t('offers.wizard.forms.details.templates.selectLabel')}
                    value={selectedTemplateId}
                    onChange={handleTemplateSelect}
                  >
                    <option value="">
                      {t('offers.wizard.forms.details.templates.selectPlaceholder')}
                    </option>
                    {textTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-xs text-slate-500">
                    {t('offers.wizard.forms.details.templates.empty')}
                  </p>
                )}
              </section>

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
          <WizardStep2Pricing
            rows={rows}
            onRowsChange={setRows}
            activities={activities}
            industry={form.industry}
            {...(validationErrors.pricing && { validationError: validationErrors.pricing })}
            client={client}
            onClientChange={(updates) => setClient((prev) => ({ ...prev, ...updates }))}
            clientList={clientList}
            onClientSelect={pickClient}
            showClientDropdown={showClientDrop}
            onClientDropdownToggle={setShowClientDrop}
            filteredClients={filteredClients}
          />
        )}

        {step === 3 && (
          <section className="space-y-6" aria-label="Összegzés és előnézet">
            <Card className="space-y-6 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6 sm:space-y-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {t('offers.wizard.steps.summary')}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t('offers.wizard.previewTemplates.contentGoesToPdf')}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {t('offers.wizard.previewTemplates.livePreview')}
                </span>
              </div>
              {/* Tips for text editing */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-lg">💡</span>
                  <p className="text-sm font-semibold text-slate-900">{t('wizard.preview.tipsTitle')}</p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-xs text-slate-700 ml-2">
                  <li>{t('richTextEditor.placeholderReminder')}</li>
                  <li>{t('wizard.preview.tipsItems.useLists')}</li>
                  <li>{t('wizard.preview.tipsItems.highlight')}</li>
                  <li>{t('wizard.preview.tipsItems.keepShort')}</li>
                  <li>{t('wizard.preview.tipsItems.useHeadings')}</li>
                </ul>
              </div>
              
              <div className="relative">
                {previewLoading && !previewHtml ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <SkeletonLoader />
                    <div className="mt-4 flex items-center gap-2 text-center text-xs text-slate-500">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>{t('offers.wizard.preview.loading')}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <RichTextEditor
                      ref={richTextEditorRef}
                      value={editedHtml || previewHtml}
                      onChange={(html) => {
                        setEditedHtml(html);
                      }}
                      placeholder={t('richTextEditor.placeholderHint')}
                        aria-label={t('richTextEditor.placeholderHint')}
                    />
                    {/* Content length warning */}
                    {(() => {
                      const textLength = (editedHtml || previewHtml || '').replace(/<[^>]*>/g, '').length;
                      if (textLength > 4000) {
                        return (
                          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2">
                            <p className="text-xs font-medium text-amber-800">
                              {t('wizard.preview.longContentWarning', { length: textLength })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {previewLoading && previewHtml ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/80 backdrop-blur">
                        <span className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-slate-600" />
                        <div className="space-y-0.5 text-center">
                          <p className="text-xs font-medium text-slate-700">
                            {t('offers.wizard.preview.loading')}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {t('offers.wizard.preview.loadingHint')}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              {/* Preview Section with Thumbnail */}
              <div className="space-y-4 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {t('offers.wizard.previewTemplates.previewHeading')}
                    </h3>
                    {selectedPdfTemplate && (
                      <p className="text-xs text-slate-600 mt-1">
                        Sablon: <span className="font-semibold">{selectedPdfTemplate.label}</span>
                      </p>
                    )}
                  </div>
                  {previewDocumentHtml && (
                    <div className="hidden sm:flex items-center justify-center relative w-20 h-28 rounded-lg border-2 border-slate-300 bg-white shadow-md overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
                      <div className="relative z-10 text-center p-2">
                        <svg className="w-8 h-8 mx-auto text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-[10px] font-semibold text-slate-600">PDF</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Előnézet</p>
                      </div>
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  disabled={!previewDocumentHtml && !previewLoading}
                  className="w-full rounded-xl border-2 border-primary bg-primary px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:scale-100"
                >
                  {previewLoading && !previewDocumentHtml ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('offers.wizard.preview.loading')}
                    </span>
                  ) : previewDocumentHtml ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {t('wizard.preview.openPreview')}
                    </span>
                  ) : (
                    t('wizard.preview.noPreview')
                  )}
                </Button>
                <p className="text-xs text-slate-600 text-center">
                  {t('offers.wizard.previewTemplates.previewHint')}
                </p>
              </div>
              {isProPlan ? (
                <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-slate-50/70 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{t('richTextEditor.imageSection.heading')}</p>
                      <p className="text-xs text-slate-500">
                        {t('richTextEditor.imageSection.description')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handlePickImage}
                      disabled={imageLimitReached || !previewLocked || previewLoading}
                      className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
                    >
                      {t('richTextEditor.imageSection.insert')}
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
                    <p className="text-[11px] text-slate-500">
                      {t('richTextEditor.imageSection.notAvailable')}
                    </p>
                  ) : null}
                  {imageAssets.length > 0 ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {imageAssets.map((asset) => {
                        const sizeKb = Math.max(1, Math.ceil(asset.size / 1024));
                        return (
                          <li
                            key={asset.key}
                            className="flex gap-2 rounded-xl border border-border/70 bg-white p-2 shadow-sm"
                          >
                            <img
                              src={asset.dataUrl}
                              alt={asset.alt}
                              className="h-12 w-12 rounded-lg object-cover shadow-sm"
                            />
                            <div className="flex flex-1 flex-col justify-between text-[11px] text-slate-500">
                              <div>
                                <p className="font-semibold text-slate-700">{asset.name}</p>
                                <p className="mt-0.5">
                                  {sizeKb} KB • alt: {asset.alt}
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleRemoveImage(asset.key)}
                                className="self-start text-[11px] font-semibold text-rose-600 transition hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                              >
                                Eltávolítás
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Még nem adtál hozzá képeket. A beszúrt képek csak a kész PDF-ben jelennek meg.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 rounded-xl border border-dashed border-border/70 bg-slate-50/60 p-3">
                  <p className="text-[11px] text-slate-500">
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
                <h2 className="text-sm font-semibold text-slate-900">
                  {t('offers.wizard.steps.summary')}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {t('wizard.preview.afterGeneration')}
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
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">
                    {t('offers.wizard.previewTemplates.summaryLabel')}
                  </dt>
                  <dd className="font-medium text-slate-800">
                    {selectedPdfTemplateLabel || availablePdfTemplates[0]?.label || '—'}
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
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  onClick={handleOpenTemplateModal}
                  disabled={loading}
                  className="w-full rounded-full border border-border/70 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
                >
                  {t('offers.wizard.forms.details.templates.saveAction')}
                </Button>
                <Button
                  onClick={generate}
                  disabled={loading || isQuotaExhausted || quotaLoading || !previewLocked}
                  className="w-full rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? 'Generálás…' : 'PDF generálása és mentés'}
                </Button>
                {!previewLocked && !previewLoading && (
                  <p className="text-[11px] text-slate-500 text-center">
                    Az AI előnézet betöltése után lesz elérhető a PDF generálás.
                  </p>
                )}
              </div>
            </Card>
          </section>
        )}

        <WizardActionBar
          step={step as WizardStep}
          onPrev={() => goToStep(Math.max(1, step - 1))}
          onNext={() => goToStep(Math.min(3, step + 1))}
          onSubmit={generate}
          isNextDisabled={isQuotaExhausted || quotaLoading}
          isSubmitDisabled={loading || isQuotaExhausted || quotaLoading || !previewLocked}
          isSubmitting={loading}
          isQuotaExhausted={isQuotaExhausted}
          isQuotaLoading={quotaLoading}
        />
      </div>
      <Modal
        open={isTemplateModalOpen}
        onClose={handleTemplateModalClose}
        labelledBy={templateModalTitleId}
        describedBy={templateModalDescriptionId}
      >
        <form className="space-y-6" onSubmit={handleTemplateSave}>
          <div className="space-y-2">
            <h2 id={templateModalTitleId} className="text-lg font-semibold text-slate-900">
              {t('offers.wizard.forms.details.templates.modal.title')}
            </h2>
            <p id={templateModalDescriptionId} className="text-sm text-slate-600">
              {t('offers.wizard.forms.details.templates.modal.description')}
            </p>
          </div>
          <Input
            id={templateNameFieldId}
            label={t('offers.wizard.forms.details.templates.modal.nameLabel')}
            placeholder={t('offers.wizard.forms.details.templates.modal.namePlaceholder')}
            value={templateName}
            onChange={handleTemplateNameChange}
            error={templateNameError || undefined}
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTemplateModalClose}
              disabled={templateSaving}
            >
              {t('offers.wizard.forms.details.templates.modal.cancel')}
            </Button>
            <Button type="submit" loading={templateSaving} disabled={templateSaving}>
              {templateSaving
                ? t('offers.wizard.forms.details.templates.modal.saving')
                : t('offers.wizard.forms.details.templates.modal.save')}
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* PDF Preview Modal */}
      <Modal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        labelledBy="preview-modal-title"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="preview-modal-title" className="text-lg font-semibold text-slate-900">
              {t('offers.wizard.previewTemplates.previewHeading')}
            </h2>
            {selectedPdfTemplate && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {selectedPdfTemplate.label}
              </span>
            )}
          </div>
          
          {/* Template Selector and Preview Controls */}
          <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Select
                label={t('offers.wizard.previewTemplates.heading')}
                help={t('offers.wizard.previewTemplates.helper')}
                value={selectedPdfTemplateId ?? DEFAULT_FREE_TEMPLATE_ID}
                onChange={handlePdfTemplateChange}
                wrapperClassName="flex flex-col gap-2"
                aria-label="PDF sablon kiválasztása"
              >
                {availablePdfTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Locked Templates Info */}
            {showLockedTemplates && (
              <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    <LockBadgeIcon className="h-3.5 w-3.5" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-700">
                        {t('offers.wizard.previewTemplates.lockedTitle')}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {t('app.planUpgradeModal.badge')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {t('offers.wizard.previewTemplates.lockedDescription')}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {lockedTemplateSummaries.map((template) => (
                    <div
                      key={template.label}
                      className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <LockBadgeIcon className="h-3 w-3" />
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-700">{template.label}</p>
                        <p className="text-[11px] text-slate-500">{template.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    openPlanUpgradeDialog({
                      description: t('app.planUpgradeModal.reasons.proTemplates'),
                    })
                  }
                  className="self-start"
                >
                  {t('app.planUpgradeModal.primaryCta')}
                </Button>
              </div>
            )}

            {/* Preview controls */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center gap-2">
                <label htmlFor="modal-preview-zoom" className="text-sm font-medium text-slate-700">
                  {t('wizard.preview.zoom')}:
                </label>
                <input
                  id="modal-preview-zoom"
                  type="range"
                  min="50"
                  max="200"
                  step="25"
                  value={previewZoom}
                  onChange={(e) => setPreviewZoom(Number(e.target.value))}
                  className="h-2 w-24 rounded-lg bg-slate-200"
                  aria-label={t('wizard.preview.zoomAria')}
                />
                <span className="min-w-[3rem] text-sm font-medium text-slate-700">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label={t('wizard.preview.zoomResetAria')}
                >
                  {t('wizard.preview.zoomReset')}
                </button>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showMarginGuides}
                  onChange={(e) => setShowMarginGuides(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-2 focus:ring-primary"
                  aria-label={t('wizard.preview.showMarginsAria')}
                />
                <span className="text-sm text-slate-700">{t('wizard.preview.showMargins')}</span>
              </label>
              {previewDocumentHtml && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setIsPreviewFullscreen(true);
                  }}
                  className="ml-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={t('wizard.preview.fullscreenButton')}
                  title={t('wizard.preview.fullscreenButton')}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  {t('wizard.preview.fullscreenButton')}
                </button>
              )}
            </div>
          </div>
          
          {/* Preview container */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner p-3 max-h-[75vh] overflow-y-auto">
            <div 
              className="mx-auto bg-white shadow-lg relative"
              style={{ 
                width: '210mm', 
                maxWidth: '100%', 
                aspectRatio: '210/297',
                position: 'relative',
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: `${((previewZoom - 100) * 2)}px`,
              }}
            >
              {/* Margin guides overlay */}
              {showMarginGuides && <PreviewMarginGuides enabled={showMarginGuides} />}
              
              {previewLoading && !previewDocumentHtml ? (
                <div className="flex h-full min-h-[720px] items-center justify-center p-8">
                  <PreviewSkeletonLoader />
                </div>
              ) : (
                <iframe
                  ref={modalPreviewFrameRef}
                  className="offer-template-preview block w-full h-full"
                  sandbox="allow-same-origin"
                  srcDoc={previewDocumentHtml}
                  style={{
                    border: '0',
                    width: '100%',
                    height: `${modalPreviewFrameHeight}px`,
                    minHeight: '720px',
                    backgroundColor: 'white',
                    display: 'block',
                    margin: 0,
                    padding: 0,
                  }}
                  title={t('offers.wizard.previewTemplates.previewHeading')}
                  aria-label={t('offers.wizard.previewTemplates.previewHeading')}
                />
              )}
            </div>
          </div>
          
          <p className="text-[11px] text-slate-500">
            {t('offers.wizard.previewTemplates.previewHint')}
          </p>
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Fullscreen preview modal */}
      <FullscreenPreviewModal
        open={isPreviewFullscreen}
        onClose={() => setIsPreviewFullscreen(false)}
        previewHtml={previewDocumentHtml}
        zoom={fullscreenZoom}
        onZoomChange={(newZoom) => {
          setFullscreenZoom(newZoom);
          setPreviewZoom(newZoom);
        }}
        showMarginGuides={showMarginGuides}
        onToggleMarginGuides={setShowMarginGuides}
        title={t('wizard.preview.fullscreenTitle')}
        templateOptions={availablePdfTemplates}
        selectedTemplateId={selectedPdfTemplateId ?? availablePdfTemplates[0]?.id}
        defaultTemplateId={availablePdfTemplates[0]?.id}
        onTemplateChange={(templateId) => {
          setSelectedPdfTemplateId(templateId);
        }}
      />
      </AppFrame>
    </ErrorBoundary>
  );
}
