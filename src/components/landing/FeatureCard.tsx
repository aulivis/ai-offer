import { Card } from '@/components/ui/Card';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
  className?: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  highlight = false,
  className = '',
}: FeatureCardProps) {
  return (
    <Card
      className={`group relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop ${
        highlight ? 'border-primary/40 bg-gradient-to-br from-primary/5 via-transparent to-accent/5' : ''
      } ${className}`}
    >
      <div className="absolute -top-24 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition-all duration-300 group-hover:scale-125" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
          {icon}
        </div>
        <h3 className="mb-3 text-xl font-semibold text-fg">{title}</h3>
        <p className="text-base leading-relaxed text-fg-muted">{description}</p>
      </div>
    </Card>
  );
}

