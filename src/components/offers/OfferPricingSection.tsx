import EditablePriceTable, { type PriceRow } from '@/components/EditablePriceTable';

type OfferPricingSectionProps = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
};

export function OfferPricingSection({ rows, onChange }: OfferPricingSectionProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Árlista</h2>
        <p className="mt-1 text-xs text-slate-500">
          Adj meg legalább egy tételt – ez alapján számoljuk a nettó és bruttó összegeket.
        </p>
        <div className="mt-6">
          <EditablePriceTable rows={rows} onChange={onChange} />
        </div>
      </div>
    </section>
  );
}
