import { getLanguage } from '@/state/lang';

import { hu } from './hu';

const dictionary = {
  hu,
  en: {} as Partial<typeof hu>,
} as const;

export type I18nDict = typeof hu;

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type DeepKeys<T> = T extends Primitive
  ? never
  : T extends ReadonlyArray<unknown>
    ? never
    : {
        [K in keyof T & string]: T[K] extends Primitive | ReadonlyArray<unknown>
          ? `${K}`
          : `${K}.${DeepKeys<T[K]>}`;
      }[keyof T & string];

export type CopyKey = DeepKeys<typeof hu>;

export type LocaleKey = keyof typeof dictionary;

const SUPPORTED_LOCALES = Object.keys(dictionary) as LocaleKey[];

function normaliseLocale(locale: string | null | undefined): LocaleKey {
  if (typeof locale !== 'string') {
    return 'hu';
  }

  const candidate = locale.trim().toLowerCase();

  if (!candidate) {
    return 'hu';
  }

  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate)
    ? (candidate as LocaleKey)
    : 'hu';
}

type InterpolationValues = Record<string, string | number>;

function format(value: string, params?: InterpolationValues): string {
  if (!params) {
    return value;
  }

  return Object.entries(params).reduce(
    (acc, [paramKey, paramValue]) =>
      acc.replaceAll(
        `{${paramKey}}`,
        typeof paramValue === 'number' ? String(paramValue) : paramValue,
      ),
    value,
  );
}

function resolveValue(locale: LocaleKey, keys: string[]): unknown {
  let value: unknown = dictionary[locale];

  for (const k of keys) {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[k];
  }

  return value;
}

export function t(key: CopyKey): string;
export function t(key: CopyKey, lang: LocaleKey): string;
export function t(key: CopyKey, params: InterpolationValues): string;
export function t(key: CopyKey, params: InterpolationValues, lang: LocaleKey): string;
export function t(
  key: CopyKey,
  paramsOrLang?: InterpolationValues | LocaleKey,
  lang: LocaleKey = getLanguage(),
): string {
  let params: InterpolationValues | undefined;
  let locale: LocaleKey = lang;

  if (typeof paramsOrLang === 'string' && paramsOrLang in dictionary) {
    locale = paramsOrLang as LocaleKey;
  } else if (paramsOrLang && typeof paramsOrLang === 'object') {
    params = paramsOrLang as InterpolationValues;
  }

  const keys = key.split('.');
  const localizedValue = resolveValue(locale, keys);
  const fallbackValue = locale === 'hu' ? undefined : resolveValue('hu', keys);

  const value =
    typeof localizedValue === 'string'
      ? localizedValue
      : typeof fallbackValue === 'string'
        ? fallbackValue
        : undefined;

  if (typeof value !== 'string') {
    return key;
  }

  return format(value, params);
}

export interface Translator {
  locale: LocaleKey;
  dict: I18nDict;
  t: (key: CopyKey, params?: InterpolationValues) => string;
}

export function resolveLocale(locale: string | null | undefined): LocaleKey {
  return normaliseLocale(locale);
}

export function createTranslator(locale: string | null | undefined): Translator {
  const resolved = normaliseLocale(locale);
  return {
    locale: resolved,
    dict: (dictionary[resolved] ?? dictionary.hu) as I18nDict,
    t(key: CopyKey, params?: InterpolationValues) {
      if (params) {
        return t(key, params, resolved);
      }
      return t(key, resolved);
    },
  };
}

export { hu };
