'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

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

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-100 font-display text-base">
              P
            </span>
            Propono
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
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
  );
}
