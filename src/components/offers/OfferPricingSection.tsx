import EditablePriceTable, { type PriceRow } from '@/components/EditablePriceTable';
import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/copy';

type OfferPricingSectionProps = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
  error?: string;
};

export function OfferPricingSection({ rows, onChange, error }: OfferPricingSectionProps) {
  return (
    <section className="grid w-full max-w-[var(--column-width)] grid-cols-1 gap-6">
      <Card
        header={
          <CardHeader className="space-y-1">
            <h2 className="text-sm font-semibold text-fg">
              {t('offers.wizard.forms.pricing.title')}
            </h2>
            <p className="text-xs text-fg-muted">{t('offers.wizard.forms.pricing.helper')}</p>
          </CardHeader>
        }
      >
        <div>
          <EditablePriceTable rows={rows} onChange={onChange} />
        </div>
      </Card>
      {error ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
