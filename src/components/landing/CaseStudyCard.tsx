import { Card } from '@/components/ui/Card';
import Image from 'next/image';
import Link from 'next/link';

interface CaseStudyCardProps {
  company: string;
  logo?: string;
  industry: string;
  challenge: string;
  solution: string;
  results: Array<{
    metric: string;
    value: string;
  }>;
  quote: string;
  author: string;
  role: string;
  className?: string;
}

export default function CaseStudyCard({
  company,
  logo,
  industry,
  challenge,
  solution,
  results,
  quote,
  author,
  role,
  className = '',
}: CaseStudyCardProps) {
  return (
    <Card className={`overflow-hidden p-8 transition-all duration-300 hover:shadow-pop ${className}`}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          {logo ? (
            <Image src={logo} alt={company} width={120} height={48} className="h-12 w-auto object-contain" />
          ) : (
            <div className="flex h-12 items-center">
              <span className="text-xl font-bold text-fg">{company}</span>
            </div>
          )}
          <p className="mt-2 text-sm text-fg-muted">{industry}</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Esettanulmány
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Kihívás</h3>
          <p className="text-base leading-relaxed text-fg-muted">{challenge}</p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Megoldás</h3>
          <p className="text-base leading-relaxed text-fg-muted">{solution}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {results.map((result, index) => (
            <div key={index} className="rounded-lg border border-border/50 bg-bg-muted/30 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{result.value}</div>
              <div className="mt-1 text-xs text-fg-muted">{result.metric}</div>
            </div>
          ))}
        </div>

        <blockquote className="border-l-4 border-primary/30 pl-4">
          <p className="text-lg italic leading-relaxed text-fg">&ldquo;{quote}&rdquo;</p>
          <footer className="mt-3 text-sm text-fg-muted">
            <strong className="font-semibold text-fg">{author}</strong>, {role}
          </footer>
        </blockquote>
      </div>
    </Card>
  );
}

