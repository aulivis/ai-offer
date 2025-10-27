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

export function t(key: CopyKey, locale: LocaleKey = 'hu'): string {
  const keys = key.split('.');
  let value: unknown = dictionary[locale];

  for (const k of keys) {
    if (typeof value !== 'object' || value === null) {
      return key;
    }
    value = (value as Record<string, unknown>)[k];
  }

  return typeof value === 'string' ? value : key;
}

export { hu };
