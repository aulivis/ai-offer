import { Card } from '@/components/ui/Card';

interface ComparisonFeature {
  feature: string;
  vyndi: boolean | string;
  competitor1: boolean | string;
  competitor2: boolean | string;
}

interface ComparisonTableProps {
  features: ComparisonFeature[];
  competitor1Name?: string;
  competitor2Name?: string;
  className?: string;
}

const defaultFeatures: ComparisonFeature[] = [
  { feature: 'AI-alapú szöveg generálás', vyndi: true, competitor1: false, competitor2: 'Korlátozott' },
  { feature: 'Magyar nyelvű támogatás', vyndi: true, competitor1: false, competitor2: false },
  { feature: 'Márkázott PDF export', vyndi: true, competitor1: true, competitor2: 'Prémium' },
  { feature: 'Valós idejű együttműködés', vyndi: true, competitor1: false, competitor2: true },
  { feature: 'Reszponzív szerkesztés', vyndi: true, competitor1: true, competitor2: false },
  { feature: 'Ingyenes próba', vyndi: true, competitor1: false, competitor2: true },
  { feature: 'Automatikus árkalkuláció', vyndi: true, competitor1: false, competitor2: false },
  { feature: 'Interaktív visszajelzések', vyndi: true, competitor1: false, competitor2: false },
];

export default function ComparisonTable({
  features = defaultFeatures,
  competitor1Name = 'Hagyományos megoldás',
  competitor2Name = 'Versenyző A',
  className = '',
}: ComparisonTableProps) {
  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <svg className="mx-auto h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
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
        <svg className="mx-auto h-6 w-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
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
    <div className={`overflow-x-auto ${className}`}>
      <Card className="overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-fg">Funkció</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Vyndi</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-fg-muted">{competitor1Name}</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-fg-muted">{competitor2Name}</th>
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
      </Card>
    </div>
  );
}







