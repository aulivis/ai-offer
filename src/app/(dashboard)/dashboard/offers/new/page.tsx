'use client';

import { useMemo } from 'react';
import AppFrame from '@/components/AppFrame';
import EditablePriceTable from '@/components/EditablePriceTable';
import StepIndicator, { type StepIndicatorStep } from '@/components/StepIndicator';
import { useOfferWizard } from './useOfferWizard';

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

  const totals = useMemo(() => {
    const net = pricingRows.reduce((sum, row) => sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0), 0);
    const vat = pricingRows.reduce(
      (sum, row) =>
        sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0) * ((Number(row.vat) || 0) / 100),
      0,
    );
    return { net, vat, gross: net + vat };
  }, [pricingRows]);

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
