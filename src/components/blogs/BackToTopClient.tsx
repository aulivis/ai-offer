'use client';

import dynamic from 'next/dynamic';

const BackToTop = dynamic(() => import('./BackToTop').then((mod) => mod.BackToTop), {
  ssr: false,
});

export function BackToTopClient() {
  return <BackToTop />;
}
