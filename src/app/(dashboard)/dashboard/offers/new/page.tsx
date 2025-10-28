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
import { offerBodyMarkup } from '@/app/lib/offerDocument';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { useToast } from '@/components/ToastProvider';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DEFAULT_PREVIEW_HTML = `<p>${t('offers.wizard.preview.idle')}</p>`;

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
    inlineErrors,
    isNextDisabled,
    attemptedSteps,
    validation,
    isStepValid,
  } = useOfferWizard();
  const { showToast } = useToast();
  const router = useRouter();

  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_HTML);
  const [previewStatus, setPreviewStatus] = useState<OfferPreviewStatus>('idle');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);
  const previewDebounceRef = useRef<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { totals, pricePreviewHtml } = usePricingRows(pricingRows);
  const previewMarkup = useMemo(() => {
    const safeTitle = title.trim() || t('offers.wizard.defaults.fallbackTitle');
    const bodyHtml = previewHtml || DEFAULT_PREVIEW_HTML;
    return offerBodyMarkup({
      title: safeTitle,
      companyName: t('offers.wizard.defaults.fallbackCompany'),
      aiBodyHtml: bodyHtml,
      priceTableHtml: pricePreviewHtml,
      templateId: DEFAULT_OFFER_TEMPLATE_ID,
    });
  }, [pricePreviewHtml, previewHtml, title]);
  const isStreaming = previewStatus === 'loading' || previewStatus === 'streaming';
  const hasPricingRows = useMemo(
    () => pricingRows.some((row) => row.name.trim().length > 0),
    [pricingRows],
  );
  const hasPreviewHtml = useMemo(() => {
    const trimmed = previewHtml.trim();
    return trimmed.length > 0 && trimmed !== DEFAULT_PREVIEW_HTML;
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

  const callPreview = useCallback(async () => {
    if (step !== 3) {
      return;
    }

    const trimmedTitle = title.trim();
    const normalizedDetails = Object.fromEntries(
      Object.entries(projectDetails).map(([key, value]) => [key, value.trim()]),
    ) as typeof projectDetails;
    const trimmedDetails = projectDetailsText.trim();

    if (!trimmedTitle || !trimmedDetails) {
      if (previewAbortRef.current) {
        previewRequestIdRef.current += 1;
        const controller = previewAbortRef.current;
        previewAbortRef.current = null;
        controller.abort();
      }
      setPreviewHtml(DEFAULT_PREVIEW_HTML);
      setPreviewStatus('idle');
      setPreviewError(null);
      return;
    }

    if (previewAbortRef.current) {
      previewRequestIdRef.current += 1;
      const activeController = previewAbortRef.current;
      previewAbortRef.current = null;
      activeController.abort();
    }

    const nextRequestId = previewRequestIdRef.current + 1;
    previewRequestIdRef.current = nextRequestId;

    setPreviewHtml(DEFAULT_PREVIEW_HTML);
    setPreviewStatus('loading');
    setPreviewError(null);

    const controller = new AbortController();
    previewAbortRef.current = controller;

    try {
      const resp = await fetchWithSupabaseAuth('/api/ai-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: 'Egyedi projekt',
          title: trimmedTitle,
          projectDetails: normalizedDetails,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
        }),
        signal: controller.signal,
        authErrorMessage: t('errors.offer.saveAuth'),
        errorMessageBuilder: (status) => t('errors.preview.fetchStatus', { status }),
        defaultErrorMessage: t('errors.preview.fetchUnknown'),
      });

      if (!resp.body) {
        const message = t('errors.preview.noData');
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewStatus('error');
          setPreviewError(message);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        showToast({
          title: t('toasts.preview.error.title'),
          description: message,
          variant: 'error',
        });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let latestHtml = '';
      let hasDelta = false;
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
              if (!hasDelta && previewRequestIdRef.current === nextRequestId) {
                setPreviewStatus('streaming');
              }
              hasDelta = true;
              if (
                typeof payload.html === 'string' &&
                previewRequestIdRef.current === nextRequestId
              ) {
                latestHtml = payload.html;
                setPreviewHtml(payload.html || DEFAULT_PREVIEW_HTML);
              }
            } else if (payload.type === 'error') {
              streamErrorMessage =
                typeof payload.message === 'string'
                  ? payload.message
                  : t('errors.preview.streamUnknown');
              break;
            }
          } catch (err) {
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
          setPreviewStatus('error');
          setPreviewError(streamErrorMessage);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        showToast({
          title: t('toasts.preview.error.title'),
          description: streamErrorMessage,
          variant: 'error',
        });
        return;
      }

      if (!latestHtml && previewRequestIdRef.current === nextRequestId) {
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
      }

      if (previewRequestIdRef.current === nextRequestId) {
        setPreviewStatus('success');
        setPreviewError(null);
      }
    } catch (error) {
      if (isAbortError(error)) {
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewStatus('aborted');
          setPreviewError(t('errors.preview.aborted'));
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t('errors.preview.fetchUnknown');
      if (previewRequestIdRef.current === nextRequestId) {
        setPreviewStatus('error');
        setPreviewError(message);
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
      }
      showToast({
        title: t('toasts.preview.error.title'),
        description: message,
        variant: 'error',
      });
    } finally {
      if (previewAbortRef.current === controller) {
        previewAbortRef.current = null;
      }
    }
  }, [projectDetails, projectDetailsText, showToast, step, title]);

  const handleManualRefresh = useCallback(() => {
    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }
    void callPreview();
  }, [callPreview]);

  const handleAbortPreview = useCallback(() => {
    const controller = previewAbortRef.current;
    if (!controller) {
      return;
    }
    previewAbortRef.current = null;
    previewRequestIdRef.current += 1;
    controller.abort();
    setPreviewStatus('aborted');
    setPreviewError(t('errors.preview.aborted'));
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
  }, []);

  useEffect(() => {
    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }

    if (step !== 3) {
      return;
    }

    previewDebounceRef.current = window.setTimeout(() => {
      void callPreview();
    }, 600);

    return () => {
      if (previewDebounceRef.current) {
        window.clearTimeout(previewDebounceRef.current);
        previewDebounceRef.current = null;
      }
    };
  }, [callPreview, projectDetailsText, pricingRows, step, title]);

  useEffect(() => {
    if (step === 3) {
      return;
    }

    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }
    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
      previewAbortRef.current = null;
    }
    setPreviewStatus('idle');
    setPreviewError(null);
    setPreviewHtml(DEFAULT_PREVIEW_HTML);
  }, [step]);

  useEffect(() => {
    if (previewStatus !== 'success') {
      return;
    }
    const timeout = window.setTimeout(() => {
      setPreviewStatus('idle');
    }, 4000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [previewStatus]);

  useEffect(
    () => () => {
      if (previewDebounceRef.current) {
        window.clearTimeout(previewDebounceRef.current);
        previewDebounceRef.current = null;
      }
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
        previewAbortRef.current = null;
      }
    },
    [],
  );

  const wizardSteps = useMemo(() => {
    const definitions: Array<{ label: string; id: 1 | 2 | 3 }> = [
      { label: t('offers.wizard.steps.details'), id: 1 },
      { label: t('offers.wizard.steps.pricing'), id: 2 },
      { label: t('offers.wizard.steps.summary'), id: 3 },
    ];

    return definitions.map(({ label, id }) => {
      const hasErrors = (validation[id]?.length ?? 0) > 0;
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
  }, [attemptedSteps, goToStep, isStepValid, step, validation]);

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
          prices: pricingRows,
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
              />
            )}

            {step === 2 && <OfferPricingSection rows={pricingRows} onChange={setPricingRows} />}

            {step === 3 && (
              <OfferSummarySection
                title={title}
                projectDetails={projectDetails}
                totals={totals}
              />
            )}

            {inlineErrors.length > 0 && (
              <div className="w-full rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700">
                <ul className="list-disc space-y-1 pl-4">
                  {inlineErrors.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="sticky bottom-0 left-0 right-0 z-30 -mx-6 -mb-6 border-t border-border/70 bg-[rgb(var(--color-bg-muted-rgb)/0.98)] px-6 py-4 shadow-[0_-8px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={goPrev}
                  disabled={step === 1}
                  className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
                >
                  {t('offers.wizard.actions.back')}
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={goNext}
                    disabled={isNextDisabled}
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {t('offers.wizard.actions.next')}
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
            isPreviewAvailable={step === 3}
            previewMarkup={previewMarkup}
            statusDescriptor={statusDescriptor}
            isStreaming={isStreaming}
            previewStatus={previewStatus}
            previewError={previewError}
            onAbortPreview={handleAbortPreview}
            onManualRefresh={handleManualRefresh}
          />
        </div>
      </div>
    </AppFrame>
  );
}
