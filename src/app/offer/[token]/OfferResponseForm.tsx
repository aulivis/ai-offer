'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DownloadPdfButton } from './DownloadPdfButton';

interface OfferResponseFormProps {
  shareId: string;
  offerId: string;
  token: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

export default function OfferResponseForm({
  token,
  offerId,
  contactEmail,
  contactPhone,
  contactName,
}: OfferResponseFormProps) {
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
    const getStatusMessage = () => {
      if (decision === 'accepted') {
        return {
          title: 'Köszönjük, hogy elfogadta az ajánlatot!',
          description: 'Válaszát rögzítettük és értesítjük az ajánlat készítőjét.',
          nextSteps: [
            'Az ajánlat készítője hamarosan felveszi Önnel a kapcsolatot.',
            'A következő lépésekről egyeztetünk Önnel.',
            'Letöltheti az ajánlat PDF verzióját az alábbi gombbal.',
          ],
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          borderColor: 'border-success/30',
        };
      } else if (decision === 'rejected') {
        return {
          title: 'Köszönjük a válaszát!',
          description: 'Válaszát rögzítettük és értesítjük az ajánlat készítőjét.',
          nextSteps: [
            'Az ajánlat készítője értesítve lett a döntéséről.',
            'Ha később változna a véleménye, kérjük lépjen kapcsolatba velünk.',
          ],
          bgColor: 'bg-danger/10',
          textColor: 'text-danger',
          borderColor: 'border-danger/30',
        };
      } else {
        return {
          title: 'Köszönjük a kérdését!',
          description: 'Kérdését rögzítettük és értesítjük az ajánlat készítőjét.',
          nextSteps: [
            'Az ajánlat készítője hamarosan válaszol kérdésére.',
            'A választ emailben vagy telefonon kapja meg.',
          ],
          bgColor: 'bg-warning/10',
          textColor: 'text-warning',
          borderColor: 'border-warning/30',
        };
      }
    };

    const status = getStatusMessage();

    return (
      <div
        className={`rounded-xl ${status.bgColor} border-2 ${status.borderColor} p-4 sm:p-6 md:p-8 shadow-lg`}
      >
        <div className="mb-4 sm:mb-6 text-center">
          <h2 className={`mb-2 text-xl sm:text-2xl md:text-3xl font-bold ${status.textColor}`}>
            {status.title}
          </h2>
          <p className={`text-sm sm:text-base ${status.textColor} opacity-90`}>
            {status.description}
          </p>
        </div>

        {status.nextSteps && status.nextSteps.length > 0 && (
          <div className={`mb-6 rounded-lg ${status.bgColor} border ${status.borderColor} p-4`}>
            <h3 className={`mb-3 font-semibold ${status.textColor}`}>Következő lépések:</h3>
            <ul className="space-y-2 text-left">
              {status.nextSteps.map((step, idx) => (
                <li key={idx} className={`flex items-start gap-2 ${status.textColor} opacity-90`}>
                  <span className="mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(contactEmail || contactPhone || contactName) && (
          <div className={`mb-6 rounded-lg ${status.bgColor} border ${status.borderColor} p-4`}>
            <h3 className={`mb-3 font-semibold ${status.textColor}`}>Kapcsolattartó adatok:</h3>
            <div className="space-y-2 text-left">
              {contactName && (
                <p className={`${status.textColor} opacity-90`}>
                  <strong>Név:</strong> {contactName}
                </p>
              )}
              {contactEmail && (
                <p className={`${status.textColor} opacity-90`}>
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="underline hover:opacity-80"
                    aria-label={`Email küldése: ${contactEmail}`}
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
              {contactPhone && (
                <p className={`${status.textColor} opacity-90`}>
                  <strong>Telefon:</strong>{' '}
                  <a
                    href={`tel:${contactPhone}`}
                    className="underline hover:opacity-80"
                    aria-label={`Telefon: ${contactPhone}`}
                  >
                    {contactPhone}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
          <DownloadPdfButton token={token} offerId={offerId} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-bg-muted p-4 sm:p-6 md:p-8 shadow-lg">
      <div className="mb-4 sm:mb-6">
        <h2 className="mb-2 text-h3 font-semibold text-fg">Válasz az ajánlatra</h2>
        <p className="text-body-small text-fg-muted">
          Válasszon egyet az alábbi lehetőségek közül. A válaszát rögzítjük és értesítjük az ajánlat
          készítőjét.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Decision buttons */}
        <div className="space-y-3">
          <p className="text-body-small font-semibold text-fg mb-3">Válassza ki a döntését:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            <button
              type="button"
              onClick={() => setDecision('accepted')}
              className={`flex items-center justify-center gap-2 sm:gap-3 rounded-lg border-2 p-4 sm:p-5 font-semibold transition-all min-h-[60px] sm:min-h-[70px] md:min-h-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                decision === 'accepted'
                  ? 'border-success bg-success text-white shadow-md focus:ring-success'
                  : 'border-border bg-bg-muted text-fg-muted hover:border-success/50 hover:bg-success/10 hover:shadow-sm focus:ring-success/30'
              }`}
            >
              <span className="text-xl sm:text-2xl">✓</span>
              <span className="text-sm sm:text-base">Elfogadom</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('question')}
              className={`flex items-center justify-center gap-2 sm:gap-3 rounded-lg border-2 p-4 sm:p-5 font-semibold transition-all min-h-[60px] sm:min-h-[70px] md:min-h-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                decision === 'question'
                  ? 'border-warning bg-warning text-white shadow-md focus:ring-warning'
                  : 'border-border bg-bg-muted text-fg-muted hover:border-warning/50 hover:bg-warning/10 hover:shadow-sm focus:ring-warning/30'
              }`}
            >
              <span className="text-xl sm:text-2xl">?</span>
              <span className="text-sm sm:text-base">Kérdésem van</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('rejected')}
              className={`flex items-center justify-center gap-2 sm:gap-3 rounded-lg border-2 p-4 sm:p-5 font-semibold transition-all min-h-[60px] sm:min-h-[70px] md:min-h-[80px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                decision === 'rejected'
                  ? 'border-danger bg-danger text-white shadow-md focus:ring-danger'
                  : 'border-border bg-bg-muted text-fg-muted hover:border-danger/50 hover:bg-danger/10 hover:shadow-sm focus:ring-danger/30'
              }`}
            >
              <span className="text-xl sm:text-2xl">✗</span>
              <span className="text-sm sm:text-base">Elutasítom</span>
            </button>
          </div>
        </div>

        {/* Optional fields - only show after decision is made */}
        {decision && (
          <div className="space-y-4 border-t border-border pt-6">
            <div className="space-y-4">
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
                className="w-full rounded-lg border border-border px-4 py-3 text-body-small transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-body-small text-danger">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!decision || submitting || (decision === 'question' && !comment.trim())}
          className="w-full sm:w-auto sm:min-w-[200px] min-h-[44px] touch-manipulation"
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
