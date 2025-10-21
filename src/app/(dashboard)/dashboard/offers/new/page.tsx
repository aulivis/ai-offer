'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import EditablePriceTable from '@/components/EditablePriceTable';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { useOfferWizard } from './useOfferWizard';
import { offerBodyMarkup, OFFER_DOCUMENT_STYLES } from '@/app/lib/offerDocument';
import { priceTableHtml } from '@/app/lib/pricing';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';

type PreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

const DEFAULT_PREVIEW_HTML =
  '<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>';

const STATUS_TONE_CLASSES: Record<'info' | 'success' | 'error' | 'warning', string> = {
  info: 'border-slate-200 bg-slate-50/80 text-slate-600',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  error: 'border-rose-200 bg-rose-50/80 text-rose-700',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
};

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
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewAbortRef = useRef<AbortController | null>(null);
  const previewRequestIdRef = useRef(0);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totals = useMemo(() => {
    const net = pricingRows.reduce((sum, row) => sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0), 0);
    const vat = pricingRows.reduce(
      (sum, row) =>
        sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0) * ((Number(row.vat) || 0) / 100),
      0,
    );
    return { net, vat, gross: net + vat };
  }, [pricingRows]);
  const pricePreviewHtml = useMemo(() => priceTableHtml(pricingRows), [pricingRows]);
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
  const statusDescriptor = useMemo(() => {
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
          <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ajánlat címe</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Pl. Weboldal fejlesztés"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Projekt leírása</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Fogalmazd meg röviden az ügyfél problémáját és a megoldást."
                  className="h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Árlista</h2>
              <p className="mt-1 text-xs text-slate-500">
                Adj meg legalább egy tételt – ez alapján számoljuk a nettó és bruttó összegeket.
              </p>
              <div className="mt-6">
                <EditablePriceTable rows={pricingRows} onChange={setPricingRows} />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700">Projekt összegzés</h2>
                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">Cím</dt>
                    <dd className="font-medium text-slate-700">{title || '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">Leírás</dt>
                    <dd className="max-w-xl text-right text-slate-700">{description || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">AI előnézet</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Az előnézet automatikusan frissül, amikor a fenti mezőket módosítod.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isStreaming ? (
                      <button
                        type="button"
                        onClick={handleAbortPreview}
                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        Megszakítás
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleManualRefresh}
                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        Újra generálás
                      </button>
                    )}
                  </div>
                </div>

                {statusDescriptor ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${STATUS_TONE_CLASSES[statusDescriptor.tone]}`}>
                    <div className="flex items-start gap-3">
                      {isStreaming ? (
                        <span className="mt-0.5 h-4 w-4 flex-none animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : null}
                      <div className="space-y-1">
                        <p className="font-medium">{statusDescriptor.title}</p>
                        {statusDescriptor.description ? (
                          <p className="text-xs opacity-80">{statusDescriptor.description}</p>
                        ) : null}
                        {previewStatus === 'error' && previewError ? (
                          <p className="text-xs text-rose-600">{previewError}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white/90">
                  <style dangerouslySetInnerHTML={{ __html: OFFER_DOCUMENT_STYLES }} />
                  <div className="max-h-[460px] overflow-auto p-4">
                    <div dangerouslySetInnerHTML={{ __html: previewMarkup }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Díjazás összesítése</h2>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Nettó összesen</dt>
                  <dd className="font-medium text-slate-700">{totals.net.toLocaleString('hu-HU')} Ft</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">ÁFA</dt>
                  <dd className="font-medium text-slate-700">{totals.vat.toLocaleString('hu-HU')} Ft</dd>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <dt className="text-slate-500">Bruttó végösszeg</dt>
                  <dd className="text-base font-semibold text-slate-900">{totals.gross.toLocaleString('hu-HU')} Ft</dd>
                </div>
              </dl>
            </div>
          </section>
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
