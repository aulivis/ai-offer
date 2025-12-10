'use client';

/**
 * Skeleton loader for AI text generation
 */
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-5/6 rounded bg-border" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-4/5 rounded bg-border" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-2/3 rounded bg-border" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for preview content
 */
export function PreviewSkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded bg-border" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
        <div className="h-4 w-5/6 rounded bg-border" />
        <div className="h-4 w-4/5 rounded bg-border" />
      </div>
      <div className="h-32 w-full rounded bg-border" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-border" />
        <div className="h-4 w-full rounded bg-border" />
      </div>
    </div>
  );
}
