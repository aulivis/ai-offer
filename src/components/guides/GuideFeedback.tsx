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
      <div className="bg-green-50 rounded-xl p-8 text-center my-12 border-2 border-green-200">
        <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Köszönjük a visszajelzést!</span>
        </div>
        <p className="text-gray-600">
          {feedback === 'positive'
            ? 'Örülünk, hogy hasznos volt az útmutató!'
            : 'Köszönjük, hogy jelezted. Folyamatosan javítjuk a tartalmakat.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-8 text-center my-12">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Hasznos volt ez az útmutató?</h3>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleFeedback('positive')}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors min-h-[44px]"
          aria-label="Igen, hasznos volt"
        >
          <ThumbsUp className="w-5 h-5" />
          <span className="font-semibold">Igen</span>
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-colors min-h-[44px]"
          aria-label="Nem, nem volt hasznos"
        >
          <ThumbsDown className="w-5 h-5" />
          <span className="font-semibold">Nem</span>
        </button>
      </div>
    </div>
  );
}
