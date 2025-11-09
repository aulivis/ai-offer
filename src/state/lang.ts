import type { LocaleKey } from '@/copy';

export type Language = LocaleKey;

type LanguageListener = (language: Language) => void;

// Define minimal interface for AsyncLocalStorage to avoid importing node:async_hooks types
interface AsyncLocalStorage<T> {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
}

const LANGUAGE_COOKIE_NAME = 'language';

const SUPPORTED_LANGUAGES: readonly Language[] = ['hu', 'en'];

let clientLanguage: Language = 'hu';
const listeners = new Set<LanguageListener>();

let languageStorage: AsyncLocalStorage<Language> | null = null;

function getAsyncLocalStorage(): AsyncLocalStorage<Language> | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!languageStorage) {
    try {
      // Dynamically require async_hooks only on server side
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asyncHooks = require('node:async_hooks');
      languageStorage = new asyncHooks.AsyncLocalStorage<Language>();
    } catch {
      // If async_hooks is not available (shouldn't happen in Node.js), return null
      return null;
    }
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
