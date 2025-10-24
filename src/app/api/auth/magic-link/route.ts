import { z } from 'zod';

import { createAuthRequestLogger, normalizeEmail, type RequestLogger } from '@/lib/observability/authLogging';
import { recordMagicLinkSend } from '@/lib/observability/metrics';

import { envServer } from '@/env.server';

import { supabaseAnonServer } from '../../../lib/supabaseAnonServer';
import { supabaseServer } from '../../../lib/supabaseServer';
import { consumeMagicLinkRateLimit } from './rateLimiter';
import type { RateLimitResult } from './rateLimiter';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a magic link will arrive shortly.',
};

const requestSchema = z.object({
  email: z.string().email(),
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

async function sendMagicLink(
  supabase: ReturnType<typeof supabaseServer>,
  email: string,
  logger: RequestLogger,
) {
  const admin = supabase.auth.admin as SupabaseAdminClient;
  const emailRedirectTo = new URL('/api/auth/callback', envServer.APP_URL).toString();
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
): Promise<RateLimitResult> {
  try {
    return await consumeMagicLinkRateLimit(supabase, key);
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
  logger.setEmail(email);
  const clientIp = getClientIp(request);

  const supabase = supabaseServer();

  const [ipResult, emailResult] = await Promise.all([
    enforceRateLimit(supabase, `ip:${clientIp}`, logger),
    enforceRateLimit(supabase, `email:${email}`, logger),
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
      await sendMagicLink(supabase, email, logger);
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
