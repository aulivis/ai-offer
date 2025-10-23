import { OFFER_DOCUMENT_STYLES } from '@/app/lib/offerDocument';

type OfferSummarySectionProps = {
  title: string;
  description: string;
  previewMarkup: string;
  statusDescriptor: {
    tone: 'info' | 'success' | 'error' | 'warning';
    title: string;
    description?: string;
  } | null;
  isStreaming: boolean;
  previewStatus: OfferPreviewStatus;
  previewError: string | null;
  onAbortPreview: () => void;
  onManualRefresh: () => void;
  totals: {
    net: number;
    vat: number;
    gross: number;
  };
};

export type OfferPreviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'error' | 'aborted';

const STATUS_TONE_CLASSES: Record<'info' | 'success' | 'error' | 'warning', string> = {
  info: 'border-border bg-slate-50/80 text-slate-600',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  error: 'border-rose-200 bg-rose-50/80 text-rose-700',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
};

export function OfferSummarySection({
  title,
  description,
  previewMarkup,
  statusDescriptor,
  isStreaming,
  previewStatus,
  previewError,
  onAbortPreview,
  onManualRefresh,
  totals,
}: OfferSummarySectionProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
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

        <div className="space-y-5 rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
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
                  onClick={onAbortPreview}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Megszakítás
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onManualRefresh}
                  className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

          <div className="rounded-2xl border border-border bg-white/90">
            <style dangerouslySetInnerHTML={{ __html: OFFER_DOCUMENT_STYLES }} />
            <div className="max-h-[460px] overflow-auto p-4">
              <div dangerouslySetInnerHTML={{ __html: previewMarkup }} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
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
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50/80 px-4 py-3">
            <dt className="text-slate-500">Bruttó végösszeg</dt>
            <dd className="text-base font-semibold text-slate-900">{totals.gross.toLocaleString('hu-HU')} Ft</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
