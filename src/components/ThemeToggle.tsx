'use client';

import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const docTheme = document.documentElement.dataset.theme;
  if (docTheme === 'light' || docTheme === 'dark') {
    return docTheme;
  }

  return 'dark';
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const handleToggle = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={[
        'group inline-flex items-center gap-2 rounded-full border border-border/80 bg-[rgb(var(--color-bg-muted-rgb)/0.92)] px-4 py-2 text-sm font-medium normal-case tracking-normal text-fg transition duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:bg-[rgb(var(--color-bg-muted-rgb)/1)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={theme === 'light' ? 'Sötét mód bekapcsolása' : 'Világos mód bekapcsolása'}
    >
      <span aria-hidden className="text-base">
        {theme === 'light' ? '🌙' : '🌞'}
      </span>
      <span className="sr-only">Téma váltása</span>
      <span className="font-semibold text-fg-muted group-hover:text-fg">
        {theme === 'light' ? 'Sötét' : 'Világos'}
      </span>
    </button>
  );
}

export default ThemeToggle;
