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
      className={cn(baseClasses, variantClasses[variant], animate && 'animate-pulse', className)}
      style={style}
      aria-busy="true"
      aria-label="Loading..."
      role="status"
      aria-live="polite"
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

/**
 * Metric card skeleton - matches MetricCard structure
 */
export function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 sm:p-6', className)}>
      <div className="flex items-start justify-between mb-2.5 sm:mb-3">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <Skeleton variant="circular" width={28} height={28} className="flex-shrink-0 mt-0.5" />
          <Skeleton height="0.75rem" width="60%" className="rounded" />
        </div>
      </div>
      <Skeleton height="2rem" width="40%" className="mb-2 sm:mb-3 rounded-lg" />
      <Skeleton height="0.75rem" width="80%" className="rounded" />
    </div>
  );
}

/**
 * Offer card skeleton - matches OfferCard structure
 */
export function OfferCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200 bg-white/90 p-4 pt-5 shadow-sm overflow-hidden',
        className,
      )}
    >
      {/* Status indicator bar */}
      <Skeleton height="4px" width="100%" className="absolute top-0 left-0 right-0 rounded-t-2xl" />

      {/* Header */}
      <div className="flex items-start gap-2 mb-4">
        <Skeleton variant="circular" width={40} height={40} className="flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton height="1.25rem" width="70%" className="rounded" />
          <Skeleton height="0.875rem" width="50%" className="rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        <Skeleton height="1rem" width="100%" className="rounded" />
        <Skeleton height="1rem" width="85%" className="rounded" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Skeleton height="2rem" width="2rem" variant="circular" />
        <Skeleton height="2rem" width="2rem" variant="circular" />
        <Skeleton height="2rem" width="2rem" variant="circular" />
      </div>
    </div>
  );
}
