import type { LocaleKey } from '@/copy';

export type Language = LocaleKey;

type LanguageListener = (language: Language) => void;

type AsyncLocalStorageModule = typeof import('node:async_hooks');

const LANGUAGE_COOKIE_NAME = 'language';

const SUPPORTED_LANGUAGES: readonly Language[] = ['hu', 'en'];

let clientLanguage: Language = 'hu';
const listeners = new Set<LanguageListener>();

let asyncLocalStorageModule: AsyncLocalStorageModule | null = null;
let languageStorage: import('node:async_hooks').AsyncLocalStorage<Language> | null = null;

function getAsyncLocalStorage(): import('node:async_hooks').AsyncLocalStorage<Language> | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!languageStorage) {
    if (!asyncLocalStorageModule) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      asyncLocalStorageModule = require('node:async_hooks') as AsyncLocalStorageModule;
    }

    languageStorage = new asyncLocalStorageModule.AsyncLocalStorage<Language>();
  }

  return languageStorage;
}

export function withLanguage<T>(language: Language, callback: () => T): T {
  const storage = getAsyncLocalStorage();

  if (!storage) {
    return callback();
  }

  return storage.run(language, callback);
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') {
    const storage = getAsyncLocalStorage();
    return storage?.getStore() ?? 'hu';
  }

  return clientLanguage;
}

export function setLanguage(language: Language): void {
  if (typeof window === 'undefined') {
    throw new Error('setLanguage can only be used in a client environment');
  }

  if (clientLanguage === language) {
    return;
  }

  clientLanguage = language;

  for (const listener of listeners) {
    listener(language);
  }
}

export function subscribeToLanguage(listener: LanguageListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export { LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES };
