'use client';

import type { LocaleKey } from '@/copy';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { LANGUAGE_COOKIE_NAME, setLanguage as setLanguageState } from './lang';
import { clientLogger } from '@/lib/clientLogger';

type LanguageContextValue = {
  language: LocaleKey;
  setLanguage: (language: LocaleKey) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type Props = {
  initialLanguage: LocaleKey;
  children: ReactNode;
};

function persistLanguage(language: LocaleKey) {
  try {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch (error) {
    clientLogger.warn('Failed to persist language preference', { error, language });
  }
}

export function LanguageProvider({ initialLanguage, children }: Props) {
  const [language, setLanguage] = useState<LocaleKey>(initialLanguage);

  if (typeof window !== 'undefined') {
    setLanguageState(language);
    persistLanguage(language);
  }

  const handleSetLanguage = useCallback((nextLanguage: LocaleKey) => {
    setLanguage((prev) => {
      if (prev === nextLanguage) {
        return prev;
      }

      if (typeof window !== 'undefined') {
        setLanguageState(nextLanguage);
        persistLanguage(nextLanguage);
      }

      return nextLanguage;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage: handleSetLanguage }),
    [language, handleSetLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);

  if (!value) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return value;
}

// Removed unused exports: useCurrentLanguage, useSetLanguage
