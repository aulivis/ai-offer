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

type LocaleKey = keyof typeof dictionary;

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
export function t(key: CopyKey, locale: LocaleKey): string;
export function t(key: CopyKey, params: InterpolationValues): string;
export function t(key: CopyKey, params: InterpolationValues, locale: LocaleKey): string;
export function t(
  key: CopyKey,
  paramsOrLocale?: InterpolationValues | LocaleKey,
  maybeLocale?: LocaleKey,
): string {
  let params: InterpolationValues | undefined;
  let locale: LocaleKey = 'hu';

  if (typeof paramsOrLocale === 'string' && paramsOrLocale in dictionary) {
    locale = paramsOrLocale as LocaleKey;
  } else if (paramsOrLocale && typeof paramsOrLocale === 'object') {
    params = paramsOrLocale as InterpolationValues;
    if (maybeLocale) {
      locale = maybeLocale;
    }
  } else if (maybeLocale) {
    locale = maybeLocale;
  }

  const keys = key.split('.');
  let value: unknown = dictionary[locale];

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
