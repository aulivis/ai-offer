import { Card, CardHeader } from '@/components/ui/Card';
import { t } from '@/copy';
import { type ProjectDetailKey, type ProjectDetails } from '@/lib/projectDetails';

type OfferSummarySectionProps = {
  title: string;
  projectDetails: ProjectDetails;
  totals: {
    net: number;
    vat: number;
    gross: number;
  };
};

const summaryFields: ProjectDetailKey[] = ['overview', 'deliverables', 'timeline', 'constraints'];

export function OfferSummarySection({ title, projectDetails, totals }: OfferSummarySectionProps) {
  return (
    <section className="grid w-full max-w-[var(--column-width)] gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card
        header={
          <CardHeader>
            <h2 className="text-sm font-semibold text-fg">
              {t('offers.wizard.summarySection.projectHeading')}
            </h2>
          </CardHeader>
        }
      >
        <dl className="space-y-3 text-sm text-fg-muted">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-muted">{t('offers.wizard.summarySection.fields.title')}</dt>
            <dd className="font-medium text-fg">
              {title || t('offers.wizard.summarySection.empty')}
            </dd>
          </div>
          {summaryFields.map((field) => {
            const value = projectDetails[field].trim();
            return (
              <div key={field} className="flex items-start justify-between gap-3">
                <dt className="text-fg-muted">
                  {t(`offers.wizard.summarySection.fields.${field}` as const)}
                </dt>
                <dd className="max-w-xl text-right text-fg">
                  {value || t('offers.wizard.summarySection.empty')}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>

      <Card
        header={
          <CardHeader>
            <h2 className="text-sm font-semibold text-fg">
              {t('offers.wizard.summarySection.compensationHeading')}
            </h2>
          </CardHeader>
        }
      >
        <dl className="space-y-2 text-sm text-fg-muted">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-muted">{t('offers.wizard.summarySection.fields.netTotal')}</dt>
            <dd className="font-medium text-fg">
              {totals.net.toLocaleString('hu-HU')} {t('editablePriceTable.totals.currency')}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-fg-muted">{t('offers.wizard.summarySection.fields.vat')}</dt>
            <dd className="font-medium text-fg">
              {totals.vat.toLocaleString('hu-HU')} {t('editablePriceTable.totals.currency')}
            </dd>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg-muted/80 px-4 py-3">
            <dt className="text-fg-muted">{t('offers.wizard.summarySection.fields.gross')}</dt>
            <dd className="text-base font-semibold text-fg">
              {totals.gross.toLocaleString('hu-HU')} {t('editablePriceTable.totals.currency')}
            </dd>
          </div>
        </dl>
      </Card>
    </section>
  );
}
