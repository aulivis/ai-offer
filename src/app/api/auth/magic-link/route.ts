import { z } from 'zod';

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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

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
    createUser: (attributes: { email: string; email_confirm?: boolean }) =>
      Promise<
        ({ error: { message?: string | null } | null } & Record<string, unknown>)
      >;
    signInWithOtp: (params: {
      email: string;
      options?: { emailRedirectTo?: string };
    }) => Promise<unknown>;
    generateLink: (params: {
      type: 'magiclink';
      email: string;
      options?: { emailRedirectTo?: string };
    }) => Promise<unknown>;
  }>;

async function ensureSupabaseUser(admin: SupabaseAdminClient, email: string) {
  if (typeof admin.createUser !== 'function') {
    return;
  }

  try {
    const { error } = await admin.createUser({ email, email_confirm: false });
    if (!error) {
      return;
    }

    const message = (error.message ?? '').toLowerCase();
    if (message.includes('already registered')) {
      return;
    }

    console.error('Failed to ensure Supabase user exists before magic link.', error);
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : '';

    if (!message.includes('already registered')) {
      console.error('Failed to create Supabase user before magic link.', error);
    }
  }
}

async function sendMagicLink(supabase: ReturnType<typeof supabaseServer>, email: string) {
  const admin = supabase.auth.admin as SupabaseAdminClient;
  const emailRedirectTo = new URL('/api/auth/callback', envServer.APP_URL).toString();

  await ensureSupabaseUser(admin, email);

  const anonClient = supabaseAnonServer();
  let lastError: unknown;

  try {
    if (typeof anonClient.auth.signInWithOtp === 'function') {
      await anonClient.auth.signInWithOtp({ email, options: { emailRedirectTo } });
      return;
    }
  } catch (error) {
    lastError = error;
    console.error('Failed to send Supabase magic link via anon client.', error);
  }

  if (typeof admin.signInWithOtp === 'function') {
    await admin.signInWithOtp({ email, options: { emailRedirectTo } });
    return;
  }

  if (typeof admin.generateLink === 'function') {
    await admin.generateLink({ type: 'magiclink', email, options: { emailRedirectTo } });
    return;
  }

  if (lastError) {
    throw lastError;
  }
}

async function enforceRateLimit(
  supabase: ReturnType<typeof supabaseServer>,
  key: string
): Promise<RateLimitResult> {
  try {
    return await consumeMagicLinkRateLimit(supabase, key);
  } catch (error) {
    console.error('Failed to enforce magic link rate limit.', { key }, error);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    console.error('Failed to parse request payload for magic link.', error);
    return json202();
  }

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    return json202();
  }

  const email = normalizeEmail(parseResult.data.email);
  const clientIp = getClientIp(request);

  const supabase = supabaseServer();

  const [ipResult, emailResult] = await Promise.all([
    enforceRateLimit(supabase, `ip:${clientIp}`),
    enforceRateLimit(supabase, `email:${email}`),
  ]);

  const rateLimited = !ipResult.allowed || !emailResult.allowed;

  if (rateLimited) {
    if (!ipResult.allowed) {
      const retrySeconds = Math.max(1, Math.ceil(ipResult.retryAfterMs / 1000));
      console.warn('Magic link IP rate limit exceeded.', {
        clientIp,
        retrySeconds,
      });
    }

    if (!emailResult.allowed) {
      const retrySeconds = Math.max(1, Math.ceil(emailResult.retryAfterMs / 1000));
      console.warn('Magic link email rate limit exceeded.', {
        email,
        retrySeconds,
      });
    }
  } else {
    try {
      await sendMagicLink(supabase, email);
    } catch (error) {
      console.error('Failed to send Supabase magic link.', error);
    }
  }

  return json202();
}
