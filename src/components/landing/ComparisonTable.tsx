import { Card } from '@/components/ui/Card';
import { t } from '@/copy';

interface ComparisonFeature {
  feature: string;
  vyndi: boolean | string;
  competitor1: boolean | string;
  competitor2: boolean | string;
}

interface ComparisonTableProps {
  features?: ComparisonFeature[];
  competitor1Name?: string;
  competitor2Name?: string;
  className?: string;
}

const defaultFeatures: ComparisonFeature[] = [
  {
    feature: t('landing.comparisonTable.features.aiGeneration'),
    vyndi: true,
    competitor1: false,
    competitor2: t('landing.comparisonTable.values.limited'),
  },
  {
    feature: t('landing.comparisonTable.features.hungarianSupport'),
    vyndi: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: t('landing.comparisonTable.features.brandedPdf'),
    vyndi: true,
    competitor1: true,
    competitor2: t('landing.comparisonTable.values.premium'),
  },
  {
    feature: t('landing.comparisonTable.features.realtimeCollaboration'),
    vyndi: true,
    competitor1: false,
    competitor2: true,
  },
  {
    feature: t('landing.comparisonTable.features.responsiveEditing'),
    vyndi: true,
    competitor1: true,
    competitor2: false,
  },
  {
    feature: t('landing.comparisonTable.features.freeTrial'),
    vyndi: true,
    competitor1: false,
    competitor2: true,
  },
  {
    feature: t('landing.comparisonTable.features.autoPricing'),
    vyndi: true,
    competitor1: false,
    competitor2: false,
  },
  {
    feature: t('landing.comparisonTable.features.interactiveFeedback'),
    vyndi: true,
    competitor1: false,
    competitor2: false,
  },
];

export default function ComparisonTable({
  features = defaultFeatures,
  competitor1Name = t('landing.comparisonTable.headerCompetitor1'),
  competitor2Name = t('landing.comparisonTable.headerCompetitor2'),
  className = '',
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <svg
          className="mx-auto h-6 w-6 text-primary"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-label={t('landing.comparisonTable.values.yes')}
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (value === false) {
      return (
        <svg
          className="mx-auto h-6 w-6 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-label={t('landing.comparisonTable.values.no')}
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return <span className="text-sm font-medium text-fg-muted">{value}</span>;
  };

  return (
    <div className={`relative overflow-x-auto ${className}`}>
      {/* Mobile scroll indicator */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
        aria-hidden="true"
      />
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[600px]"
            role="table"
            aria-label={t('landing.comparisonTable.ariaLabel') || 'Feature comparison table'}
          >
            <thead>
              <tr className="border-b border-border bg-bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-fg">
                  {t('landing.comparisonTable.headerFeature')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-primary">
                  {t('landing.comparisonTable.headerVyndi')}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-fg-muted">
                  {competitor1Name}
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-fg-muted">
                  {competitor2Name}
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-border/50 transition-colors hover:bg-bg-muted/30"
                >
                  <td className="px-6 py-4 text-sm font-medium text-fg">{item.feature}</td>
                  <td className="px-6 py-4 text-center">{renderValue(item.vyndi)}</td>
                  <td className="px-6 py-4 text-center">{renderValue(item.competitor1)}</td>
                  <td className="px-6 py-4 text-center">{renderValue(item.competitor2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Mobile hint */}
      <p className="mt-2 text-center text-xs text-fg-muted sm:hidden">
        Scroll horizontally to see all features
      </p>
    </div>
  );
}
