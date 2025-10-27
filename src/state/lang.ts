import type { LocaleKey } from '@/copy';

export type Language = LocaleKey;

let currentLanguage: Language = 'hu';

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
}
