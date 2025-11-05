import { cookies } from 'next/headers';

import { CSRF_COOKIE_NAME, createCsrfToken } from './csrf';

const isProduction = process.env.NODE_ENV === 'production';
const sameSite = (isProduction ? 'strict' : 'lax') as 'strict' | 'lax';

const baseCookieOptions = {
  httpOnly: true,
  sameSite,
  secure: isProduction,
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
) {
  const cookieStore = await cookies();
  const { accessTokenMaxAgeSeconds, rememberMe = false } = options;

  cookieStore.set({
    name: 'propono_at',
    value: accessToken,
    ...baseCookieOptions,
    ...(accessTokenMaxAgeSeconds ? { maxAge: accessTokenMaxAgeSeconds } : {}),
  });

  cookieStore.set({
    name: 'propono_rt',
    value: refreshToken,
    ...baseCookieOptions,
    // Set maxAge only if rememberMe is true, otherwise it's a session cookie
    ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE_SECONDS } : {}),
  });

  const { value: csrfValue } = createCsrfToken();

  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: csrfValue,
    ...baseCookieOptions,
    httpOnly: false,
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
