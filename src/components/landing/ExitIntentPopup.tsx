'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

interface ExitIntentPopupProps {
  onClose: () => void;
  show: boolean;
}

export default function ExitIntentPopup({ onClose, show }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  if (!show || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-popup-title"
    >
      <Card
        className="relative max-w-lg animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          aria-label="Bezárás"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2m0 0V5.5A2.5 2.5 0 1014.5 8H12m-2 5h2m-5 0h.01M19 8h.01"
              />
            </svg>
          </div>

          <h2 id="exit-popup-title" className="mb-3 text-2xl font-bold text-fg">
            Várj! Ne menj el üres kézzel
          </h2>
          <p className="mb-6 text-base leading-relaxed text-fg-muted">
            Töltsd le ingyenes útmutatónkat: <strong>"10 tipp a tökéletes ajánlathoz"</strong>
          </p>

          <div className="space-y-3">
            <Link
              href="/new"
              onClick={handleClose}
              className="block w-full rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-ink shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              Ingyenes útmutató letöltése
            </Link>
            <button
              onClick={handleClose}
              className="w-full text-sm text-fg-muted underline transition-colors hover:text-fg"
            >
              Nem, köszönöm
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

