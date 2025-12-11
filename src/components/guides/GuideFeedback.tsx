'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

export function GuideFeedback() {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    setSubmitted(true);
    // Here you would typically send the feedback to your backend
    // For now, we'll just show a confirmation
  };

  if (submitted) {
    return (
      <div className="rounded-xl p-8 text-center my-12 border border-success/40 bg-success/10">
        <div className="flex items-center justify-center gap-2 text-success mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Köszönjük a visszajelzést!</span>
        </div>
        <p className="text-fg-muted">
          {feedback === 'positive'
            ? 'Örülünk, hogy hasznos volt az útmutató!'
            : 'Köszönjük, hogy jelezted. Folyamatosan javítjuk a tartalmakat.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-bg-muted rounded-xl p-8 text-center my-12">
      <h3 className="text-xl font-bold text-fg mb-3">Hasznos volt ez az útmutató?</h3>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleFeedback('positive')}
          className="flex items-center gap-2 px-6 py-3 bg-bg border border-border rounded-xl hover:border-success hover:bg-success/10 transition-colors min-h-[44px]"
          aria-label="Igen, hasznos volt"
        >
          <ThumbsUp className="w-5 h-5 text-fg" />
          <span className="font-semibold text-fg">Igen</span>
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          className="flex items-center gap-2 px-6 py-3 bg-bg border border-border rounded-xl hover:border-danger hover:bg-danger/10 transition-colors min-h-[44px]"
          aria-label="Nem, nem volt hasznos"
        >
          <ThumbsDown className="w-5 h-5 text-fg" />
          <span className="font-semibold text-fg">Nem</span>
        </button>
      </div>
    </div>
  );
}
