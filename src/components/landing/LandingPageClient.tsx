'use client';

import { useEffect, useState } from 'react';
import ExitIntentPopup from './ExitIntentPopup';
import { useExitIntent } from '@/hooks/useExitIntent';

export function LandingPageClient() {
  const { showPopup, setShowPopup } = useExitIntent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) return null;

  return <ExitIntentPopup show={showPopup} onClose={() => setShowPopup(false)} />;
}

