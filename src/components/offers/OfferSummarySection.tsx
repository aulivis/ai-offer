import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/copy';

type OfferSummarySectionProps = {
  title: string;
  description: string;
  totals: {
    net: number;
    vat: number;
    gross: number;
  };
};

export function OfferSummarySection({ title, description, totals }: OfferSummarySectionProps) {
  return (
    <section className="grid w-full max-w-[var(--column-width)] gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card
        header={
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-700">Projekt összegzés</h2>
          </CardHeader>
        }
      >
        <dl className="space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Cím</dt>
            <dd className="font-medium text-slate-700">{title || '—'}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-slate-500">Leírás</dt>
            <dd className="max-w-xl text-right text-slate-700">{description || '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card
        header={
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-700">Díjazás összesítése</h2>
          </CardHeader>
        }
      >
        <dl className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Nettó összesen</dt>
            <dd className="font-medium text-slate-700">{totals.net.toLocaleString('hu-HU')} Ft</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">ÁFA</dt>
            <dd className="font-medium text-slate-700">{totals.vat.toLocaleString('hu-HU')} Ft</dd>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50/80 px-4 py-3">
            <dt className="text-slate-500">Bruttó végösszeg</dt>
            <dd className="text-base font-semibold text-slate-900">
              {totals.gross.toLocaleString('hu-HU')} Ft
            </dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
