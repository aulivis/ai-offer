import Link from 'next/link';

type LandingHeaderProps = {
  className?: string;
};

export default function LandingHeader({ className }: LandingHeaderProps) {
  const baseClass =
    'mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-fg';
  const headerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <header className={headerClass}>
      <Link
        href="/"
        className="flex items-center gap-3 font-display text-lg tracking-[0.2em] uppercase text-fg"
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-mint-500 to-mint-300 text-night-900 shadow-pop">
          P
        </span>
        Propono
      </Link>
      <nav className="flex items-center gap-2 text-sm font-medium text-fg-muted">
        <Link className="rounded-full px-3.5 py-2 transition hover:text-fg" href="/demo">
          Termék
        </Link>
        <Link className="rounded-full px-3.5 py-2 transition hover:text-fg" href="/billing">
          Csomagok
        </Link>
        <Link
          className="rounded-full border border-primary/60 px-4 py-2 text-fg transition hover:border-primary hover:bg-primary hover:text-primary-ink"
          href="/login"
        >
          Bejelentkezés
        </Link>
      </nav>
    </header>
  );
}
