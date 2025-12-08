import type { LocaleKey } from '@/copy';

// Server-only language state management using AsyncLocalStorage
// This file should NEVER be imported by client components

// Define minimal interface for AsyncLocalStorage to avoid importing node:async_hooks types
interface AsyncLocalStorage<T> {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
}

let languageStorage: AsyncLocalStorage<LocaleKey> | null = null;

function getAsyncLocalStorage(): AsyncLocalStorage<LocaleKey> | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  if (!languageStorage) {
    try {
      // Dynamically require async_hooks only on server side
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const asyncHooks = require('async_hooks') as typeof import('async_hooks');
      languageStorage = new asyncHooks.AsyncLocalStorage<LocaleKey>();
    } catch {
      // If async_hooks is not available (shouldn't happen in Node.js), return null
      return null;
    }
  }

  return languageStorage;
}

/**
 * Server-side function to run a callback with a specific language context.
 * Uses AsyncLocalStorage to maintain language context across async operations.
 */
export function withLanguage<T>(language: LocaleKey, callback: () => T): T {
  const storage = getAsyncLocalStorage();

  if (!storage) {
    return callback();
  }

  return storage.run(language, callback);
}

/**
 * Server-side function to get the current language from AsyncLocalStorage.
 * Returns 'hu' as default if no language is set in the current context.
 * Removed unused export: getLanguage
 */
function _getLanguage(): LocaleKey {
  if (typeof window !== 'undefined') {
    // This should never happen in server code, but provide a fallback
    return 'hu';
  }

  const storage = getAsyncLocalStorage();
  return storage?.getStore() ?? 'hu';
}
