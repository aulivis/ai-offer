'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { OfferProjectDetailsSection } from '@/components/offers/OfferProjectDetailsSection';
import { OfferPricingSection } from '@/components/offers/OfferPricingSection';
import { OfferSummarySection, type OfferPreviewStatus } from '@/components/offers/OfferSummarySection';
import { offerBodyMarkup } from '@/app/lib/offerDocument';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { usePricingRows } from '@/hooks/usePricingRows';

const DEFAULT_PREVIEW_HTML =
  '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>';

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
  const supabase = useSupabase();
  const { showToast } = useToast();

  const [previewHtml, setPreviewHtml] = useState<string>(DEFAULT_PREVIEW_HTML);
  const [previewStatus, setPreviewStatus] = useState<OfferPreviewStatus>('idle');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { totals, pricePreviewHtml } = usePricingRows(pricingRows);
  const previewMarkup = useMemo(() => {
    const safeTitle = title.trim() || 'Árajánlat';
    const bodyHtml = previewHtml || DEFAULT_PREVIEW_HTML;
    return offerBodyMarkup({
      title: safeTitle,
      companyName: 'Vállalkozásod neve',
      aiBodyHtml: bodyHtml,
      priceTableHtml: pricePreviewHtml,
    });
  }, [pricePreviewHtml, previewHtml, title]);
  const isStreaming = previewStatus === 'loading' || previewStatus === 'streaming';
  const statusDescriptor = useMemo<
    | {
        tone: 'info' | 'success' | 'error' | 'warning';
        title: string;
        description?: string;
      }
    | null
  >(() => {
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

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (sessionError || !token) {
      const message = sessionError?.message ?? 'Nem sikerült hitelesíteni az előnézet lekérését.';
      if (previewRequestIdRef.current === nextRequestId) {
        setPreviewStatus('error');
        setPreviewError(message);
        setPreviewHtml(DEFAULT_PREVIEW_HTML);
      }
      showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
      return;
    }

    const controller = new AbortController();
    previewAbortRef.current = controller;

    try {
      const resp = await fetch('/api/ai-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      });

      if (!resp.ok) {
        let message = `Hiba az előnézet betöltésekor (${resp.status})`;
        try {
          const data = await resp.json();
          if (data?.error) message = data.error as string;
        } catch {
          /* ignore JSON parse errors */
        }
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewStatus('error');
          setPreviewError(message);
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        showToast({ title: 'Előnézet hiba', description: message, variant: 'error' });
        return;
      }

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
            const payload = JSON.parse(jsonPart) as { type?: string; html?: string; message?: string };
            if (payload.type === 'delta' || payload.type === 'done') {
              if (!hasDelta && previewRequestIdRef.current === nextRequestId) {
                setPreviewStatus('streaming');
              }
              hasDelta = true;
              if (typeof payload.html === 'string' && previewRequestIdRef.current === nextRequestId) {
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
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (typeof error === 'object' && error && 'name' in error && (error as { name?: string }).name === 'AbortError')
      ) {
        if (previewRequestIdRef.current === nextRequestId) {
          setPreviewStatus('aborted');
          setPreviewError('Az előnézet frissítése megszakadt.');
          setPreviewHtml(DEFAULT_PREVIEW_HTML);
        }
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Ismeretlen hiba történt az előnézet lekérése közben.';
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
  }, [description, showToast, step, supabase, title]);

  const handleManualRefresh = useCallback(() => {
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
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
      clearTimeout(previewDebounceRef.current);
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
        clearTimeout(previewDebounceRef.current);
        previewDebounceRef.current = null;
      }
    };
  }, [callPreview, description, pricingRows, step, title]);

  useEffect(() => {
    if (step === 3) {
      return;
    }

    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
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
      clearTimeout(timeout);
    };
  }, [previewStatus]);

  useEffect(() => () => {
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }
    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
      previewAbortRef.current = null;
    }
  }, []);

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

  return (
    <AppFrame
      title="Új ajánlat"
      description="Kövesd a lépéseket az ajánlat létrehozásához, majd töltsd le vagy küldd el az ügyfelednek."
    >
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <StepIndicator steps={wizardSteps} />
        </div>

        {step === 1 && (
          <OfferProjectDetailsSection
            title={title}
            description={description}
            onTitleChange={(event) => setTitle(event.target.value)}
            onDescriptionChange={(event) => setDescription(event.target.value)}
          />
        )}

        {step === 2 && (
          <OfferPricingSection rows={pricingRows} onChange={setPricingRows} />
        )}

        {step === 3 && (
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
        )}

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
          <button
            onClick={goPrev}
            disabled={step === 1}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            Vissza
          </button>

          {step < 3 && (
            <button
              onClick={goNext}
              disabled={isNextDisabled}
              className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Tovább
            </button>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
