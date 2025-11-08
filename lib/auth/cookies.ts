import { cookies } from 'next/headers';

import { CSRF_COOKIE_NAME, createCsrfToken } from './csrf';
import { envServer } from '@/env.server';

const isProduction = process.env.NODE_ENV === 'production';
const isSecure = envServer.APP_URL.startsWith('https');
// Use 'lax' for development to allow cookies on redirects, 'strict' for production
const sameSite = (isProduction ? 'strict' : 'lax') as 'strict' | 'lax';

const baseCookieOptions = {
  httpOnly: true,
  sameSite,
  secure: isSecure, // Use APP_URL to determine if we're using HTTPS
  path: '/',
};

type SetAuthCookiesOptions = {
  accessTokenMaxAgeSeconds?: number;
  rememberMe?: boolean;
};

// Industry best practice: 30 days for "remember me" sessions
const REMEMBER_ME_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  options: SetAuthCookiesOptions = {},
  cookieStore?: Awaited<ReturnType<typeof cookies>>,
) {
  // Use provided cookie store or get a new one
  // In Next.js App Router, all calls to cookies() in the same request return the same store
  const store = cookieStore ?? await cookies();
  const { accessTokenMaxAgeSeconds, rememberMe = false } = options;

  store.set({
    name: 'propono_at',
    value: accessToken,
    ...baseCookieOptions,
    // Always set a maxAge to ensure cookie persists across redirects
    // Use provided expiration or default to 1 hour (3600 seconds)
    maxAge: accessTokenMaxAgeSeconds || 3600,
  });

  store.set({
    name: 'propono_rt',
    value: refreshToken,
    ...baseCookieOptions,
    // Always set a maxAge to ensure cookie persists across redirects
    // Use rememberMe expiration if enabled, otherwise use a reasonable default (7 days)
    // Session cookies (no maxAge) can be lost during redirects in some browsers
    maxAge: rememberMe 
      ? REMEMBER_ME_MAX_AGE_SECONDS 
      : Math.max(accessTokenMaxAgeSeconds || 3600, 7 * 24 * 60 * 60), // At least 7 days
  });

  const { value: csrfValue } = createCsrfToken();

  // CSRF cookie should match the session lifetime
  // If rememberMe, use 30 days; otherwise use access token expiration or default to 7 days
  const csrfMaxAge = rememberMe
    ? REMEMBER_ME_MAX_AGE_SECONDS
    : accessTokenMaxAgeSeconds
      ? Math.max(accessTokenMaxAgeSeconds, 7 * 24 * 60 * 60) // At least 7 days for session cookies
      : 7 * 24 * 60 * 60; // Default 7 days

  store.set({
    name: CSRF_COOKIE_NAME,
    value: csrfValue,
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: csrfMaxAge,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'propono_at',
    value: '',
    ...baseCookieOptions,
    maxAge: 0,
  });

  cookieStore.set({
    name: 'propono_rt',
    value: '',
    ...baseCookieOptions,
    maxAge: 0,
  });

  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: '',
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: 0,
  });

  // Clear auth flow cookies
  cookieStore.set({
    name: 'post_auth_redirect',
    value: '',
    ...baseCookieOptions,
    maxAge: 0,
  });

  cookieStore.set({
    name: 'remember_me',
    value: '',
    ...baseCookieOptions,
    maxAge: 0,
  });
}

export async function setCSRFCookie() {
  const cookieStore = await cookies();
  const { value } = createCsrfToken();

  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value,
    ...baseCookieOptions,
    httpOnly: false,
  });
}
