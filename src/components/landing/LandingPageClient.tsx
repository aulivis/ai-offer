'use client';

import ExitIntentPopup from './ExitIntentPopup';
import { useExitIntent } from '@/hooks/useExitIntent';

export function LandingPageClient() {
  const { showPopup, setShowPopup } = useExitIntent();

  return <ExitIntentPopup show={showPopup} onClose={() => setShowPopup(false)} />;
}

