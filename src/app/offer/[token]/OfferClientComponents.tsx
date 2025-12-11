'use client';

import dynamic from 'next/dynamic';

// Lazy load client components for route-based code splitting
export const OfferResponseForm = dynamic(() => import('./OfferResponseForm'), {
  loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
});

export const DownloadPdfButton = dynamic(
  () => import('./DownloadPdfButton').then((mod) => ({ default: mod.DownloadPdfButton })),
  {
    loading: () => <div className="h-12 animate-pulse rounded-lg bg-bg-muted" />,
  },
);

export const OfferDisplay = dynamic(
  () => import('./OfferDisplay').then((mod) => ({ default: mod.OfferDisplay })),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);



