import type { LocaleKey } from '@/copy';

export type Language = LocaleKey;

type SettingsState = {
  lang: Language;
};

let settingsState: SettingsState = {
  lang: 'hu',
};

export function getSettings(): SettingsState {
  return settingsState;
}

export function setSettings(partial: Partial<SettingsState>): void {
  settingsState = {
    ...settingsState,
    ...partial,
  };
}

export function getLanguage(): Language {
  return settingsState.lang;
}

export function setLanguage(language: Language): void {
  settingsState = {
    ...settingsState,
    lang: language,
  };
}
