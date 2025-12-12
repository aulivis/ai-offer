'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClientLogger } from '@/lib/clientLogger';
import AppFrame from '@/components/AppFrame';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { StepErrorBoundary } from '@/components/offers/StepErrorBoundary';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { useToast } from '@/hooks/useToast';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';
import { useOfferPreview } from '@/hooks/useOfferPreview';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useWizardKeyboardShortcuts } from '@/hooks/useWizardKeyboardShortcuts';
import type { PriceRow } from '@/components/EditablePriceTable';
import { trackWizardEvent } from '@/lib/analytics/wizard';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import type { OfferPreviewTab } from '@/types/preview';
import { listTemplates } from '@/lib/offers/templates/index';
import type { TemplateId } from '@/lib/offers/templates/types';
import type { WizardStep } from '@/types/wizard';
import { normalizeBrandHex, getBrandLogoUrl } from '@/lib/branding';

// Lazy load wizard step components for route-based code splitting
// Note: Error logging is handled by the component's logger after mount
// Added error handling to prevent unhandled promise rejections
import { clientLogger } from '@/lib/clientLogger';

// Fallback component for failed dynamic imports
function OfferProjectDetailsSectionFallback() {
  return (
    <div className="p-8 text-center text-danger">
      <p>Hiba történt a komponens betöltésekor. Kérjük, frissítsd az oldalt.</p>
    </div>
  );
}

function WizardStep2PricingFallback() {
  return (
    <div className="p-8 text-center text-danger">
      <p>Hiba történt a komponens betöltésekor. Kérjük, frissítsd az oldalt.</p>
    </div>
  );
}

function OfferSummarySectionFallback() {
  return (
    <div className="p-8 text-center text-danger">
      <p>Hiba történt a komponens betöltésekor. Kérjük, frissítsd az oldalt.</p>
    </div>
  );
}

function WizardActionBarFallback() {
  return (
    <div className="p-4 text-center text-danger text-sm">
      <p>Hiba történt a komponens betöltésekor.</p>
    </div>
  );
}

function WizardPreviewPanelFallback() {
  return (
    <div className="p-8 text-center text-danger">
      <p>Hiba történt a komponens betöltésekor. Kérjük, frissítsd az oldalt.</p>
    </div>
  );
}

function PreviewAsCustomerButtonFallback() {
  return (
    <div className="p-4 text-center text-danger text-sm">
      <p>Hiba történt a komponens betöltésekor.</p>
    </div>
  );
}

const OfferProjectDetailsSection = dynamic(
  () =>
    import('@/components/offers/OfferProjectDetailsSection')
      .then((mod) => mod.OfferProjectDetailsSection)
      .catch((error) => {
        clientLogger.error('Failed to load OfferProjectDetailsSection', error);
        return OfferProjectDetailsSectionFallback;
      }),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const WizardStep2Pricing = dynamic(
  () =>
    import('@/components/offers/WizardStep2Pricing')
      .then((mod) => mod.WizardStep2Pricing)
      .catch((error) => {
        clientLogger.error('Failed to load WizardStep2Pricing', error);
        return WizardStep2PricingFallback;
      }),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const OfferSummarySection = dynamic(
  () =>
    import('@/components/offers/OfferSummarySection')
      .then((mod) => mod.OfferSummarySection)
      .catch((error) => {
        clientLogger.error('Failed to load OfferSummarySection', error);
        return OfferSummarySectionFallback;
      }),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const WizardActionBar = dynamic(
  () =>
    import('@/components/offers/WizardActionBar')
      .then((mod) => mod.WizardActionBar)
      .catch((error) => {
        clientLogger.error('Failed to load WizardActionBar', error);
        return WizardActionBarFallback;
      }),
  {
    loading: () => <div className="h-16 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const WizardPreviewPanel = dynamic(
  () =>
    import('@/components/offers/WizardPreviewPanel')
      .then((mod) => mod.WizardPreviewPanel)
      .catch((error) => {
        clientLogger.error('Failed to load WizardPreviewPanel', error);
        return WizardPreviewPanelFallback;
      }),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const PreviewAsCustomerButton = dynamic(
  () =>
    import('@/components/offers/PreviewAsCustomerButton')
      .then((mod) => mod.PreviewAsCustomerButton)
      .catch((error) => {
        clientLogger.error('Failed to load PreviewAsCustomerButton', error);
        return PreviewAsCustomerButtonFallback;
      }),
  {
    loading: () => <div className="h-12 animate-pulse rounded-lg bg-bg-muted" />,
  },
);

const PREVIEW_DEBOUNCE_MS = 600;

// Type definitions moved outside component for better performance
type _Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  reference_images?: string[] | null;
};
type _ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};
type _Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

export default function NewOfferPage() {
  const {
    step,
    title,
    setTitle,
    projectDetails,
    setProjectDetails,
    projectDetailsText,
    pricingRows,
    setPricingRows,
    goNext: goNextInternal,
    goPrev,
    goToStep,
    restoreStep,
    reset: resetWizard,
    isNextDisabled,
    attemptedSteps,
    validation,
    isStepValid,
  } = useOfferWizard();
  const { showToast } = useToast();
  const router = useRouter();
  const logger = useMemo(() => {
    try {
      return createClientLogger({ component: 'NewOfferPage' });
    } catch (error) {
      // Fallback logger if createClientLogger fails
      clientLogger.error('Failed to create logger', error);
      return {
        error: (...args: unknown[]) => clientLogger.error('[NewOfferPage]', args[0], { args }),
        warn: (...args: unknown[]) => clientLogger.warn('[NewOfferPage]', { args }),
        info: (...args: unknown[]) => clientLogger.info('[NewOfferPage]', { args }),
      };
    }
  }, []);
  const supabase = useSupabase();
  const { user, status: authStatus } = useRequireAuth();

  // Preview hook - enabled from Step 2 onwards
  const previewEnabled = step >= 2;
  const {
    previewHtml,
    status: previewStatus,
    error: previewError,
    summary: previewSummary,
    issues: previewIssues,
    refresh: refreshPreview,
    abort: abortPreview,
  } = useOfferPreview({
    title,
    projectDetails,
    projectDetailsText,
    enabled: previewEnabled,
    debounceMs: PREVIEW_DEBOUNCE_MS,
  });

  // Draft persistence - only save when step 3 is reached AND AI text is generated
  const shouldSaveDraft = Boolean(
    step === 3 &&
      previewHtml.trim() &&
      previewHtml !== `<p>${t('offers.wizard.preview.idle')}</p>` &&
      previewStatus === 'success',
  );
  const wizardData = useMemo(
    () => ({
      step,
      title,
      projectDetails,
      pricingRows,
      previewHtml: shouldSaveDraft ? previewHtml : undefined,
    }),
    [step, title, projectDetails, pricingRows, previewHtml, shouldSaveDraft],
  );
  const { loadDraft, clearDraft } = useDraftPersistence(
    'wizard-state',
    wizardData,
    shouldSaveDraft,
  );

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      // Restore draft state if available
      if (saved.title && typeof saved.title === 'string') {
        setTitle(saved.title);
      }
      if (saved.projectDetails && typeof saved.projectDetails === 'object') {
        setProjectDetails(saved.projectDetails);
      }
      if (saved.pricingRows && Array.isArray(saved.pricingRows) && saved.pricingRows.length > 0) {
        // Ensure all rows have required fields and valid structure
        const validRows = saved.pricingRows
          .filter((row): row is PriceRow => {
            return (
              row &&
              typeof row === 'object' &&
              typeof row.id === 'string' &&
              typeof row.name === 'string' &&
              typeof row.qty === 'number' &&
              typeof row.unit === 'string' &&
              typeof row.unitPrice === 'number' &&
              typeof row.vat === 'number'
            );
          })
          .map((row) => ({
            id: row.id,
            name: row.name ?? '',
            qty: row.qty ?? 1,
            unit: row.unit ?? 'db',
            unitPrice: row.unitPrice ?? 0,
            vat: row.vat ?? 27,
          }));
        if (validRows.length > 0) {
          setPricingRows(validRows);
        }
      }
      // Only restore to step 3 if previewHtml was saved (AI text was generated)
      if (saved.step && typeof saved.step === 'number' && saved.step === 3 && saved.previewHtml) {
        // Use restoreStep to bypass validation when restoring draft
        // Small delay ensures state updates are processed first
        setTimeout(() => {
          restoreStep(saved.step as WizardStep);
        }, 0);
      } else if (saved.step && typeof saved.step === 'number' && saved.step < 3) {
        // Allow restoring to step 1 or 2 (but don't save drafts for these steps going forward)
        setTimeout(() => {
          restoreStep(saved.step as WizardStep);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activePreviewTab, setActivePreviewTab] = useState<OfferPreviewTab>('document');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use ref to track submitting state to avoid dependency issues that could cause infinite loops
  const isSubmittingRef = useRef(false);
  const templateOptions = useMemo(() => {
    try {
      const templates = listTemplates();
      // Validate templates have required structure
      if (!Array.isArray(templates)) {
        logger.error('listTemplates returned non-array', { templates });
        return [];
      }
      return templates;
    } catch (error) {
      logger.error('Failed to load templates', error);
      // Return empty array as fallback - defaultTemplateId will handle it
      return [];
    }
  }, [logger]);
  const defaultTemplateId = useMemo<TemplateId>(() => {
    try {
      // Ensure templateOptions is valid
      if (!Array.isArray(templateOptions) || templateOptions.length === 0) {
        return DEFAULT_OFFER_TEMPLATE_ID as TemplateId;
      }
      // Find template matching default ID, or use first available
      const defaultMatch = templateOptions.find(
        (template) => template?.id === DEFAULT_OFFER_TEMPLATE_ID,
      );
      if (defaultMatch?.id) {
        return defaultMatch.id;
      }
      // If no match and templates exist, use first one
      if (templateOptions[0]?.id) {
        return templateOptions[0].id;
      }
      // Fallback to default ID (will be validated later)
      return DEFAULT_OFFER_TEMPLATE_ID as TemplateId;
    } catch (error) {
      logger.error('Failed to compute default template ID', error);
      return DEFAULT_OFFER_TEMPLATE_ID as TemplateId;
    }
  }, [templateOptions, logger]);
  // Initialize selectedTemplateId with a safe default, then update it in useEffect
  // This prevents issues if defaultTemplateId is not yet computed during initial render
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(
    DEFAULT_OFFER_TEMPLATE_ID as TemplateId,
  );

  // Update selectedTemplateId once defaultTemplateId is computed
  useEffect(() => {
    if (defaultTemplateId) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [defaultTemplateId]);
  const [brandingPrimary, setBrandingPrimary] = useState('#1c274c');
  const [brandingSecondary, setBrandingSecondary] = useState('#e2e8f0');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');

  // Activities and profile settings state
  type Activity = {
    id: string;
    name: string;
    unit: string;
    default_unit_price: number;
    default_vat: number;
    reference_images?: string[] | null;
  };
  type ClientForm = {
    company_name: string;
    address?: string;
    tax_id?: string;
    representative?: string;
    phone?: string;
    email?: string;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profileSettings, setProfileSettings] = useState<{
    enable_reference_photos: boolean;
    enable_testimonials: boolean;
  }>({
    enable_reference_photos: false,
    enable_testimonials: false,
  });
  const [client, setClient] = useState<ClientForm>({
    company_name: '',
  });
  const [clientList, setClientList] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [selectedTestimonialsContent, setSelectedTestimonialsContent] = useState<
    Array<{ id: string; text: string }>
  >([]);
  const [guarantees, setGuarantees] = useState<
    Array<{
      id: string;
      text: string;
      activity_ids: string[];
    }>
  >([]);
  const [selectedGuaranteeIds, setSelectedGuaranteeIds] = useState<string[]>([]);
  const isCreatingClientRef = useRef(false); // Prevent race condition in client creation

  // Filter clients based on company name input
  const filteredClients = useMemo(() => {
    if (!client.company_name.trim()) {
      return clientList.slice(0, 10);
    }
    const query = client.company_name.toLowerCase().trim();
    return clientList
      .filter(
        (c) =>
          c.company_name.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)),
      )
      .slice(0, 10);
  }, [client.company_name, clientList]);

  // Load activities and profile settings on mount - parallel loading for better performance
  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      try {
        // Load all data in parallel for better performance
        const [profileResult, activitiesResult, clientsResult, guaranteesResult] =
          await Promise.all([
            supabase
              .from('profiles')
              .select(
                'enable_reference_photos, enable_testimonials, brand_color_primary, brand_color_secondary, brand_logo_path, brand_logo_url',
              )
              .eq('id', user.id)
              .single(),
            supabase
              .from('activities')
              .select('id,name,unit,default_unit_price,default_vat,reference_images')
              .eq('user_id', user.id)
              .order('name'),
            supabase
              .from('clients')
              .select('id,company_name,address,tax_id,representative,phone,email')
              .eq('user_id', user.id)
              .order('company_name')
              .limit(100),
            supabase
              .from('guarantees')
              .select('id, text, activity_guarantees(activity_id)')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true }),
          ]);

        if (!active) return;

        // Handle profile settings and branding
        if (profileResult.data && !profileResult.error) {
          setProfileSettings({
            enable_reference_photos: profileResult.data.enable_reference_photos ?? false,
            enable_testimonials: profileResult.data.enable_testimonials ?? false,
          });

          // Load branding colors
          const primaryColor = normalizeBrandHex(profileResult.data.brand_color_primary ?? null);
          const secondaryColor = normalizeBrandHex(
            profileResult.data.brand_color_secondary ?? null,
          );
          if (primaryColor) {
            setBrandingPrimary(primaryColor);
          }
          if (secondaryColor) {
            setBrandingSecondary(secondaryColor);
          }

          // Load brand logo URL
          try {
            const logoUrl = await getBrandLogoUrl(
              supabase,
              profileResult.data.brand_logo_path ?? null,
              profileResult.data.brand_logo_url ?? null,
            );
            if (active && logoUrl) {
              setBrandingLogoUrl(logoUrl);
            }
          } catch (logoError) {
            // Silently handle logo loading errors - it's optional
            // Logo is optional, so we don't need to log errors in production
          }
        }

        // Handle activities
        if (activitiesResult.error) {
          logger.error('Failed to load activities', activitiesResult.error);
        } else {
          setActivities(activitiesResult.data || []);
        }

        // Handle clients
        if (clientsResult.error) {
          logger.error('Failed to load clients', clientsResult.error);
          // Show error but don't block - clients are optional
        } else {
          setClientList(clientsResult.data || []);
        }

        // Handle guarantees
        if (guaranteesResult.error) {
          logger.error('Failed to load guarantees', guaranteesResult.error);
          // Set empty array on error to prevent component crash
          if (active) {
            setGuarantees([]);
          }
        } else {
          try {
            const formattedGuarantees = (guaranteesResult.data || [])
              .filter((row) => row && typeof row === 'object' && row.id) // Validate row structure
              .map((row) => {
                try {
                  // Safely handle activity_guarantees - it might be null, undefined, or not an array
                  const activityGuarantees = row.activity_guarantees;
                  const activityIds =
                    Array.isArray(activityGuarantees) && activityGuarantees.length > 0
                      ? activityGuarantees
                          .map((link: unknown) => {
                            if (
                              link &&
                              typeof link === 'object' &&
                              'activity_id' in link &&
                              typeof link.activity_id === 'string'
                            ) {
                              return link.activity_id;
                            }
                            return null;
                          })
                          .filter((id): id is string => typeof id === 'string' && id.length > 0)
                      : [];

                  return {
                    id: row.id,
                    text: typeof row.text === 'string' ? row.text : '',
                    activity_ids: activityIds,
                  };
                } catch (rowError) {
                  logger.warn('Failed to format guarantee row', {
                    error: rowError,
                    rowId: row.id,
                  });
                  // Return a safe fallback for this row
                  return {
                    id: row.id,
                    text: typeof row.text === 'string' ? row.text : '',
                    activity_ids: [],
                  };
                }
              });
            if (active) {
              setGuarantees(formattedGuarantees);
            }
          } catch (formatError) {
            logger.error('Failed to format guarantees data', formatError);
            if (active) {
              setGuarantees([]);
            }
          }
        }
      } catch (error) {
        // Catch any unexpected errors from Promise.all or data processing
        logger.error('Failed to load wizard data', error);
        // Set empty arrays as fallback to prevent component crash
        if (active) {
          setActivities([]);
          setClientList([]);
          setGuarantees([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user, supabase, logger]);

  // Fetch testimonials content when testimonials are selected
  useEffect(() => {
    if (!user || !profileSettings.enable_testimonials || selectedTestimonials.length === 0) {
      setSelectedTestimonialsContent((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('id, text')
          .eq('user_id', user.id)
          .in('id', selectedTestimonials);

        if (active && !error && data) {
          setSelectedTestimonialsContent(
            data.map((t) => ({ id: t.id, text: t.text })).filter((t) => t.text.trim().length > 0),
          );
        }
      } catch (error) {
        logger.error('Failed to fetch testimonials', error);
        if (active) {
          setSelectedTestimonialsContent([]);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user, supabase, logger, profileSettings.enable_testimonials, selectedTestimonials]);

  // Reload activities after saving a new one
  const handleActivitySaved = useCallback(
    async (newActivity?: Activity) => {
      if (!newActivity || !user) return;
      // Optimistically add to list
      setActivities((prev) => {
        const exists = prev.some((a) => a.id === newActivity.id);
        if (exists) {
          return prev.map((a) => (a.id === newActivity.id ? newActivity : a));
        }
        return [...prev, newActivity].sort((a, b) => a.name.localeCompare(b.name));
      });
      // Reload from database to get accurate data
      const { data: acts, error } = await supabase
        .from('activities')
        .select('id,name,unit,default_unit_price,default_vat,reference_images')
        .eq('user_id', user.id)
        .order('name');
      if (!error && acts) {
        setActivities(acts);
      }
    },
    [user, supabase],
  );

  const handleClientSelect = useCallback((selectedClient: Client) => {
    setClient({
      company_name: selectedClient.company_name || '',
      address: selectedClient.address || '',
      tax_id: selectedClient.tax_id || '',
      representative: selectedClient.representative || '',
      phone: selectedClient.phone || '',
      email: selectedClient.email || '',
    });
  }, []);

  const handleToggleGuarantee = useCallback((guaranteeId: string) => {
    setSelectedGuaranteeIds((prev) => {
      if (prev.includes(guaranteeId)) {
        return prev.filter((id) => id !== guaranteeId);
      }
      return [...prev, guaranteeId];
    });
  }, []);

  const handleActivityGuaranteeAttach = useCallback(
    (activityId: string) => {
      const linkedGuarantees = guarantees
        .filter((g) => g.activity_ids.includes(activityId))
        .map((g) => g.id);
      if (linkedGuarantees.length > 0) {
        setSelectedGuaranteeIds((prev) => {
          const next = [...prev];
          for (const guaranteeId of linkedGuarantees) {
            if (!next.includes(guaranteeId)) {
              next.push(guaranteeId);
            }
          }
          return next;
        });
      }
    },
    [guarantees],
  );

  const { totals } = usePricingRows(pricingRows);
  const [previewDocumentHtml, setPreviewDocumentHtml] = useState('');
  const previewDocumentAbortRef = useRef<AbortController | null>(null);
  const previewDocumentDebounceRef = useRef<number | null>(null);
  const isStreaming = previewStatus === 'loading' || previewStatus === 'streaming';
  const hasPricingRows = useMemo(
    () => pricingRows.some((row) => row.name.trim().length > 0),
    [pricingRows],
  );
  const isSubmitDisabled =
    isSubmitting ||
    isStreaming ||
    !previewHtml.trim() ||
    !hasPricingRows ||
    title.trim().length === 0 ||
    projectDetailsText.trim().length === 0;

  useEffect(() => {
    // Clear any existing debounce timeout
    if (previewDocumentDebounceRef.current) {
      window.clearTimeout(previewDocumentDebounceRef.current);
      previewDocumentDebounceRef.current = null;
    }

    // Abort any in-flight request
    if (previewDocumentAbortRef.current) {
      previewDocumentAbortRef.current.abort();
      previewDocumentAbortRef.current = null;
    }

    // Debounce the API call
    previewDocumentDebounceRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      previewDocumentAbortRef.current = controller;

      const resolvedTemplateId = templateOptions.some(
        (template) => template.id === selectedTemplateId,
      )
        ? selectedTemplateId
        : defaultTemplateId;
      const trimmedPrimary = brandingPrimary.trim();
      const trimmedSecondary = brandingSecondary.trim();
      const trimmedLogo = brandingLogoUrl.trim();
      // Only include logoUrl if it's a valid URL (not empty and not just whitespace)
      const isValidLogoUrl = trimmedLogo && trimmedLogo.length > 0;
      const brandingPayload =
        trimmedPrimary || trimmedSecondary || isValidLogoUrl
          ? {
              primaryColor: trimmedPrimary || undefined,
              secondaryColor: trimmedSecondary || undefined,
              logoUrl: isValidLogoUrl ? trimmedLogo : undefined,
            }
          : undefined;

      const payload = {
        title: title || t('offers.wizard.defaults.fallbackTitle'),
        companyName: t('offers.wizard.defaults.fallbackCompany'),
        bodyHtml: previewHtml || `<p>${t('offers.wizard.preview.idle')}</p>`,
        rows: pricingRows.map(({ name, qty, unit, unitPrice, vat }) => ({
          name,
          qty,
          unit,
          unitPrice,
          vat,
        })),
        templateId: resolvedTemplateId,
        branding: brandingPayload,
        locale: 'hu',
        schedule: [],
        testimonials: selectedTestimonialsContent
          .map((t) => t.text.trim())
          .filter((text) => text.length > 0)
          .slice(0, 3), // Enforce max 3 testimonials
        guarantees: selectedGuaranteeIds
          .map((id) => guarantees.find((g) => g.id === id)?.text.trim())
          .filter((text): text is string => Boolean(text && text.length > 0))
          .slice(0, 5), // Enforce max 5 guarantees
        formality: 'tegeződés' as const, // Default formality for dashboard wizard
        tone: 'friendly' as const, // Default tone for dashboard wizard
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

          if (controller.signal.aborted) {
            return;
          }

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Preview render failed: ${response.status} ${errorText}`);
          }

          const html = await response.text();
          if (!controller.signal.aborted) {
            setPreviewDocumentHtml(html);
          }
        } catch (error) {
          if (isAbortError(error) || controller.signal.aborted) {
            return;
          }
          logger.error('Failed to render preview document', error, {
            templateId: resolvedTemplateId,
            title: title || undefined,
          });
          if (!controller.signal.aborted) {
            const fallbackMessage = t('errors.preview.fetchUnknown');
            setPreviewDocumentHtml(
              `<!DOCTYPE html>\n<html><head><meta charset="UTF-8" /></head><body><main><p>${fallbackMessage}</p></main></body></html>`,
            );
          }
        }
      })();
    }, PREVIEW_DEBOUNCE_MS); // Use the existing constant

    return () => {
      if (previewDocumentDebounceRef.current) {
        window.clearTimeout(previewDocumentDebounceRef.current);
        previewDocumentDebounceRef.current = null;
      }
      if (previewDocumentAbortRef.current) {
        previewDocumentAbortRef.current.abort();
        previewDocumentAbortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    previewHtml,
    pricingRows,
    title,
    selectedTemplateId,
    brandingPrimary,
    brandingSecondary,
    brandingLogoUrl,
    templateOptions,
    defaultTemplateId,
    selectedTestimonialsContent,
    selectedGuaranteeIds,
    guarantees,
  ]);

  // Simplified mobile action bar - always visible on mobile
  // Note: Action bar visibility is handled by component logic, no need for resize listener

  // Track step views
  useEffect(() => {
    trackWizardEvent({ type: 'wizard_step_viewed', step });
  }, [step]);

  // Track draft loading (only once on mount)
  const hasTrackedDraftLoad = useRef(false);
  useEffect(() => {
    if (hasTrackedDraftLoad.current) return;
    const saved = loadDraft();
    if (saved) {
      hasTrackedDraftLoad.current = true;
      trackWizardEvent({ type: 'wizard_draft_loaded' });
    }
  }, [loadDraft]);

  // Keyboard shortcuts
  const goNext = useCallback(() => {
    const success = goNextInternal();
    if (!success && attemptedSteps[step]) {
      // Track validation error
      const stepFields = validation.fields[step];
      let firstErrorField: string | undefined;
      if (stepFields) {
        if (step === 1) {
          // Step 1 has title and projectDetails
          const step1Fields = stepFields as {
            title?: string;
            projectDetails?: Record<string, string>;
          };
          if (step1Fields.title) {
            firstErrorField = 'title';
          } else if (
            step1Fields.projectDetails &&
            Object.keys(step1Fields.projectDetails).length > 0
          ) {
            firstErrorField = Object.keys(step1Fields.projectDetails)[0];
          }
        } else if (step === 2) {
          // Step 2 has pricing
          const step2Fields = stepFields as { pricing?: string };
          if (step2Fields.pricing) {
            firstErrorField = 'pricing';
          }
        }
      }
      if (firstErrorField) {
        trackWizardEvent({
          type: 'wizard_validation_error',
          step,
          field: firstErrorField,
        });
      }
      // Scroll to first error if validation fails
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstError as HTMLElement).focus();
      }
    } else if (success) {
      // Track step completion
      trackWizardEvent({ type: 'wizard_step_completed', step });
    }
  }, [goNextInternal, attemptedSteps, step, validation]);

  // Reset preview tab when step changes
  useEffect(() => {
    if (step !== 3) {
      setActivePreviewTab('document');
    }
  }, [step]);

  // Close client dropdown when navigating away from step 2
  useEffect(() => {
    if (step !== 2) {
      setShowClientDropdown(false);
    }
  }, [step]);

  // Abort preview generation on unmount
  useEffect(() => {
    return () => {
      abortPreview();
    };
  }, [abortPreview]);

  const stepLabels = useMemo(
    () => ({
      1: t('offers.wizard.steps.details'),
      2: t('offers.wizard.steps.pricing'),
      3: t('offers.wizard.steps.summary'),
    }),
    [],
  ) as Record<WizardStep, string>;

  const wizardSteps = useMemo(() => {
    const definitions: Array<{ label: string; id: 1 | 2 | 3 }> = [
      { label: stepLabels[1], id: 1 },
      { label: stepLabels[2], id: 2 },
      { label: stepLabels[3], id: 3 },
    ];

    return definitions.map(({ label, id }) => {
      const hasErrors = (validation.steps[id]?.length ?? 0) > 0;
      const attempted = attemptedSteps[id];
      const status: StepIndicatorStep['status'] =
        step === id ? 'current' : isStepValid(id) && step > id ? 'completed' : 'upcoming';
      const tone: StepIndicatorStep['tone'] = attempted && hasErrors ? 'error' : 'default';

      return {
        label,
        status,
        tone,
        onSelect: () => goToStep(id),
      } satisfies StepIndicatorStep;
    });
  }, [attemptedSteps, goToStep, isStepValid, step, stepLabels, validation.steps]);

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    const trimmedTitle = title.trim();
    const normalizedDetails = Object.fromEntries(
      Object.entries(projectDetails).map(([key, value]) => [key, value.trim()]),
    ) as typeof projectDetails;
    const trimmedDetails = projectDetailsText.trim();
    const trimmedPreview = previewHtml.trim();

    if (!trimmedTitle || !trimmedDetails) {
      showToast({
        title: t('toasts.offers.missingDetails.title'),
        description: t('toasts.offers.missingDetails.description'),
        variant: 'error',
      });
      return;
    }

    if (!hasPricingRows) {
      showToast({
        title: t('toasts.offers.missingItems.title'),
        description: t('toasts.offers.missingItems.description'),
        variant: 'error',
      });
      return;
    }

    if (!previewHtml.trim()) {
      showToast({
        title: t('toasts.offers.missingPreview.title'),
        description: t('toasts.offers.missingPreview.description'),
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const serializedPrices = pricingRows.map(({ name, qty, unit, unitPrice, vat }) => ({
        name,
        qty,
        unit,
        unitPrice,
        vat,
      }));

      // Resolve template ID - use selected template or fall back to default
      const resolvedTemplateId = templateOptions.some(
        (template) => template.id === selectedTemplateId,
      )
        ? selectedTemplateId
        : defaultTemplateId;

      // Get selected guarantee texts (with length limits for API safety)
      const selectedGuaranteeTexts = selectedGuaranteeIds
        .map((id) => guarantees.find((g) => g.id === id)?.text.trim())
        .filter((text): text is string => Boolean(text && text.length > 0 && text.length <= 500))
        .slice(0, 5); // Enforce max 5 guarantees

      // Get testimonials texts (with length limits for API safety)
      const testimonialsTexts = selectedTestimonialsContent
        .map((t) => t.text.trim())
        .filter((text) => text.length > 0 && text.length <= 1000)
        .slice(0, 3); // Enforce max 3 testimonials

      // Find or create client if company name is provided
      let resolvedClientId: string | null = null;
      if (client.company_name.trim()) {
        // Try to find existing client (case-insensitive)
        const trimmedCompanyName = client.company_name.trim();
        const existingClient = clientList.find(
          (c) => c.company_name.toLowerCase().trim() === trimmedCompanyName.toLowerCase(),
        );
        if (existingClient) {
          resolvedClientId = existingClient.id;
        } else if (!isCreatingClientRef.current) {
          // Prevent race condition - only create if not already creating
          isCreatingClientRef.current = true;
          // Create new client - validate email format if provided
          const trimmedEmail = client.email?.trim();
          if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            isCreatingClientRef.current = false;
            showToast({
              title: 'Érvénytelen e-mail cím',
              description: 'Kérjük, adjon meg egy érvényes e-mail címet.',
              variant: 'error',
            });
            setIsSubmitting(false);
            return;
          }

          try {
            const { data: newClient, error: createError } = await supabase
              .from('clients')
              .insert({
                user_id: user?.id,
                company_name: trimmedCompanyName,
                address: client.address?.trim() || null,
                tax_id: client.tax_id?.trim() || null,
                representative: client.representative?.trim() || null,
                phone: client.phone?.trim() || null,
                email: trimmedEmail || null,
              })
              .select('id')
              .single();

            if (createError) {
              logger.error('Failed to create client', createError);
              // Check if it's a duplicate error (client already exists)
              if (createError.code === '23505') {
                // Unique constraint violation - client might have been created between check and insert
                // Try to fetch it again
                const { data: existing } = await supabase
                  .from('clients')
                  .select('id')
                  .eq('user_id', user?.id)
                  .ilike('company_name', trimmedCompanyName)
                  .single();
                if (existing) {
                  resolvedClientId = existing.id;
                } else {
                  showToast({
                    title: 'Nem sikerült létrehozni az ügyfelet',
                    description: createError.message || 'Próbálja meg újra.',
                    variant: 'error',
                  });
                  setIsSubmitting(false);
                  return;
                }
              } else {
                showToast({
                  title: 'Nem sikerült létrehozni az ügyfelet',
                  description:
                    createError.message || 'A folytatáshoz nem szükséges az ügyfél adata.',
                  variant: 'warning',
                });
                // Continue without client ID - non-critical
              }
            } else if (newClient) {
              resolvedClientId = newClient.id;
              // Update client list optimistically
              setClientList((prev) => [
                ...prev,
                {
                  id: newClient.id,
                  company_name: trimmedCompanyName,
                  ...(client.address?.trim() && { address: client.address.trim() }),
                  ...(client.tax_id?.trim() && { tax_id: client.tax_id.trim() }),
                  ...(client.representative?.trim() && {
                    representative: client.representative.trim(),
                  }),
                  ...(client.phone?.trim() && { phone: client.phone.trim() }),
                  ...(trimmedEmail && { email: trimmedEmail }),
                },
              ]);
            }
            isCreatingClientRef.current = false;
          } catch (error) {
            isCreatingClientRef.current = false;
            logger.error('Failed to create client', error);
            showToast({
              title: 'Nem sikerült létrehozni az ügyfelet',
              description:
                error instanceof Error
                  ? error.message
                  : 'A folytatáshoz nem szükséges az ügyfél adata.',
              variant: 'warning',
            });
            // Continue without client ID if creation fails - non-critical
          }
        }
      }

      const response = await fetchWithSupabaseAuth('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          industry: 'Egyedi projekt',
          projectDetails: normalizedDetails,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
          prices: serializedPrices,
          aiOverrideHtml: trimmedPreview,
          templateId: resolvedTemplateId, // Explicitly pass template ID
          clientId: resolvedClientId,
          imageAssets: [], // Reference images not yet supported in dashboard wizard
          schedule: [],
          testimonials: testimonialsTexts.slice(0, 3), // Enforce max 3 testimonials
          guarantees: selectedGuaranteeTexts.slice(0, 5), // Enforce max 5 guarantees
        }),
        authErrorMessage: t('errors.offer.saveAuth'),
        errorMessageBuilder: (status) => t('errors.offer.saveStatus', { status }),
        defaultErrorMessage: t('errors.offer.saveUnknown'),
      });

      // Check response status before parsing
      if (!response.ok) {
        let errorMessage = t('errors.offer.saveFailed');
        try {
          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json().catch(() => ({}));
            if (typeof errorData.error === 'string' && errorData.error) {
              errorMessage = errorData.error;
            } else if (typeof errorData.message === 'string' && errorData.message) {
              errorMessage = errorData.message;
            }
          } else {
            // Try to get text if not JSON
            const text = await response.text().catch(() => '');
            if (text) {
              errorMessage = text;
            }
          }
        } catch (parseError) {
          logger.error('Failed to parse error response', parseError);
          // Use default error message if parsing fails
        }
        throw new ApiError(errorMessage, { status: response.status });
      }

      type GenerateResponse = { ok?: boolean; error?: string | null } | null;
      let payload: GenerateResponse = null;
      try {
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const value = await response.json();
          payload = value && typeof value === 'object' ? (value as GenerateResponse) : null;
        } else {
          logger.warn('Response is not JSON', { contentType });
          throw new ApiError(t('errors.offer.saveFailed'));
        }
      } catch (parseError) {
        logger.error('Failed to parse success response', parseError);
        throw new ApiError(t('errors.offer.saveFailed'));
      }

      if (!payload?.ok) {
        const message =
          typeof payload?.error === 'string' && payload.error
            ? payload.error
            : t('errors.offer.saveFailed');
        throw new ApiError(message);
      }

      showToast({
        title: t('toasts.offers.saveSuccess.title'),
        description: t('toasts.offers.saveSuccess.description'),
        variant: 'success',
      });
      router.replace('/dashboard');
      clearDraft();
      trackWizardEvent({ type: 'wizard_offer_submitted', success: true });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t('errors.offer.saveUnknown');
      showToast({
        title: t('toasts.offers.saveFailed.title'),
        description: message || t('toasts.offers.saveFailed.description'),
        variant: 'error',
      });
      trackWizardEvent({ type: 'wizard_offer_submitted', success: false });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    hasPricingRows,
    previewHtml,
    pricingRows,
    projectDetails,
    projectDetailsText,
    router,
    showToast,
    title,
    clearDraft,
    defaultTemplateId,
    selectedTemplateId,
    templateOptions,
    selectedTestimonialsContent,
    selectedGuaranteeIds,
    guarantees,
    client,
    clientList,
    user,
    supabase,
    logger,
  ]);

  const handleCancel = useCallback(() => {
    // Clear draft from localStorage
    clearDraft();

    // Reset wizard state
    resetWizard();

    // Reset all form state
    setClient({ company_name: '' });
    setSelectedTestimonials([]);
    setSelectedTestimonialsContent([]);
    setSelectedGuaranteeIds([]);
    setSelectedImages([]);
    setShowClientDropdown(false);
    setSelectedTemplateId(defaultTemplateId);
    setBrandingPrimary('#1c274c');
    setBrandingSecondary('#e2e8f0');
    setBrandingLogoUrl('');
    setActivePreviewTab('document');

    // Abort any ongoing preview generation
    abortPreview();

    // Show confirmation toast
    showToast({
      title: 'Vázlat törölve',
      description: 'A vázlat törölve lett. Most új ajánlatot hozhatsz létre.',
      variant: 'success',
    });

    // Stay on the page so user can immediately start creating a new offer
    // The draft is cleared, so it won't reload on next visit
  }, [clearDraft, resetWizard, defaultTemplateId, abortPreview, showToast]);

  useWizardKeyboardShortcuts({
    step,
    onNext: goNext,
    onPrev: goPrev,
    onSubmit: handleSubmit,
    isNextDisabled,
    isSubmitDisabled,
    enabled: !isSubmitting && !isStreaming,
  });

  const columnWidthStyle: CSSProperties = { '--column-width': 'min(100%, 42rem)' } as CSSProperties;
  const validationPreviewIssues = useMemo(
    () =>
      validation.issues
        .filter((issue) => attemptedSteps[issue.step])
        .map(({ severity, message }) => ({ severity, message })),
    [attemptedSteps, validation.issues],
  );

  const detailFieldErrors =
    attemptedSteps[1] && validation.fields[1]
      ? (() => {
          const fields = validation.fields[1];
          const errors: {
            title?: string;
            projectDetails?: Partial<Record<string, string>>;
          } = {};
          if (fields.title) {
            errors.title = fields.title;
          }
          if (fields.projectDetails && Object.keys(fields.projectDetails).length > 0) {
            errors.projectDetails = fields.projectDetails;
          }
          return Object.keys(errors).length > 0 ? errors : undefined;
        })()
      : undefined;
  const pricingSectionError = attemptedSteps[2] ? validation.fields[2]?.pricing : undefined;

  // Safety check: show loading state if auth is still loading
  // This prevents errors if user data is not yet available
  if (authStatus === 'loading') {
    return (
      <PageErrorBoundary>
        <AppFrame
          title={t('offers.wizard.pageTitle')}
          description={t('offers.wizard.pageDescription')}
        >
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-sm text-fg-muted">{t('app.loading')}</p>
            </div>
          </div>
        </AppFrame>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <AppFrame
        title={t('offers.wizard.pageTitle')}
        description={t('offers.wizard.pageDescription')}
      >
        <div
          className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start md:gap-10 lg:gap-12"
          style={columnWidthStyle}
        >
          <div className="flex flex-col gap-8">
            <div className="grid w-full max-w-[var(--column-width)] grid-cols-1 gap-8">
              <Card className="w-full space-y-4">
                <StepIndicator steps={wizardSteps} />
              </Card>

              {step === 1 && (
                <StepErrorBoundary stepNumber={1}>
                  <OfferProjectDetailsSection
                    title={title}
                    projectDetails={projectDetails}
                    onTitleChange={(event) => setTitle(event.target.value)}
                    onProjectDetailsChange={(field, value) =>
                      setProjectDetails((prev) => ({ ...prev, [field]: value }))
                    }
                    showInlineValidation={true}
                    {...(detailFieldErrors ? { errors: detailFieldErrors } : {})}
                  />
                </StepErrorBoundary>
              )}

              {step === 2 && (
                <StepErrorBoundary stepNumber={2}>
                  <WizardStep2Pricing
                    rows={pricingRows}
                    onRowsChange={setPricingRows}
                    activities={activities}
                    {...(pricingSectionError ? { validationError: pricingSectionError } : {})}
                    client={client}
                    onClientChange={(updates) => setClient((prev) => ({ ...prev, ...updates }))}
                    clientList={clientList}
                    onClientSelect={handleClientSelect}
                    showClientDropdown={showClientDropdown}
                    onClientDropdownToggle={setShowClientDropdown}
                    filteredClients={filteredClients}
                    onActivitySaved={handleActivitySaved}
                    enableReferencePhotos={profileSettings.enable_reference_photos}
                    enableTestimonials={profileSettings.enable_testimonials}
                    selectedImages={selectedImages}
                    onSelectedImagesChange={setSelectedImages}
                    selectedTestimonials={selectedTestimonials}
                    onSelectedTestimonialsChange={setSelectedTestimonials}
                    guarantees={guarantees}
                    selectedGuaranteeIds={selectedGuaranteeIds}
                    onToggleGuarantee={handleToggleGuarantee}
                    manualGuaranteeCount={0}
                    guaranteeLimit={5}
                    onActivityGuaranteesAttach={handleActivityGuaranteeAttach}
                  />
                </StepErrorBoundary>
              )}

              {step === 3 && (
                <StepErrorBoundary stepNumber={3}>
                  <div className="space-y-6">
                    <OfferSummarySection
                      title={title}
                      projectDetails={projectDetails}
                      totals={totals}
                    />
                    {previewStatus === 'loading' && (
                      <Card>
                        <CardHeader>
                          <h2 className="text-sm font-semibold text-fg">
                            {t('offers.wizard.aiText.heading')}
                          </h2>
                        </CardHeader>
                        <div className="text-sm text-fg-muted">
                          {t('offers.wizard.aiText.generating')}
                        </div>
                      </Card>
                    )}
                    {previewStatus === 'error' && previewError && (
                      <Card>
                        <CardHeader>
                          <h2 className="text-sm font-semibold text-fg">
                            {t('offers.wizard.aiText.heading')}
                          </h2>
                        </CardHeader>
                        <div className="text-sm text-danger">{previewError}</div>
                      </Card>
                    )}
                    {previewHtml &&
                      previewHtml.trim() &&
                      previewHtml !== `<p>${t('offers.wizard.preview.idle')}</p>` && (
                        <Card>
                          <CardHeader>
                            <h2 className="text-sm font-semibold text-fg">
                              {t('offers.wizard.aiText.heading')}
                            </h2>
                          </CardHeader>
                          <div
                            className="prose prose-sm max-w-none text-fg"
                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                          />
                        </Card>
                      )}
                    <PreviewAsCustomerButton
                      title={title}
                      projectDetails={projectDetails}
                      projectDetailsText={projectDetailsText}
                      previewHtml={previewHtml}
                      pricingRows={pricingRows}
                      selectedTemplateId={selectedTemplateId}
                      brandingPrimary={brandingPrimary}
                      brandingSecondary={brandingSecondary}
                      brandingLogoUrl={brandingLogoUrl}
                      scheduleItems={[]}
                      testimonials={selectedTestimonialsContent
                        .map((t) => t.text.trim())
                        .filter((text) => text.length > 0)}
                      guarantees={selectedGuaranteeIds
                        .map((id) => guarantees.find((g) => g.id === id)?.text.trim())
                        .filter((text): text is string => Boolean(text && text.length > 0))}
                      disabled={
                        isSubmitting || isStreaming || !previewHtml.trim() || !hasPricingRows
                      }
                    />
                  </div>
                </StepErrorBoundary>
              )}

              <WizardActionBar
                step={step}
                onPrev={goPrev}
                onNext={goNext}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isNextDisabled={isNextDisabled}
                isSubmitDisabled={isSubmitDisabled}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>

          <WizardPreviewPanel
            previewEnabled={previewEnabled}
            previewHtml={previewHtml}
            previewDocumentHtml={previewDocumentHtml}
            previewStatus={previewStatus}
            previewError={previewError}
            previewSummary={previewSummary}
            previewIssues={previewIssues}
            validationIssues={validationPreviewIssues}
            attemptedSteps={attemptedSteps}
            activeTab={activePreviewTab}
            onTabChange={setActivePreviewTab}
            onRefresh={refreshPreview}
            onAbort={abortPreview}
            // PDF preview modal removed - using Preview as Customer button instead
            isStreaming={isStreaming}
            templateOptions={templateOptions}
            selectedTemplateId={selectedTemplateId}
            defaultTemplateId={defaultTemplateId}
            brandingPrimary={brandingPrimary}
            brandingSecondary={brandingSecondary}
            brandingLogoUrl={brandingLogoUrl}
            onTemplateChange={setSelectedTemplateId}
            onBrandingPrimaryChange={setBrandingPrimary}
            onBrandingSecondaryChange={setBrandingSecondary}
            onBrandingLogoChange={setBrandingLogoUrl}
          />
        </div>
      </AppFrame>
    </PageErrorBoundary>
  );
}
