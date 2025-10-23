import { OFFER_DOCUMENT_STYLES } from '@/app/lib/offerDocument';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';

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
        <Card
          header={
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-700">Projekt összegzés</h2>
            </CardHeader>
          }
        >
          <dl className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Cím</dt>
              <dd className="font-medium text-slate-700">{title || '—'}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-slate-400">Leírás</dt>
              <dd className="max-w-xl text-right text-slate-700">{description || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card
          className="space-y-5"
          header={
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">AI előnézet</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Az előnézet automatikusan frissül, amikor a fenti mezőket módosítod.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <Button
                    type="button"
                    onClick={onAbortPreview}
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Megszakítás
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={onManualRefresh}
                    className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Újra generálás
                  </Button>
                )}
              </div>
            </CardHeader>
          }
        >
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
        </Card>
      </div>

      <Card
        header={
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-700">Díjazás összesítése</h2>
          </CardHeader>
        }
      >
        <dl className="space-y-2 text-sm text-slate-600">
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
      </Card>
    </section>
  );
}
