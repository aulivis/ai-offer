import EditablePriceTable, { type PriceRow } from '@/components/EditablePriceTable';
import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/copy';

type OfferPricingSectionProps = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
};

export function OfferPricingSection({ rows, onChange }: OfferPricingSectionProps) {
  return (
    <section className="grid w-full max-w-[var(--column-width)] grid-cols-1 gap-6">
      <Card
        header={
          <CardHeader className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-700">
              {t('offers.wizard.forms.pricing.title')}
            </h2>
            <p className="text-xs text-slate-500">{t('offers.wizard.forms.pricing.helper')}</p>
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
