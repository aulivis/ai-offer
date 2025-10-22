import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { envServer } from '@/env.server';

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

export async function POST(req: NextRequest) {
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

  if (!envServer.STRIPE_PRICE_ALLOWLIST.includes(priceId)) {
    console.warn('Checkout request rejected due to disallowed price', { requestId, clientId, priceId });
    return buildErrorResponse('A választott előfizetés nem érhető el.', 400);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('Checkout request missing authorization header', { requestId, clientId });
    return buildErrorResponse('A fizetéshez be kell jelentkezned.', 401);
  }

  const token = authHeader.split(' ')[1];

  const sb = supabaseServer();
  let userEmail: string | null = null;
  let userId: string | null = null;
  try {
    const {
      data: { user },
      error,
    } = await sb.auth.getUser(token);
    if (error || !user) {
      console.warn('Checkout authorization failed', { requestId, clientId, reason: error?.message ?? 'no-user' });
      return buildErrorResponse('A bejelentkezés lejárt vagy érvénytelen.', 401);
    }

    userEmail = user.email ?? null;
    userId = user.id ?? null;
  } catch (error) {
    console.error('Checkout authorization threw an error', { requestId, clientId, error });
    return buildErrorResponse('Nem sikerült ellenőrizni a bejelentkezést.', 401);
  }

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

    console.info('Checkout session created', { requestId, clientId, sessionUrl: session.url, userId });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout session creation failed', { requestId, clientId, error, userId });
    return buildErrorResponse('Nem sikerült elindítani a Stripe fizetést.', 500);
  }
}

export const __test = {
  resetRateLimiter() {
    rateLimitStore.clear();
  },
};
