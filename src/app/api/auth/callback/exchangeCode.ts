import { envServer } from '@/env.server';
import { createAuthRequestLogger, type RequestLogger } from '@/lib/observability/authLogging';

export type ExchangeCodeParams = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

export type ExchangeCodeResult = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

function redactJsonTokens(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactJsonTokens(item));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (acc, [key, entryValue]) => {
        if (/token|secret|key/i.test(key)) {
          acc[key] = '[REDACTED]';
          return acc;
        }
        acc[key] = redactJsonTokens(entryValue);
        return acc;
      },
      {},
    );
  }
  return value;
}

function sanitizeErrorBody(contentType: string, rawBody: string): unknown {
  if (!rawBody) {
    return null;
  }
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      return redactJsonTokens(parsed);
    } catch {
      return '[INVALID JSON]';
    }
  }
  if (/token|secret|key/i.test(rawBody)) {
    return '[REDACTED SENSITIVE CONTENT]';
  }
  return rawBody;
}

/** PKCE token csere a Supabase GoTrue felé (JSON formátum, grant_type=pkce) */
export async function exchangeCode(
  { code, codeVerifier, redirectUri }: ExchangeCodeParams,
  logger: RequestLogger,
): Promise<ExchangeCodeResult> {
  const url = new URL('/auth/v1/token', envServer.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set('grant_type', 'pkce');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      apikey: envServer.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = await response.text();

  if (!response.ok) {
    logger.error('Supabase token exchange failed', {
      status: response.status,
      statusText: response.statusText,
      body: sanitizeErrorBody(contentType, rawBody),
    });
    throw new Error(`Supabase token exchange failed with status ${response.status}`);
  }

  try {
    return rawBody ? (JSON.parse(rawBody) as ExchangeCodeResult) : ({} as ExchangeCodeResult);
  } catch (error) {
    logger.error('Supabase token exchange returned invalid JSON', error);
    throw new Error('Supabase token exchange returned invalid JSON.');
  }
}
