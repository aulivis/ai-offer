import Image from 'next/image';

interface ProductScreenshotProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

export default function ProductScreenshot({
  src,
  alt,
  caption,
  className = '',
  priority = false,
}: ProductScreenshotProps) {
  // Placeholder if no image provided
  if (!src) {
    return (
      <div
        className={`relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-primary/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-fg-muted">{alt}</p>
          </div>
        </div>
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-center text-sm text-white">
            {caption}
          </div>
        )}
      </div>
    );
  }

  return (
    <figure className={className}>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 shadow-lg">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-fg-muted">{caption}</figcaption>
      )}
    </figure>
  );
}












