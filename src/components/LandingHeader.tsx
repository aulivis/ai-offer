import Link from 'next/link';

import ThemeToggle from './ThemeToggle';

type LandingHeaderProps = {
  className?: string;
};

export default function LandingHeader({ className }: LandingHeaderProps) {
  const baseClass =
    'mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-10 text-fg';
  const headerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <header className={headerClass}>
      <Link
        href="/"
        className="flex items-center gap-3 font-display text-lg font-semibold tracking-[0.28em] uppercase text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-gradient-to-br from-primary to-accent text-[#0B0D0F] shadow-pop">
          P
        </span>
        Propono
      </Link>
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-fg-muted">
        <nav className="flex items-center gap-1.5">
          <Link
            className="rounded-full px-3.5 py-2 transition duration-200 ease-out hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/demo"
          >
            Termék
          </Link>
          <Link
            className="rounded-full px-3.5 py-2 transition duration-200 ease-out hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/billing"
          >
            Csomagok
          </Link>
          <Link
            className="rounded-full border border-primary/80 px-4 py-2 text-fg transition duration-200 ease-out hover:border-primary hover:bg-primary hover:text-primary-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href="/login"
          >
            Bejelentkezés
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
