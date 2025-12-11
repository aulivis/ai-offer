'use client';

import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

/**
 * Loading skeleton for Step 1 (Details)
 */
export function Step1Skeleton() {
  return (
    <Card className="space-y-5 border-none bg-white/95 p-4 shadow-lg ring-1 ring-fg/5 sm:p-5 sm:space-y-6">
      <div className="space-y-1.5">
        <Skeleton height="1.5rem" width="40%" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
      <SkeletonCard />
      <div className="space-y-3">
        <Skeleton height="0.75rem" width="30%" />
        <Skeleton height="2.5rem" width="100%" />
        <Skeleton height="6rem" width="100%" />
        <Skeleton height="6rem" width="100%" />
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for Step 2 (Pricing)
 */
export function Step2Skeleton() {
  return (
    <div className="space-y-4">
      <Card className="space-y-3 border-none bg-white/95 p-4 shadow-lg ring-1 ring-fg/5 sm:p-5">
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="40%" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="2rem" width="8rem" variant="rectangular" />
          ))}
        </div>
      </Card>
      <Card className="space-y-3 border-none bg-white/95 p-4 shadow-lg ring-1 ring-fg/5 sm:p-5">
        <div className="space-y-2">
          <Skeleton height="1.25rem" width="40%" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="3rem" width="100%" variant="rectangular" />
          ))}
        </div>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for client list
 */
export function ClientListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} className="p-3" />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for activities list
 */
export function ActivitiesSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} height="2rem" width="10rem" variant="rectangular" />
      ))}
    </div>
  );
}
