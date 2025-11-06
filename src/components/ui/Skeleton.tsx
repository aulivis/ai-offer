'use client';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

type SkeletonProps = {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
};

/**
 * Skeleton loader component for loading states
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-slate-200';
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animate && 'animate-pulse',
        className,
      )}
      style={style}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}

/**
 * Text skeleton - multiple lines
 */
export function SkeletonText({
  lines = 3,
  className,
  lineHeight = '1rem',
}: {
  lines?: number;
  className?: string;
  lineHeight?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={lineHeight}
          width={i === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
      <Skeleton height="1.5rem" width="60%" className="mb-3" />
      <SkeletonText lines={3} />
    </div>
  );
}
