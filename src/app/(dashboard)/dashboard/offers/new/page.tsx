'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { createClientLogger } from '@/lib/clientLogger';
import AppFrame from '@/components/AppFrame';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { OfferProjectDetailsSection } from '@/components/offers/OfferProjectDetailsSection';
import { OfferPricingSection } from '@/components/offers/OfferPricingSection';
import { OfferSummarySection } from '@/components/offers/OfferSummarySection';
import { WizardActionBar } from '@/components/offers/WizardActionBar';
import { WizardPreviewPanel } from '@/components/offers/WizardPreviewPanel';
import { StepErrorBoundary } from '@/components/offers/StepErrorBoundary';
import { PreviewAsCustomerButton } from '@/components/offers/PreviewAsCustomerButton';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { useToast } from '@/components/ToastProvider';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';
import { useOfferPreview } from '@/hooks/useOfferPreview';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useWizardKeyboardShortcuts } from '@/hooks/useWizardKeyboardShortcuts';
import { trackWizardEvent } from '@/lib/analytics/wizard';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import type { OfferPreviewTab } from '@/types/preview';
import { listTemplates } from '@/lib/offers/templates/index';
import type { TemplateId } from '@/lib/offers/templates/types';
import type { WizardStep } from '@/types/wizard';

const PREVIEW_DEBOUNCE_MS = 600;

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
    isNextDisabled,
    attemptedSteps,
    validation,
    isStepValid,
  } = useOfferWizard();
  const { showToast } = useToast();
  const router = useRouter();
  const logger = useMemo(() => createClientLogger({ component: 'NewOfferPage' }), []);

  // Draft persistence
  const wizardData = useMemo(
    () => ({
      step,
      title,
      projectDetails,
      pricingRows,
    }),
    [step, title, projectDetails, pricingRows],
  );
  const { loadDraft, clearDraft } = useDraftPersistence('wizard-state', wizardData, true);

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      // Restore draft state if available
      // Note: This would require exposing setters from useOfferWizard
      // For now, we'll just use it for auto-save
    }
  }, [loadDraft]);

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

  const [activePreviewTab, setActivePreviewTab] = useState<OfferPreviewTab>('document');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const templateOptions = useMemo(() => listTemplates(), []);
  const defaultTemplateId = useMemo<TemplateId>(() => {
    // Find template matching default ID, or use first available
    const defaultMatch = templateOptions.find(
      (template) => template.id === DEFAULT_OFFER_TEMPLATE_ID,
    );
    return (defaultMatch ?? templateOptions[0])?.id ?? DEFAULT_OFFER_TEMPLATE_ID;
  }, [templateOptions]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(defaultTemplateId);
  const [brandingPrimary, setBrandingPrimary] = useState('#1c274c');
  const [brandingSecondary, setBrandingSecondary] = useState('#e2e8f0');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');

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
      const brandingPayload =
        trimmedPrimary || trimmedSecondary || trimmedLogo
          ? {
              primaryColor: trimmedPrimary || undefined,
              secondaryColor: trimmedSecondary || undefined,
              logoUrl: trimmedLogo || undefined,
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
        testimonials: [],
        guarantees: [],
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
  ]);

  // Simplified mobile action bar - always visible on mobile
  // Note: Action bar visibility is handled by component logic, no need for resize listener

  // Track step views
  useEffect(() => {
    trackWizardEvent({ type: 'wizard_step_viewed', step });
  }, [step]);

  // Track draft loading
  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
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
    if (isSubmitting) {
      return;
    }

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
          clientId: null,
          imageAssets: [],
          schedule: [],
          testimonials: [],
          guarantees: [],
        }),
        authErrorMessage: t('errors.offer.saveAuth'),
        errorMessageBuilder: (status) => t('errors.offer.saveStatus', { status }),
        defaultErrorMessage: t('errors.offer.saveUnknown'),
      });

      type GenerateResponse = { ok?: boolean; error?: string | null } | null;
      const payload: GenerateResponse = await response
        .json()
        .then((value) => (value && typeof value === 'object' ? (value as GenerateResponse) : null))
        .catch(() => null);

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
      setIsSubmitting(false);
    }
  }, [
    hasPricingRows,
    isSubmitting,
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
  ]);

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

  return (
    <AppFrame title={t('offers.wizard.pageTitle')} description={t('offers.wizard.pageDescription')}>
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
                <OfferPricingSection
                  rows={pricingRows}
                  onChange={setPricingRows}
                  {...(pricingSectionError ? { error: pricingSectionError } : {})}
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
                    testimonials={[]}
                    guarantees={[]}
                    disabled={isSubmitting || isStreaming || !previewHtml.trim() || !hasPricingRows}
                  />
                </div>
              </StepErrorBoundary>
            )}

            <WizardActionBar
              step={step}
              onPrev={goPrev}
              onNext={goNext}
              onSubmit={handleSubmit}
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
  );
}
