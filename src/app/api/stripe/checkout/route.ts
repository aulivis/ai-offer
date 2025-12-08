import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';
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
import { withAuth, type AuthenticatedNextRequest } from '@/middleware/auth';
import { withAuthenticatedErrorHandling } from '@/lib/errorHandling';
import { HttpStatus, createErrorResponse } from '@/lib/errorHandling';
import { createLogger } from '@/lib/logger';

const stripe = new Stripe(envServer.STRIPE_SECRET_KEY);

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

export const POST = withAuth(
  withAuthenticatedErrorHandling(async (req: AuthenticatedNextRequest) => {
    const requestId = randomUUID();
    const clientId = getClientIdentifier(req);
    const log = createLogger(requestId);
    log.setContext({ userId: req.user.id, clientId });

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
        log.warn('Checkout rate limit exceeded', {
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
      log.error('Rate limit check failed', error);
      // Allow request to proceed if rate limiting fails to avoid blocking legitimate users
    }

    let parsedBody: { priceId: string; email: string } | null = null;
    try {
      const body = await req.json();
      parsedBody = parseRequestBody(body);
    } catch (error) {
      log.warn('Checkout request payload parse failed', {
        error:
          error instanceof Error ? { name: error.name, message: error.message } : String(error),
      });
      return createErrorResponse('Érvénytelen kérés törzs.', HttpStatus.BAD_REQUEST);
    }

    if (!parsedBody) {
      log.warn('Checkout request validation failed');
      return createErrorResponse(
        'Érvénytelen kérés: hiányzó priceId vagy email.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { priceId, email } = parsedBody;

    if (
      envServer.STRIPE_PRICE_ALLOWLIST.length > 0 &&
      !envServer.STRIPE_PRICE_ALLOWLIST.includes(priceId)
    ) {
      log.warn('Checkout request rejected due to disallowed price', { priceId });
      return createErrorResponse('A választott előfizetés nem érhető el.', HttpStatus.BAD_REQUEST);
    }

    const userEmail = req.user.email;
    const userId = req.user.id;

    if (!userEmail) {
      log.warn('Checkout user is missing email');
      return createErrorResponse('A fiókhoz nem tartozik email-cím.', HttpStatus.FORBIDDEN);
    }

    if (userEmail.toLowerCase() !== email.toLowerCase()) {
      log.warn('Checkout email mismatch');
      return createErrorResponse(
        'A megadott email nem egyezik a fiókod email-címével.',
        HttpStatus.FORBIDDEN,
      );
    }

    log.info('Checkout session creation started', { priceId });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      success_url: `${envServer.APP_URL}/billing?status=success`,
      cancel_url: `${envServer.APP_URL}/billing?status=cancel`,
    });

    const sessionUrl = session.url;
    log.info('Checkout session created', {
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
  }),
);
