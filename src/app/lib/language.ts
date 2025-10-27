import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';

import type { LocaleKey } from '@/copy';

import { LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES, type Language } from '@/state/lang';

const DEFAULT_LANGUAGE: Language = 'hu';

function normalizeLocale(value: string | undefined | null): LocaleKey | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  const [base] = normalized.split('-');

  if (SUPPORTED_LANGUAGES.includes(base as Language)) {
    return base as LocaleKey;
  }

  return undefined;
}

type ParsedLanguage = { code: string; weight: number };

function parseAcceptLanguage(raw: string | null): ParsedLanguage[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((entry) => {
      const [tag, ...params] = entry.split(';').map((value) => value.trim());
      const weightParam = params.find((param) => param.startsWith('q='));
      const weight = weightParam ? Number.parseFloat(weightParam.slice(2)) : 1;

      return {
        code: tag,
        weight: Number.isFinite(weight) ? weight : 0,
      } satisfies ParsedLanguage;
    })
    .sort((a, b) => b.weight - a.weight);
}

function detectFromAcceptLanguage(raw: string | null): LocaleKey | undefined {
  const parsed = parseAcceptLanguage(raw);

  for (const { code } of parsed) {
    const normalized = normalizeLocale(code);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function getRequestLanguage(): Language {
  const cookieLanguage = normalizeLocale(cookies().get(LANGUAGE_COOKIE_NAME)?.value);
  if (cookieLanguage) {
    return cookieLanguage;
  }

  const headerLanguage = detectFromAcceptLanguage(headers().get('accept-language'));
  if (headerLanguage) {
    return headerLanguage;
  }

  return DEFAULT_LANGUAGE;
}

export function resolveRequestLanguage(request: NextRequest): Language {
  const cookieLanguage = normalizeLocale(request.cookies.get(LANGUAGE_COOKIE_NAME)?.value);
  if (cookieLanguage) {
    return cookieLanguage;
  }

  const headerLanguage = detectFromAcceptLanguage(request.headers.get('accept-language'));
  if (headerLanguage) {
    return headerLanguage;
  }

  return DEFAULT_LANGUAGE;
}

export { DEFAULT_LANGUAGE };
