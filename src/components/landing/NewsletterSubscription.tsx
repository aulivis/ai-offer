'use client';

import { useState, FormEvent } from 'react';
import { trackEmailCapture } from '@/lib/analytics';

interface NewsletterSubscriptionProps {
  source?: 'landing_page' | 'footer' | 'exit_intent' | 'other';
}

export function NewsletterSubscription({ source = 'landing_page' }: NewsletterSubscriptionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt a feliratkozás során');
      }

      setStatus('success');
      setName('');
      setEmail('');
      trackEmailCapture(source);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Hiba történt a feliratkozás során');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 mb-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Köszönjük a feliratkozást!</h3>
          <p className="text-gray-600">
            Hamarosan értesítünk az újdonságokról és hasznos tippekről.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 mb-8">
      {/* Value proposition above form */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 font-bold text-sm rounded-full mb-4 border-2 border-green-200">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Maradj naprakész a Vyndivel</span>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
        {/* Two input fields side by side on desktop */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Name input */}
          <div>
            <label htmlFor="cta-name" className="block text-sm font-semibold text-gray-700 mb-2">
              Név
            </label>
            <input
              id="cta-name"
              type="text"
              placeholder="Kovács János"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === 'loading'}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-turquoise-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all text-lg min-h-[44px] disabled:opacity-50"
            />
          </div>

          {/* Email input */}
          <div>
            <label htmlFor="cta-email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email cím
            </label>
            <input
              id="cta-email"
              type="email"
              placeholder="janos@vallalkozas.hu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              required
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-turquoise-500 focus:bg-white focus:outline-none text-gray-900 placeholder-gray-400 transition-all text-lg min-h-[44px] disabled:opacity-50"
            />
          </div>
        </div>

        {/* Error message */}
        {status === 'error' && errorMessage && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Prominent CTA button that stands out */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-4 px-8 bg-white hover:bg-gray-50 text-navy-900 text-lg font-bold rounded-xl border-2 border-gray-300 hover:border-turquoise-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 group min-h-[44px]"
        >
          {status === 'loading' ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-navy-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Feldolgozás...</span>
            </>
          ) : (
            <>
              <span>Feliratkozom</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Trust signals below form */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
        <div className="hidden md:flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Heti 1 rövid e-mail</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Nincs spam, bármikor leiratkozhatsz</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold">Hasznos tippek, frissítések, akciók</span>
        </div>
      </div>
    </div>
  );
}
