import { envServer } from '@/env.server';

function normalizeUrl(target: string): string | null {
  try {
    return new URL(target).toString();
  } catch {
    return null;
  }
}

function buildFallback(fallbackPath: string): string {
  const normalized = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
  return new URL(normalized, envServer.APP_URL).toString();
}

export function sanitizeOAuthRedirect(requested: string | null, fallbackPath: string): string {
  const fallback = buildFallback(fallbackPath);
  if (!requested) {
    return fallback;
  }

  const normalizedRequested = normalizeUrl(requested);
  if (!normalizedRequested) {
    return fallback;
  }

  const allowlist = envServer.OAUTH_REDIRECT_ALLOWLIST;
  if (allowlist.length === 0) {
    try {
      const allowedOrigin = new URL(envServer.APP_URL).origin;
      const requestedOrigin = new URL(normalizedRequested).origin;
      return allowedOrigin === requestedOrigin ? normalizedRequested : fallback;
    } catch {
      return fallback;
    }
  }

  const normalizedAllowlist = new Set(
    allowlist
      .map((target) => normalizeUrl(target))
      .filter((target): target is string => Boolean(target)),
  );

  return normalizedAllowlist.has(normalizedRequested) ? normalizedRequested : fallback;
}
