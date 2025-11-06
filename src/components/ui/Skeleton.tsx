import * as React from 'react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/60 ${className || ''}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-bg-muted p-6 ${className || ''}`}
      {...props}
    >
      <Skeleton className="mb-4 h-4 w-3/5" />
      <Skeleton className="mb-2 h-3 w-2/5" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-bg-muted p-5">
      <Skeleton className="mb-3 h-3 w-2/3" />
      <Skeleton className="mb-3 h-8 w-1/2" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}

export function OfferCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border/60 bg-white/90 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}




