'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface OfferResponseFormProps {
  shareId: string;
  offerId: string;
  token: string;
}

export default function OfferResponseForm({ token }: OfferResponseFormProps) {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | 'question' | null>(null);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/offer/${token}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          comment: comment.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit response');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-green-800">Köszönjük a válaszát!</h2>
        <p className="text-green-700">Válaszát rögzítettük és értesítjük az ajánlat készítőjét.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Válasz az ajánlatra</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Decision buttons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setDecision('accepted')}
            className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 font-semibold transition-all min-h-[60px] ${
              decision === 'accepted'
                ? 'border-green-600 bg-green-600 text-white shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50'
            }`}
          >
            <span className="text-xl">✓</span>
            <span className="text-base">Elfogadom</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('question')}
            className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 font-semibold transition-all min-h-[60px] ${
              decision === 'question'
                ? 'border-yellow-500 bg-yellow-500 text-white shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
            }`}
          >
            <span className="text-xl">?</span>
            <span className="text-base">Kérdésem van</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('rejected')}
            className={`flex items-center justify-center gap-3 rounded-lg border-2 p-4 font-semibold transition-all min-h-[60px] ${
              decision === 'rejected'
                ? 'border-red-600 bg-red-600 text-white shadow-md'
                : 'border-gray-300 bg-white text-gray-700 hover:border-red-400 hover:bg-red-50'
            }`}
          >
            <span className="text-xl">✗</span>
            <span className="text-base">Elutasítom</span>
          </button>
        </div>

        {/* Optional fields - only show after decision is made */}
        {decision && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Név (opcionális)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full"
              />
              <Input
                type="email"
                placeholder="Email (opcionális)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full"
              />
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={4}
                placeholder={
                  decision === 'question'
                    ? 'Kérjük, írja le kérdését...'
                    : decision === 'accepted'
                      ? 'Megjegyzés (opcionális)'
                      : decision === 'rejected'
                        ? 'Okkal együtt (opcionális)'
                        : 'Megjegyzés (opcionális)'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required={decision === 'question'}
              />
            </div>
          </div>
        )}

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <Button
          type="submit"
          disabled={!decision || submitting || (decision === 'question' && !comment.trim())}
          className="w-full"
          variant={
            decision === 'accepted' ? 'primary' : decision === 'question' ? 'primary' : 'secondary'
          }
        >
          {submitting ? 'Küldés...' : 'Válasz küldése'}
        </Button>
      </form>
    </div>
  );
}
