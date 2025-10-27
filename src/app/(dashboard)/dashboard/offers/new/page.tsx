'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppFrame from '@/components/AppFrame';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { OfferProjectDetailsSection } from '@/components/offers/OfferProjectDetailsSection';
import { OfferPricingSection } from '@/components/offers/OfferPricingSection';
import {
  OfferSummarySection,
  type OfferPreviewStatus,
} from '@/components/offers/OfferSummarySection';
import { offerBodyMarkup } from '@/app/lib/offerDocument';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { useToast } from '@/components/ToastProvider';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';
import { ApiError, fetchWithSupabaseAuth, isAbortError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DEFAULT_PREVIEW_HTML = '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>';

export default function NewOfferPage() {
  const {
    step,
    title,
    setTitle,
    description,
    setDescription,
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
    const safeTitle = title.trim() || 'Árajánlat';
    const bodyHtml = previewHtml || DEFAULT_PREVIEW_HTML;
    return offerBodyMarkup({
      title: safeTitle,
      companyName: 'Vállalkozásod neve',
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
    description.trim().length === 0;
  const statusDescriptor = useMemo<{
    tone: 'info' | 'success' | 'error' | 'warning';
    title: string;
    description?: string;
  } | null>(() => {
    switch (previewStatus) {
      case 'loading':
        return {
          tone: 'info' as const,
          title: 'Kapcsolódás az AI szolgáltatáshoz…',
          description: 'Ez néhány másodpercet is igénybe vehet.',
        };
      case 'streaming':
        return {
          tone: 'info' as const,
          title: 'Az AI most készíti az előnézetet…',
          description: 'Ez néhány másodpercet is igénybe vehet.',
        };
      case 'success':
        return {
          tone: 'success' as const,
          title: 'Előnézet frissítve.',
        };
      case 'error':
        return {
          tone: 'error' as const,
          title: 'Nem sikerült frissíteni az előnézetet.',
        };
      case 'aborted':
        return {
          tone: 'warning' as const,
          title: 'Az előnézet frissítése megszakadt.',
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
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
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
          description: trimmedDescription,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
        }),
        signal: controller.signal,
        authErrorMessage: 'Nem sikerült hitelesíteni az előnézet lekérését.',
        errorMessageBuilder: (status) => `Hiba az előnézet betöltésekor (${status})`,
        defaultErrorMessage: 'Ismeretlen hiba történt az előnézet lekérése közben.',
      });

      if (!resp.body) {
        const message = 'Az AI nem küldött adatot az előnézethez.';
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewStatus('error');
          setPreviewError(message);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
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
                  : 'Ismeretlen hiba történt az AI stream során.';
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
        showToast({ title: 'Előnézet hiba', description: streamErrorMessage, variant: 'error' });
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
          setPreviewError('Az előnézet frissítése megszakadt.');
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Ismeretlen hiba történt az előnézet lekérése közben.';
      if (previewRequestIdRef.current === nextRequestId) {
        setPreviewStatus('error');
        setPreviewError(message);
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
      }
      showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
    } finally {
      if (previewAbortRef.current === controller) {
        previewAbortRef.current = null;
      }
    }
  }, [description, showToast, step, title]);

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
    setPreviewError('Az előnézet frissítése megszakadt.');
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
  }, [callPreview, description, pricingRows, step, title]);

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
      { label: 'Projekt részletek', id: 1 },
      { label: 'Árazás', id: 2 },
      { label: 'Összegzés', id: 3 },
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
    const trimmedDescription = description.trim();
    const trimmedPreview = previewHtml.trim();

    if (!trimmedTitle || !trimmedDescription) {
      showToast({
        title: 'Hiányzó adatok',
        description: 'Add meg az ajánlat címét és rövid leírását a mentéshez.',
        variant: 'error',
      });
      return;
    }

    if (!hasPricingRows) {
      showToast({
        title: 'Hiányzó tételek',
        description: 'Adj hozzá legalább egy tételt az árlistához.',
        variant: 'error',
      });
      return;
    }

    if (!hasPreviewHtml) {
      showToast({
        title: 'Hiányzó előnézet',
        description: 'Generáld le az AI előnézetet, mielőtt elmented az ajánlatot.',
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
          description: trimmedDescription,
          deadline: '',
          language: 'hu',
          brandVoice: 'professional',
          style: 'detailed',
          prices: pricingRows,
          aiOverrideHtml: trimmedPreview,
          clientId: null,
          imageAssets: [],
        }),
        authErrorMessage: 'Nem sikerült hitelesíteni az ajánlat mentését.',
        errorMessageBuilder: (status) => `Hiba az ajánlat mentésekor (${status})`,
        defaultErrorMessage: 'Ismeretlen hiba történt az ajánlat mentése közben.',
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
            : 'Nem sikerült elmenteni az ajánlatot. Próbáld újra később.';
        throw new ApiError(message);
      }

      showToast({
        title: 'Ajánlat mentve',
        description: 'A PDF generálása folyamatban van, hamarosan elérhető lesz.',
        variant: 'success',
      });
      router.replace('/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Ismeretlen hiba történt az ajánlat mentése közben.';
      showToast({
        title: 'Ajánlat mentése sikertelen',
        description: message,
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
    router,
    showToast,
    title,
    description,
  ]);

  return (
    <AppFrame
      title="Új ajánlat"
      description="Kövesd a lépéseket az ajánlat létrehozásához, majd töltsd le vagy küldd el az ügyfelednek."
    >
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start md:gap-10 lg:gap-12">
        <div className="flex flex-col gap-8">
          <Card>
            <StepIndicator steps={wizardSteps} />
          </Card>

          {step === 1 && (
            <OfferProjectDetailsSection
              title={title}
              description={description}
              onTitleChange={(event) => setTitle(event.target.value)}
              onDescriptionChange={(event) => setDescription(event.target.value)}
            />
          )}

          {step === 2 && <OfferPricingSection rows={pricingRows} onChange={setPricingRows} />}

          {inlineErrors.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700">
              <ul className="list-disc space-y-1 pl-4">
                {inlineErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={goPrev}
              disabled={step === 1}
              className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:border-border disabled:text-slate-300"
            >
              Vissza
            </Button>

            {step < 3 ? (
              <Button
                onClick={goNext}
                disabled={isNextDisabled}
                className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Tovább
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? 'Mentés folyamatban…' : 'Ajánlat mentése'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-6">
          {step === 3 ? (
            <OfferSummarySection
              title={title}
              description={description}
              previewMarkup={previewMarkup}
              statusDescriptor={statusDescriptor}
              isStreaming={isStreaming}
              previewStatus={previewStatus}
              previewError={previewError}
              onAbortPreview={handleAbortPreview}
              onManualRefresh={handleManualRefresh}
              totals={totals}
            />
          ) : (
            <Card className="hidden min-h-[320px] items-center justify-center text-center text-sm text-slate-500 md:flex">
              <p className="max-w-xs">
                Az AI előnézet az Összegzés lépésben lesz elérhető, miután kitöltötted a szükséges adatokat.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
