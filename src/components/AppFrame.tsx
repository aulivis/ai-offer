'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { useToast } from './ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const navLinks = [
  { href: '/dashboard', label: 'Ajánlatok' },
  { href: '/new', label: 'Új ajánlat' },
  { href: '/billing', label: 'Előfizetés' },
  { href: '/settings', label: 'Beállítások' },
];

export type AppFrameProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
};

export default function AppFrame({ title, description, actions, children, sidebar }: AppFrameProps) {
  const pathname = usePathname();
  const { showToast } = useToast();
  const { error, status } = useRequireAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!error) {
      return;
    }
    console.error('Failed to verify authentication status.', error);
    showToast({
      title: 'Hitelesítés sikertelen',
      description: error.message,
      variant: 'error',
    });
  }, [error, showToast]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-fg-muted">
        <span className="text-sm font-medium">Betöltés…</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgb(var(--color-primary-rgb)/0.12),_transparent_60%)]" />
      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-[rgb(var(--color-bg-rgb)/0.85)] backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--color-bg-rgb)/0.7)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="flex items-center gap-3 text-sm font-semibold tracking-wide text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="grid h-10 w-10 place-items-center rounded-3xl border border-border bg-bg font-display text-base">
                P
              </span>
              Propono
            </Link>
            <nav className="flex items-center gap-2 text-sm text-fg-muted">
              {navLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-full px-3.5 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? 'bg-primary text-primary-ink shadow-card'
                        : 'hover:bg-[rgb(var(--color-bg-muted-rgb)/0.6)] hover:text-fg'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-16 pt-8 md:flex-row md:gap-10">
          {sidebar ? (
            <aside className="md:sticky md:top-28 md:w-64 md:flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-full border border-border bg-[rgb(var(--color-bg-rgb)/0.85)] px-3 py-2 text-sm font-medium text-fg-muted shadow-card transition hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
                aria-expanded={isSidebarOpen}
                aria-controls="appframe-sidebar"
              >
                <span>{isSidebarOpen ? 'Oldalsáv elrejtése' : 'Oldalsáv megnyitása'}</span>
                <svg
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                id="appframe-sidebar"
                className={`mt-4 space-y-4 rounded-3xl border border-border bg-[rgb(var(--color-bg-muted-rgb)/0.7)] p-4 shadow-card backdrop-blur md:mt-0 md:block ${
                  isSidebarOpen ? 'block' : 'hidden'
                }`}
              >
                {sidebar}
              </div>
            </aside>
          ) : null}

          <main id="main" className="flex-1 space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-sans text-3xl font-bold tracking-[-0.125rem] text-[#151035]">{title}</h1>
                {description ? <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p> : null}
              </div>
              {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </header>

            {children}
          </main>
        </div>
        <footer aria-label="Oldal lábléc" className="sr-only" />
      </div>
    </div>
  );
}
