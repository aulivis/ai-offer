'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { trackEmailCapture } from '@/lib/analytics';

interface EmailCaptureProps {
  title?: string;
  description?: string;
  placeholder?: string;
  ctaText?: string;
  leadMagnet?: string;
  onSubmit?: (email: string) => Promise<void> | void;
  className?: string;
}

export default function EmailCapture({
  title = 'Kapj ingyenes tippeket a bejegyzéseddel',
  description = 'Iratkozz fel hírlevelünkre és kapj értékes útmutatókat az ajánlatkészítéshez.',
  placeholder = 'email@example.com',
  ctaText = 'Feliratkozás',
  leadMagnet,
  onSubmit,
  className = '',
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Kérjük, adj meg egy érvényes email címet');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Default behavior: could integrate with email service
        // For now, just simulate success
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      trackEmailCapture(leadMagnet || 'email_capture');
      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setErrorMessage('Hiba történt. Kérjük, próbáld újra később.');
    }
  };

  if (status === 'success') {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-fg">Sikeres feliratkozás!</h3>
        <p className="text-sm text-fg-muted">
          {leadMagnet
            ? 'Az útmutatót elküldtük az email címedre. Kérjük, nézd meg a postaládádat!'
            : 'Hamarosan küldünk neked értékes tartalmat!'}
        </p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {leadMagnet && (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Ingyenes letöltés
          </span>
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-fg">{title}</h3>
      {description && <p className="mb-4 text-sm text-fg-muted">{description}</p>}
      {leadMagnet && (
        <p className="mb-4 text-sm font-medium text-fg">
          <strong>{leadMagnet}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-ink transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 sm:flex-shrink-0"
        >
          {status === 'loading' ? 'Küldés...' : ctaText}
        </button>
      </form>
      {status === 'error' && errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
      <p className="mt-3 text-xs text-fg-muted">
        Feliratkozással elfogadod az{' '}
        <a href="/privacy-policy" className="underline hover:text-fg">
          adatvédelmi irányelveinket
        </a>
        . Bármikor leiratkozhatsz.
      </p>
    </Card>
  );
}
