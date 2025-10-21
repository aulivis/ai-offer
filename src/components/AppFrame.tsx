'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

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
};

export default function AppFrame({ title, description, actions, children }: AppFrameProps) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'checking' | 'ready'>('checking');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: { user } } = await supabaseBrowser().auth.getUser();

        if (!user) {
          const redirectTo = typeof window !== 'undefined' ? window.location.pathname : '/login';
          window.location.href = `/login?redirect=${encodeURIComponent(redirectTo)}`;
          return;
        }

        if (active) {
          setAuthState('ready');
        }
      } catch (error) {
        console.error('Failed to verify authentication status.', error);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (authState !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <span className="text-sm font-medium">Betöltés…</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%)]" />
      <div className="relative">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-900">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white font-display text-base">
              P
            </span>
            Propono
          </Link>
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-1.5 transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-4">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl text-slate-900">{title}</h1>
              {description ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
