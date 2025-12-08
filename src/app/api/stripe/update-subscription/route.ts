/**
 * POST /api/stripe/update-subscription
 *
 * Updates an existing Stripe subscription to switch between monthly and annual billing.
 * This endpoint handles subscription modifications for existing customers.
 */

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { envServer } from '@/env.server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { createLogger } from '@/lib/logger';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';
import { envClient } from '@/env.client';

const stripe = new Stripe(envServer.STRIPE_SECRET_KEY);

function buildErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseRequestBody(payload: unknown): { billingInterval: 'monthly' | 'annual' } | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const billingInterval = body.billingInterval;

  if (billingInterval !== 'monthly' && billingInterval !== 'annual') {
    return null;
  }

  return { billingInterval };
}

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  const requestId = randomUUID();
  const log = createLogger(requestId);
  log.setContext({ userId: req.user.id });

  const parsedBody = parseRequestBody(await req.json().catch(() => null));
  if (!parsedBody) {
    return buildErrorResponse(
      'Érvénytelen kérés. Hiányzó vagy hibás billingInterval paraméter.',
      400,
    );
  }

  const { billingInterval } = parsedBody;
  const userId = req.user.id;

  try {
    // Get user's Stripe customer ID from Supabase profile
    const supabase = supabaseServiceRole();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      log.error('Failed to fetch user profile', profileError);
      return buildErrorResponse('Nem sikerült betölteni a felhasználói adatokat.', 500);
    }

    if (!profile?.stripe_customer_id) {
      return buildErrorResponse('Nem található Stripe előfizetés a fiókodhoz.', 404);
    }

    // Get current subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return buildErrorResponse('Nem található aktív előfizetés.', 404);
    }

    const subscription = subscriptions.data[0]!;
    const currentPriceId = subscription.items.data[0]?.price.id;

    if (!currentPriceId) {
      return buildErrorResponse('Nem sikerült meghatározni az aktuális előfizetést.', 500);
    }

    // Determine target price ID based on current plan and desired billing interval
    const isPro = profile.plan === 'pro';
    const targetPriceId =
      billingInterval === 'annual'
        ? isPro
          ? envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL || envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO
          : envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ||
            envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER
        : isPro
          ? envClient.NEXT_PUBLIC_STRIPE_PRICE_PRO
          : envClient.NEXT_PUBLIC_STRIPE_PRICE_STARTER;

    if (!targetPriceId) {
      return buildErrorResponse('A kiválasztott számlázási időszak nem érhető el.', 400);
    }

    // Check if already on the target billing interval
    if (currentPriceId === targetPriceId) {
      return buildErrorResponse(
        `Már ${billingInterval === 'annual' ? 'éves' : 'havi'} számlázásra vagy átállítva.`,
        400,
      );
    }

    // Validate price ID against allowlist
    if (
      envServer.STRIPE_PRICE_ALLOWLIST.length > 0 &&
      !envServer.STRIPE_PRICE_ALLOWLIST.includes(targetPriceId)
    ) {
      log.warn('Subscription update rejected due to disallowed price', { targetPriceId });
      return buildErrorResponse('A választott számlázási időszak nem érhető el.', 400);
    }

    log.info('Updating subscription', {
      subscriptionId: subscription.id,
      currentPriceId,
      targetPriceId,
      billingInterval,
    });

    // Update subscription to new price
    // Stripe will prorate the difference
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0]!.id,
          price: targetPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Prorate the difference
    });

    log.info('Subscription updated successfully', {
      subscriptionId: updatedSubscription.id,
      newPriceId: targetPriceId,
    });

    // Audit log the subscription update
    await logAuditEvent(supabase, {
      eventType: 'subscription_updated',
      userId,
      metadata: {
        subscriptionId: subscription.id,
        oldPriceId: currentPriceId,
        newPriceId: targetPriceId,
        billingInterval,
      },
      requestId,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: `Sikeresen átállítottuk a számlázást ${billingInterval === 'annual' ? 'éves' : 'havi'} időszakra.`,
      subscriptionId: updatedSubscription.id,
    });
  } catch (error) {
    log.error('Stripe subscription update failed', error);
    const errorMessage =
      error instanceof Stripe.errors.StripeError
        ? error.message
        : 'Nem sikerült frissíteni az előfizetést.';
    return buildErrorResponse(errorMessage, 500);
  }
});


