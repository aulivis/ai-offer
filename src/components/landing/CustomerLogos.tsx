import Image from 'next/image';

interface CustomerLogosProps {
  logos: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  className?: string;
}

export default function CustomerLogos({ logos, className = '' }: CustomerLogosProps) {
  // If no logos provided, show placeholder structure
  if (logos.length === 0) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-8 ${className}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex h-12 w-32 items-center justify-center rounded-lg border border-border/40 bg-bg-muted/50 opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          >
            <span className="text-xs font-medium text-fg-muted">Logo {i}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-8 ${className}`}>
      {logos.map((logo, index) => (
        <div
          key={index}
          className="flex h-12 items-center justify-center opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width || 120}
            height={logo.height || 48}
            className="h-auto max-h-12 w-auto object-contain"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}




