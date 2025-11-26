'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/components/ToastProvider';
import { fetchWithSupabaseAuth } from '@/lib/api';
import { createClientLogger } from '@/lib/clientLogger';

export function SettingsEmailSubscriptionSection() {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'SettingsEmailSubscriptionSection' }),
    [user?.id],
  );
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Load current subscription status
  useEffect(() => {
    if (!user || !user.email || !user.id) {
      setLoading(false);
      return;
    }

    // Capture user values to avoid TypeScript issues with closures
    const userEmail = user.email.toLowerCase().trim();
    const userId = user.id;

    async function loadSubscriptionStatus() {
      try {
        const { data, error } = await supabase
          .from('email_subscriptions')
          .select('unsubscribed_at')
          .eq('email', userEmail)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine
          logger.error('Failed to load subscription status', error);
          setSubscribed(null);
        } else {
          // If no record exists or unsubscribed_at is null, user is subscribed
          setSubscribed(data ? data.unsubscribed_at === null : null);
        }
      } catch (error) {
        logger.error('Error loading subscription status', error);
        setSubscribed(null);
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  const handleToggle = async () => {
    if (!user) return;

    setToggling(true);
    try {
      const response = await fetchWithSupabaseAuth('/api/newsletter/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribed: !subscribed,
        }),
        defaultErrorMessage: 'Nem sikerült frissíteni a feliratkozási beállításokat',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      setSubscribed(!subscribed);
      showToast({
        title: data.message || (data.subscribed ? 'Feliratkozás sikeres' : 'Leiratkozás sikeres'),
        description: '',
        variant: 'success',
      });
    } catch (error) {
      logger.error('Failed to toggle subscription', error, { newState: !subscribed });
      showToast({
        title: 'Hiba történt',
        description:
          error instanceof Error ? error.message : 'Nem sikerült frissíteni a beállításokat',
        variant: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card
        id="email-subscription"
        as="section"
        className="scroll-mt-24"
        header={
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                <EnvelopeIcon className="relative z-10 h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  Email hírlevél
                </h2>
                <p className="text-sm md:text-base text-slate-500">Betöltés...</p>
              </div>
            </div>
          </CardHeader>
        }
      >
        <div className="p-6">
          <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      id="email-subscription"
      as="section"
      className="scroll-mt-24"
      header={
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                <EnvelopeIcon className="relative z-10 h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  Email hírlevél
                </h2>
                <p className="text-sm md:text-base text-slate-500">
                  Kapj értesítéseket az újdonságokról és hasznos tippekről
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling || subscribed === null}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                subscribed ? 'bg-primary' : 'bg-slate-300'
              }`}
              aria-label={subscribed ? 'Leiratkozás' : 'Feliratkozás'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  subscribed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardHeader>
      }
    >
      <div className="space-y-4 p-6">
        <div className="rounded-xl border border-border/60 bg-gradient-to-br from-slate-50 to-white p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {subscribed
                    ? 'Fel vagy iratkozva a hírlevelünkre'
                    : 'Nem vagy feliratkozva a hírlevelünkre'}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {subscribed
                    ? 'Hetente egyszer értesítünk az újdonságokról, tippekről és akciókról. Bármikor leiratkozhatsz a beállításokban.'
                    : 'Iratkozz fel, hogy ne maradj le az újdonságokról, hasznos tippekről és exkluzív akciókról.'}
                </p>
              </div>
            </div>

            {subscribed && (
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Heti 1 rövid e-mail</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Nincs spam</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Bármikor leiratkozhatsz</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
