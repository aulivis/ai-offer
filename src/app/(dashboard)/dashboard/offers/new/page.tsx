'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { OfferProjectDetailsSection } from '@/components/offers/OfferProjectDetailsSection';
import { OfferPricingSection } from '@/components/offers/OfferPricingSection';
import { OfferPreviewCard, type OfferPreviewStatus } from '@/components/offers/OfferPreviewCard';
import { OfferSummarySection } from '@/components/offers/OfferSummarySection';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { useToast } from '@/components/ToastProvider';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';
import { useOfferPreview } from '@/hooks/useOfferPreview';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { OfferPreviewTab, PreviewIssue } from '@/types/preview';
import { listTemplates } from '@/app/pdf/templates/engineRegistry';
import type { OfferTemplate, TemplateId } from '@/app/pdf/templates/types';

const PREVIEW_DEBOUNCE_MS = 600;
const SUCCESS_MESSAGE_TIMEOUT_MS = 4000;
const PREVIEW_MIN_HEIGHT_PX = 720;

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
    goNext,
    goPrev,
    goToStep,
    isNextDisabled,
    attemptedSteps,
    validation,
    isStepValid,
  } = useOfferWizard();
  const { showToast } = useToast();
  const router = useRouter();

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
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionBarVisible, setIsActionBarVisible] = useState(true);
  const templateOptions = useMemo(
    () => listTemplates() as Array<OfferTemplate & { legacyId?: string }>,
    [],
  );
  const defaultTemplateId = useMemo<TemplateId>(() => {
    const legacyMatch = templateOptions.find(
      (template) => template.legacyId === DEFAULT_OFFER_TEMPLATE_ID,
    );
    return (legacyMatch ?? templateOptions[0])?.id ?? DEFAULT_OFFER_TEMPLATE_ID;
  }, [templateOptions]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(defaultTemplateId);
  const [brandingPrimary, setBrandingPrimary] = useState('#1c274c');
  const [brandingSecondary, setBrandingSecondary] = useState('#e2e8f0');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');

  const { totals } = usePricingRows(pricingRows);
  const [previewDocumentHtml, setPreviewDocumentHtml] = useState('');
  const previewDocumentAbortRef = useRef<AbortController | null>(null);
  const isStreaming = previewStatus === 'loading' || previewStatus === 'streaming';
  const hasPricingRows = useMemo(
    () => pricingRows.some((row) => row.name.trim().length > 0),
    [pricingRows],
  );
  const hasPreviewHtml = useMemo(() => {
    const trimmed = previewHtml.trim();
    return trimmed.length > 0 && trimmed !== `<p>${t('offers.wizard.preview.idle')}</p>`;
  }, [previewHtml]);
  const isSubmitDisabled =
    isSubmitting ||
    isStreaming ||
    !hasPreviewHtml ||
    !hasPricingRows ||
    title.trim().length === 0 ||
    projectDetailsText.trim().length === 0;
  const statusDescriptor = useMemo<{
    tone: 'info' | 'success' | 'error' | 'warning';
    title: string;
    description?: string;
  } | null>(() => {
    switch (previewStatus) {
      case 'loading':
        return {
          tone: 'info' as const,
          title: t('offers.wizard.preview.loading'),
          description: t('offers.wizard.preview.loadingHint'),
        };
      case 'streaming':
        return {
          tone: 'info' as const,
          title: t('offers.wizard.preview.streaming'),
          description: t('offers.wizard.preview.loadingHint'),
        };
      case 'success':
        return {
          tone: 'success' as const,
          title: t('offers.wizard.preview.success'),
        };
      case 'error':
        return {
          tone: 'error' as const,
          title: t('offers.wizard.preview.error'),
        };
      case 'aborted':
        return {
          tone: 'warning' as const,
          title: t('errors.preview.aborted'),
        };
      default:
        return null;
    }
  }, [previewStatus]);

  useEffect(() => {
    const controller = new AbortController();
    if (previewDocumentAbortRef.current) {
      previewDocumentAbortRef.current.abort();
    }
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
      bodyHtml: previewHtml || DEFAULT_PREVIEW_HTML,
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
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const updateIsMobile = () => {
      const isMobile = window.innerWidth < 640;
      // Always show action bar on mobile for better UX
      setIsActionBarVisible(true);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  // Reset preview tab when step changes
  useEffect(() => {
    if (step !== 3) {
      setActivePreviewTab('document');
      setIsPreviewModalOpen(false);
    }
  }, [step]);

  const stepLabels = useMemo(
    () => ({
      1: t('offers.wizard.steps.details'),
      2: t('offers.wizard.steps.pricing'),
      3: t('offers.wizard.steps.summary'),
    }),
    [],
  ) as Record<1 | 2 | 3, string>;

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

    if (!hasPreviewHtml) {
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
          clientId: null,
          imageAssets: [],
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
    } finally {
      setIsSubmitting(false);
    }
  }, [
    hasPreviewHtml,
    hasPricingRows,
    isSubmitting,
    previewHtml,
    pricingRows,
    projectDetails,
    projectDetailsText,
    router,
    showToast,
    title,
  ]);

  const columnWidthStyle: CSSProperties = { '--column-width': 'min(100%, 42rem)' };
  const submitLabel = isSubmitting
    ? t('offers.wizard.actions.previewInProgress')
    : t('offers.wizard.actions.save');
  const nextStepLabel = step < 3 ? stepLabels[(step + 1) as 2 | 3] : null;
  const previousStepLabel = step > 1 ? stepLabels[(step - 1) as 1 | 2] : null;
  const nextButtonLabel = nextStepLabel
    ? `${t('offers.wizard.actions.next')}: ${nextStepLabel}`
    : t('offers.wizard.actions.next');
  const backButtonLabel = previousStepLabel
    ? `${t('offers.wizard.actions.back')}: ${previousStepLabel}`
    : t('offers.wizard.actions.back');
  const validationPreviewIssues = useMemo(
    () =>
      validation.issues
        .filter((issue) => attemptedSteps[issue.step])
        .map(({ severity, message }) => ({ severity, message })),
    [attemptedSteps, validation.issues],
  );
  const combinedIssues = useMemo(
    () => [...validationPreviewIssues, ...previewIssues],
    [previewIssues, validationPreviewIssues],
  );
  const previousIssueCountRef = useRef(combinedIssues.length);

  useEffect(() => {
    if (combinedIssues.length > 0 && previousIssueCountRef.current === 0) {
      setActivePreviewTab('issues');
    } else if (
      combinedIssues.length === 0 &&
      previousIssueCountRef.current > 0 &&
      activePreviewTab === 'issues'
    ) {
      setActivePreviewTab('document');
    }

    previousIssueCountRef.current = combinedIssues.length;
  }, [activePreviewTab, combinedIssues.length]);

  const detailFieldErrors = attemptedSteps[1]
    ? {
        title: validation.fields[1].title,
        projectDetails: validation.fields[1].projectDetails,
      }
    : undefined;
  const pricingSectionError = attemptedSteps[2] ? validation.fields[2].pricing : undefined;
  const resolvedTemplateForControls = templateOptions.some(
    (template) => template.id === selectedTemplateId,
  )
    ? selectedTemplateId
    : defaultTemplateId;
  const previewControls = (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700">
          {t('offers.previewCard.controls.title')}
        </p>
        <p className="text-xs text-slate-500">{t('offers.previewCard.controls.helper')}</p>
      </div>
      {templateOptions.length > 0 ? (
        <Select
          label={t('offers.previewCard.controls.templateLabel')}
          value={resolvedTemplateForControls}
          onChange={(event) => setSelectedTemplateId(event.target.value as TemplateId)}
        >
          {templateOptions.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          {t('offers.previewCard.controls.brandingTitle')}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('offers.previewCard.controls.primaryLabel')}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingPrimary}
                onChange={(event) => setBrandingPrimary(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-white"
                aria-label={t('offers.previewCard.controls.primaryLabel')}
              />
              <Input
                value={brandingPrimary}
                onChange={(event) => setBrandingPrimary(event.target.value)}
                className="py-2 text-sm font-mono"
                wrapperClassName="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('offers.previewCard.controls.secondaryLabel')}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingSecondary}
                onChange={(event) => setBrandingSecondary(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-white"
                aria-label={t('offers.previewCard.controls.secondaryLabel')}
              />
              <Input
                value={brandingSecondary}
                onChange={(event) => setBrandingSecondary(event.target.value)}
                className="py-2 text-sm font-mono"
                wrapperClassName="flex-1"
              />
            </div>
          </div>
        </div>
        <Input
          label={t('offers.previewCard.controls.logoLabel')}
          placeholder={t('offers.previewCard.controls.logoPlaceholder')}
          value={brandingLogoUrl}
          onChange={(event) => setBrandingLogoUrl(event.target.value)}
          type="url"
        />
      </div>
    </div>
  );

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
              <OfferProjectDetailsSection
                title={title}
                projectDetails={projectDetails}
                onTitleChange={(event) => setTitle(event.target.value)}
                onProjectDetailsChange={(field, value) =>
                  setProjectDetails((prev) => ({ ...prev, [field]: value }))
                }
                showInlineValidation={true}
                errors={detailFieldErrors}
              />
            )}

            {step === 2 && (
              <OfferPricingSection
                rows={pricingRows}
                onChange={setPricingRows}
                error={pricingSectionError}
              />
            )}

            {step === 3 && (
              <OfferSummarySection title={title} projectDetails={projectDetails} totals={totals} />
            )}

            <div
              className="sticky bottom-0 left-0 right-0 z-30 -mx-6 -mb-6 border-t border-border/70 bg-[rgb(var(--color-bg-muted-rgb)/0.98)] px-6 py-4 shadow-[0_-8px_16px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-300 ease-out sm:static sm:mx-0 sm:mb-0 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none"
            >
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={goPrev}
                  disabled={step === 1}
                  className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
                >
                  {backButtonLabel}
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={goNext}
                    disabled={isNextDisabled}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {nextButtonLabel}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitDisabled}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {submitLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-6 overflow-hidden md:sticky md:top-20 lg:top-24">
          <OfferPreviewCard
            isPreviewAvailable={previewEnabled}
            previewMarkup={previewDocumentHtml}
            hasPreviewMarkup={hasPreviewHtml}
            statusDescriptor={statusDescriptor}
            isStreaming={isStreaming}
            previewStatus={previewStatus}
            previewError={previewError}
            summaryHighlights={previewSummary}
            issues={combinedIssues}
            activeTab={activePreviewTab}
            onTabChange={setActivePreviewTab}
            onAbortPreview={abortPreview}
            onManualRefresh={refreshPreview}
            onOpenFullscreen={() => setIsPreviewModalOpen(true)}
            titleId="offer-preview-card-title"
            controls={previewControls}
          />
        </div>
      </div>
      <Modal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        labelledBy="preview-modal-title"
      >
        <OfferPreviewCard
          isPreviewAvailable={previewEnabled}
          previewMarkup={previewDocumentHtml}
          hasPreviewMarkup={hasPreviewHtml}
          statusDescriptor={statusDescriptor}
          isStreaming={isStreaming}
          previewStatus={previewStatus}
          previewError={previewError}
          summaryHighlights={previewSummary}
          issues={combinedIssues}
          activeTab={activePreviewTab}
          onTabChange={setActivePreviewTab}
          onAbortPreview={abortPreview}
          onManualRefresh={refreshPreview}
          onExitFullscreen={() => setIsPreviewModalOpen(false)}
          titleId="preview-modal-title"
          variant="modal"
          controls={previewControls}
        />
      </Modal>
    </AppFrame>
  );
}
