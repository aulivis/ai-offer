import { Card } from '@/components/ui/Card';
import Image from 'next/image';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company?: string;
  avatarUrl?: string;
  rating?: number;
  className?: string;
}

export default function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatarUrl,
  rating = 5,
  className = '',
}: TestimonialCardProps) {
  return (
    <Card className={`p-8 transition-all duration-300 hover:shadow-pop ${className}`}>
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <blockquote className="mb-6 text-lg leading-relaxed text-fg">
        <span className="text-3xl leading-none text-primary/30">&ldquo;</span>
        {quote}
        <span className="text-3xl leading-none text-primary/30">&rdquo;</span>
      </blockquote>
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={author}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {author
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-fg">{author}</p>
          <p className="text-sm text-fg-muted">
            {role}
            {company && ` • ${company}`}
          </p>
        </div>
      </div>
    </Card>
  );
}

