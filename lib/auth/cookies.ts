import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: true,
  path: '/',
} as const;

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'propono_at',
    value: accessToken,
    ...baseCookieOptions,
  });

  cookieStore.set({
    name: 'propono_rt',
    value: refreshToken,
    ...baseCookieOptions,
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
    name: 'XSRF-TOKEN',
    value: '',
    ...baseCookieOptions,
    maxAge: 0,
  });
}

export async function setCSRFCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: 'XSRF-TOKEN',
    value: 'placeholder',
    ...baseCookieOptions,
  });
}

export function getCookiesFromRequest(req: NextRequest) {
  return req
    .cookies
    .getAll()
    .reduce<Record<string, string>>((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {});
}
