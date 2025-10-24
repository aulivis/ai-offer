import { z } from 'zod';

import { supabaseServer } from '../../../lib/supabaseServer';

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a magic link will arrive shortly.',
};

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

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

function isRateLimited(key: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.expiresAt <= now) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  const updatedCount = entry.count + 1;
  rateLimitMap.set(key, { count: updatedCount, expiresAt: entry.expiresAt });

  return updatedCount > RATE_LIMIT_MAX_ATTEMPTS;
}

type SupabaseAdminClient = ReturnType<typeof supabaseServer>['auth']['admin'] &
  Partial<{
    createUser: (attributes: { email: string; email_confirm?: boolean }) =>
      Promise<
        ({ error: { message?: string | null } | null } & Record<string, unknown>)
      >;
    signInWithOtp: (params: { email: string }) => Promise<unknown>;
    generateLink: (params: { type: 'magiclink'; email: string }) => Promise<unknown>;
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

async function sendMagicLink(email: string) {
  const supabase = supabaseServer();
  const admin = supabase.auth.admin as SupabaseAdminClient;

  await ensureSupabaseUser(admin, email);

  if (typeof admin.signInWithOtp === 'function') {
    await admin.signInWithOtp({ email });
    return;
  }

  if (typeof admin.generateLink === 'function') {
    await admin.generateLink({ type: 'magiclink', email });
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

  const rateLimited =
    isRateLimited(`ip:${clientIp}`) || isRateLimited(`email:${email}`);

  if (!rateLimited) {
    try {
      await sendMagicLink(email);
    } catch (error) {
      console.error('Failed to send Supabase magic link.', error);
    }
  }

  return json202();
}
