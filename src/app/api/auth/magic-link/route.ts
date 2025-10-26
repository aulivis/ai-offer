import { z } from 'zod';

import {
  createAuthRequestLogger,
  normalizeEmail,
  type RequestLogger,
} from '@/lib/observability/authLogging';
import { recordMagicLinkSend } from '@/lib/observability/metrics';

import { envServer } from '@/env.server';

import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { supabaseServer } from '../../../lib/supabaseServer';
import { consumeMagicLinkRateLimit, hashMagicLinkEmailKey } from './rateLimiter';
import type { RateLimitResult } from './rateLimiter';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a magic link will arrive shortly.',
};

const requestSchema = z.object({
  email: z.string().email(),
  redirect_to: z.string().optional(), // opcionális cél, pl. "/dashboard"
});

const json202 = () => Response.json(GENERIC_RESPONSE, { status: 202 });

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [first] = forwardedFor.split(',');
    if (first) {
      return first.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

type SupabaseAdminClient = ReturnType<typeof supabaseServer>['auth']['admin'] &
  Partial<{
    signInWithOtp: (params: {
      email: string;
      options?: { emailRedirectTo?: string; shouldCreateUser?: boolean };
    }) => Promise<unknown>;
    generateLink: (params: {
      type: 'magiclink';
      email: string;
      options?: { emailRedirectTo?: string; shouldCreateUser?: boolean };
    }) => Promise<unknown>;
  }>;

function sanitizeRedirect(to?: string | null): string {
  const fallback = '/dashboard';
  if (typeof to !== 'string') return fallback;

  const trimmed = to.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith('/')) return fallback;

  const hasUnsafePrefix = (value: string) =>
    /^[\\/]{2}/.test(value) || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);

  if (hasUnsafePrefix(trimmed)) return fallback;

  let decodedCandidate = trimmed;
  for (let i = 0; i < 5; i += 1) {
    try {
      const decoded = decodeURIComponent(decodedCandidate);
      if (decoded === decodedCandidate) break;
      decodedCandidate = decoded;
    } catch {
      break;
    }

    if (hasUnsafePrefix(decodedCandidate)) {
      return fallback;
    }
  }

  return trimmed || fallback;
}

async function sendMagicLink(
  supabase: ReturnType<typeof supabaseServer>,
  email: string,
  emailRedirectTo: string,
  logger: RequestLogger,
) {
  const admin = supabase.auth.admin as SupabaseAdminClient;
  const otpOptions = { emailRedirectTo, shouldCreateUser: true } as const;

  const anonClient = supabaseAnonServer();
  let lastError: unknown;

  try {
    if (typeof anonClient.auth.signInWithOtp === 'function') {
      await anonClient.auth.signInWithOtp({ email, options: otpOptions });
      return;
    }
  } catch (error) {
    lastError = error;
    logger.error('Failed to send Supabase magic link via anon client.', error);
  }

  if (typeof admin.signInWithOtp === 'function') {
    await admin.signInWithOtp({ email, options: otpOptions });
    return;
  }

  if (typeof admin.generateLink === 'function') {
    await admin.generateLink({ type: 'magiclink', email, options: otpOptions });
    return;
  }

  if (lastError) {
    throw lastError;
  }
}

async function enforceRateLimit(
  supabase: ReturnType<typeof supabaseServer>,
  key: string,
  logger: RequestLogger,
  legacyKeys: string[] = [],
): Promise<RateLimitResult> {
  try {
    return await consumeMagicLinkRateLimit(supabase, key, Date.now(), legacyKeys);
  } catch (error) {
    logger.error('Failed to enforce magic link rate limit.', error, { key });
    return { allowed: true, retryAfterMs: 0 };
  }
}

export async function POST(request: Request) {
  const logger = createAuthRequestLogger();
  logger.info('Magic link OTP request received.');

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    logger.error('Failed to parse request payload for magic link.', error);
    recordMagicLinkSend('failure', { reason: 'invalid_payload' });
    return json202();
  }

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    logger.warn('Magic link OTP request failed schema validation.');
    recordMagicLinkSend('failure', { reason: 'invalid_payload' });
    return json202();
  }

  const email = normalizeEmail(parseResult.data.email);
  const finalRedirect = sanitizeRedirect(parseResult.data.redirect_to);
  logger.setEmail(email);
  const clientIp = getClientIp(request);

  const supabase = supabaseServer();

  const hashedEmailKey = hashMagicLinkEmailKey(email);
  const legacyEmailKey = `email:${email}`;

  const [ipResult, emailResult] = await Promise.all([
    enforceRateLimit(supabase, `ip:${clientIp}`, logger),
    enforceRateLimit(supabase, hashedEmailKey, logger, [legacyEmailKey]),
  ]);

  const rateLimited = !ipResult.allowed || !emailResult.allowed;

  if (rateLimited) {
    if (!ipResult.allowed) {
      const retrySeconds = Math.max(1, Math.ceil(ipResult.retryAfterMs / 1000));
      logger.warn('Magic link IP rate limit exceeded.', {
        clientIp,
        retrySeconds,
      });
    }

    if (!emailResult.allowed) {
      const retrySeconds = Math.max(1, Math.ceil(emailResult.retryAfterMs / 1000));
      logger.warn('Magic link email rate limit exceeded.', {
        retrySeconds,
      });
    }

    recordMagicLinkSend('failure', { reason: 'rate_limit' });
  } else {
    try {
      // FONTOS: a magic link a kliens oldali /auth/callback oldalra érkezzen,
      // hogy a hash-ben lévő tokeneket ki tudjuk olvasni, majd továbbküldeni az API callbackre.
      const emailRedirectTo = new URL('/auth/callback', envServer.APP_URL);
      emailRedirectTo.searchParams.set('redirect_to', finalRedirect);

      await sendMagicLink(supabase, email, emailRedirectTo.toString(), logger);
      logger.info('Magic link OTP email dispatched successfully.', {
        clientIp,
      });
      recordMagicLinkSend('success');
    } catch (error) {
      logger.error('Failed to send Supabase magic link.', error);
      recordMagicLinkSend('failure', { reason: 'supabase_error' });
    }
  }

  logger.info('Magic link OTP request completed.');
  return json202();
}
