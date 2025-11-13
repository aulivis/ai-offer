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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Decision buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDecision('accepted')}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-semibold transition ${
              decision === 'accepted'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
            }`}
          >
            <span className="text-2xl">✓</span>
            <span className="text-sm">Elfogadom</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('question')}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-semibold transition ${
              decision === 'question'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            <span className="text-2xl">?</span>
            <span className="text-sm">Kérdésem van</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('rejected')}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 font-semibold transition ${
              decision === 'rejected'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
            }`}
          >
            <span className="text-2xl">✗</span>
            <span className="text-sm">Elutasítom</span>
          </button>
        </div>

        {/* Optional fields */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Név (opcionális)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email (opcionális)"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
