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
    <Card
      className={`h-full overflow-hidden p-8 transition-all duration-300 hover:shadow-pop md:p-10 ${className}`}
    >
      <div className="mb-8 flex items-start justify-between">
        <div>
          {logo ? (
            <Image
              src={logo}
              alt={company}
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <div className="flex h-12 items-center">
              <span className="text-2xl font-bold text-fg">{company}</span>
            </div>
          )}
          <p className="mt-2.5 text-sm font-medium text-fg-muted">{industry}</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          Esettanulmány
        </span>
      </div>

      <div className="space-y-7">
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            Kihívás
          </h3>
          <p className="text-base leading-relaxed text-fg-muted md:text-[15px] md:leading-relaxed">
            {challenge}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            Megoldás
          </h3>
          <p className="text-base leading-relaxed text-fg-muted md:text-[15px] md:leading-relaxed">
            {solution}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {results.map((result, index) => (
            <div
              key={index}
              className="rounded-lg border border-border/50 bg-gradient-to-br from-bg-muted/40 to-bg-muted/20 p-4 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
            >
              <div className="text-2xl font-bold text-primary md:text-3xl">{result.value}</div>
              <div className="mt-2 text-xs font-medium text-fg-muted md:text-sm">
                {result.metric}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border-l-4 border-primary/40 bg-gradient-to-r from-primary/5 to-transparent p-5">
          <blockquote>
            <p className="text-base italic leading-relaxed text-fg md:text-lg md:leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
            <footer className="mt-4 text-sm text-fg-muted">
              <strong className="font-semibold text-fg">{author}</strong>
              <span className="mx-1.5">•</span>
              <span>{role}</span>
            </footer>
          </blockquote>
        </div>
      </div>
    </Card>
  );
}
