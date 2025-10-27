import { getLanguage } from '@/state/lang';

import { hu } from './hu';

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

const dictionary = { hu } as const;

export type LocaleKey = keyof typeof dictionary;

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

export function t(key: CopyKey): string;
export function t(key: CopyKey, lang: LocaleKey): string;
export function t(key: CopyKey, params: InterpolationValues): string;
export function t(key: CopyKey, params: InterpolationValues, lang: LocaleKey): string;
export function t(
  key: CopyKey,
  paramsOrLang?: InterpolationValues | LocaleKey,
  maybeLang?: LocaleKey,
): string {
  let params: InterpolationValues | undefined;
  let locale: LocaleKey | undefined;

  if (typeof paramsOrLang === 'string' && paramsOrLang in dictionary) {
    locale = paramsOrLang as LocaleKey;
  } else if (paramsOrLang && typeof paramsOrLang === 'object') {
    params = paramsOrLang as InterpolationValues;
  }

  if (maybeLang) {
    locale = maybeLang;
  }

  const activeLocale = locale ?? getLanguage();

  const keys = key.split('.');
  let value: unknown = dictionary[activeLocale];

  for (const k of keys) {
    if (typeof value !== 'object' || value === null) {
      return key;
    }
    value = (value as Record<string, unknown>)[k];
  }

  if (typeof value !== 'string') {
    return key;
  }

  return format(value, params);
}

export { hu };
