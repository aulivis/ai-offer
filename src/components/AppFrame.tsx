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
      <main
        id="main"
        className="flex min-h-[60vh] items-center justify-center px-6 pb-20 pt-24 text-sm font-medium text-fg-muted"
      >
        Betöltés…
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 pb-20 pt-24 md:flex-row md:gap-10">
      {sidebar ? (
        <aside className="md:sticky md:top-36 md:w-64 md:flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-full border border-border/70 bg-bg/80 px-3 py-2 text-sm font-medium text-fg-muted shadow-card backdrop-blur transition hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
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
            className={`mt-4 space-y-4 rounded-3xl border border-border/70 bg-bg/80 p-4 shadow-card backdrop-blur md:mt-0 md:block ${
              isSidebarOpen ? 'block' : 'hidden'
            }`}
          >
            {sidebar}
          </div>
        </aside>
      ) : null}

      <main id="main" className="flex-1 space-y-8">
        <nav className="flex flex-wrap gap-2 rounded-3xl border border-border/60 bg-bg/80 px-4 py-2 text-sm text-fg-muted shadow-card backdrop-blur">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active
                    ? 'bg-primary text-primary-ink shadow-card'
                    : 'hover:bg-bg-muted/80 hover:text-fg'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

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
  );
}
