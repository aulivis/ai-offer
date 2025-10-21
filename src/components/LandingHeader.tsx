import Link from 'next/link';

type LandingHeaderProps = {
  className?: string;
};

export default function LandingHeader({ className }: LandingHeaderProps) {
  const baseClass =
    'mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8 text-sm font-semibold tracking-wide text-slate-800';
  const headerClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <header className={headerClass}>
      <Link href="/" className="flex items-center gap-3 text-slate-800">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white font-display text-base">P</span>
        Propono
      </Link>
      <nav className="flex items-center gap-3 text-sm text-slate-500">
        <Link className="rounded-full px-3 py-1.5 transition hover:bg-slate-200/60 hover:text-slate-900" href="/demo">
          Termék
        </Link>
        <Link className="rounded-full px-3 py-1.5 transition hover:bg-slate-200/60 hover:text-slate-900" href="/billing">
          Csomagok
        </Link>
        <Link
          className="rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
          href="/login"
        >
          Bejelentkezés
        </Link>
      </nav>
    </header>
  );
}
