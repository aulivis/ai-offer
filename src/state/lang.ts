import type { LocaleKey } from '@/copy';

export type Language = LocaleKey;

type LanguageListener = (language: Language) => void;

const LANGUAGE_COOKIE_NAME = 'language';

const SUPPORTED_LANGUAGES: readonly Language[] = ['hu', 'en'];

let clientLanguage: Language = 'hu';
const listeners = new Set<LanguageListener>();

/**
 * Client-side function to get the current language.
 * On the server, this returns the default 'hu' (server code should use lang.server.ts).
 * This function is safe to use in client components and will not cause webpack bundling issues.
 */
export function getLanguage(): Language {
  // Client-side: return the client language state
  if (typeof window !== 'undefined') {
    return clientLanguage;
  }

  // Server-side: return default (server code should use getLanguage from lang.server.ts instead)
  // This is a fallback for cases where getLanguage is called on the server but
  // the caller hasn't imported from lang.server.ts
  return 'hu';
}

/**
 * Client-side function to set the language.
 * This should only be called in client components.
 */
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

// Removed unused export: subscribeToLanguage
function _subscribeToLanguage(listener: LanguageListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export { LANGUAGE_COOKIE_NAME, SUPPORTED_LANGUAGES };
