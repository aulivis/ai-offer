import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { envServer } from '@/env.server';
import { withAuth, type AuthenticatedNextRequest } from '../../../../../middleware/auth';

const stripe = new Stripe(envServer.STRIPE_SECRET_KEY);

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return (req as NextRequest & { ip?: string }).ip ?? 'unknown';
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true as const };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = entry.resetAt - now;
    return { allowed: false as const, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true as const };
}

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

  const rateLimitResult = checkRateLimit(clientId);
  if (!rateLimitResult.allowed) {
    const retrySeconds = Math.max(1, Math.ceil(rateLimitResult.retryAfterMs / 1000));
    console.warn('Checkout rate limit exceeded', { requestId, clientId, retrySeconds });
    return NextResponse.json(
      { error: 'Túl sok fizetési próbálkozás történt. Próbáld újra később.' },
      {
        status: 429,
        headers: { 'Retry-After': retrySeconds.toString() },
      },
    );
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
  resetRateLimiter() {
    rateLimitStore.clear();
  },
};
