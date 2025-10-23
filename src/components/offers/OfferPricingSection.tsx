import EditablePriceTable, { type PriceRow } from '@/components/EditablePriceTable';
import { Card, CardHeader } from '@/components/ui/Card';

type OfferPricingSectionProps = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
};

export function OfferPricingSection({ rows, onChange }: OfferPricingSectionProps) {
  return (
    <section className="space-y-4">
      <Card
        header={
          <CardHeader className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-700">Árlista</h2>
            <p className="text-xs text-slate-500">
              Adj meg legalább egy tételt – ez alapján számoljuk a nettó és bruttó összegeket.
            </p>
          </CardHeader>
        }
      >
        <div>
          <EditablePriceTable rows={rows} onChange={onChange} />
        </div>
      </Card>
    </section>
  );
}
