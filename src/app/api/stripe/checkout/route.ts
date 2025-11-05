import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { envServer } from '@/env.server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';
import {
  consumeRateLimit,
  getClientIdentifier,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
} from '@/lib/rateLimiting';
import { logAuditEvent, getRequestIp } from '@/lib/auditLogging';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

const stripe = new Stripe(envServer.STRIPE_SECRET_KEY);

function buildErrorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseRequestBody(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const priceId = typeof record.priceId === 'string' ? record.priceId.trim() : '';
  const email = typeof record.email === 'string' ? record.email.trim() : '';

  if (!priceId || !email) {
    return null;
  }

  return { priceId, email };
}

export const POST = withAuth(async (req: AuthenticatedNextRequest) => {
  const requestId = randomUUID();
  const clientId = getClientIdentifier(req);

  try {
    const supabase = supabaseServiceRole();
    const rateLimitKey = `checkout:${clientId}`;
    const rateLimitResult = await consumeRateLimit(
      supabase,
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS,
    );

    if (!rateLimitResult.allowed) {
      const retrySeconds = Math.max(1, Math.ceil(rateLimitResult.retryAfterMs / 1000));
      console.warn('Checkout rate limit exceeded', {
        requestId,
        clientId,
        retrySeconds,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
      });
      return NextResponse.json(
        { error: 'Túl sok fizetési próbálkozás történt. Próbáld újra később.' },
        {
          status: 429,
          headers: {
            'Retry-After': retrySeconds.toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          },
        },
      );
    }
  } catch (error) {
    console.error('Rate limit check failed', { requestId, clientId, error });
    // Allow request to proceed if rate limiting fails to avoid blocking legitimate users
  }

  let parsedBody: { priceId: string; email: string } | null = null;
  try {
    const body = await req.json();
    parsedBody = parseRequestBody(body);
  } catch (error) {
    console.warn('Checkout request payload parse failed', { requestId, clientId, error });
    return buildErrorResponse('Érvénytelen kérés törzs.', 400);
  }

  if (!parsedBody) {
    console.warn('Checkout request validation failed', { requestId, clientId });
    return buildErrorResponse('Érvénytelen kérés: hiányzó priceId vagy email.', 400);
  }

  const { priceId, email } = parsedBody;

  if (
    envServer.STRIPE_PRICE_ALLOWLIST.length > 0 &&
    !envServer.STRIPE_PRICE_ALLOWLIST.includes(priceId)
  ) {
    console.warn('Checkout request rejected due to disallowed price', {
      requestId,
      clientId,
      priceId,
    });
    return buildErrorResponse('A választott előfizetés nem érhető el.', 400);
  }

  const userEmail = req.user.email;
  const userId = req.user.id;

  if (!userEmail) {
    console.warn('Checkout user is missing email', { requestId, clientId, userId });
    return buildErrorResponse('A fiókhoz nem tartozik email-cím.', 403);
  }

  if (userEmail.toLowerCase() !== email.toLowerCase()) {
    console.warn('Checkout email mismatch', { requestId, clientId, userId });
    return buildErrorResponse('A megadott email nem egyezik a fiókod email-címével.', 403);
  }

  console.info('Checkout session creation started', { requestId, clientId, priceId, userId });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      success_url: `${envServer.APP_URL}/billing?status=success`,
      cancel_url: `${envServer.APP_URL}/billing?status=cancel`,
    });

    const sessionUrl = session.url;
    console.info('Checkout session created', {
      requestId,
      clientId,
      userId,
      sessionId: session.id ?? 'unknown',
      sessionUrlPresent: Boolean(sessionUrl),
    });

    // Audit log the payment initiation
    const supabase = supabaseServiceRole();
    await logAuditEvent(supabase, {
      eventType: 'payment_initiated',
      userId,
      metadata: { priceId, sessionId: session.id ?? null },
      requestId,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ url: sessionUrl });
  } catch (error) {
    console.error('Stripe checkout session creation failed', {
      requestId,
      clientId,
      error,
      userId,
    });
    return buildErrorResponse('Nem sikerült elindítani a Stripe fizetést.', 500);
  }
});

export const __test = {
  // Rate limiter is now database-backed, no reset needed for tests
};
