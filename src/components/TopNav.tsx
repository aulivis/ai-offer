// src/components/TopNav.tsx
export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:bg-ink-900/80 dark:border-slate-700">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/logo.svg" alt="Propono" className="h-7" />
          <span className="font-display text-xl tracking-tight text-ink-900 dark:text-slate-100">
            Propono
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <a className="px-3 py-2 text-sm text-slate-600 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white" href="/dashboard">Dashboard</a>
          <a className="px-3 py-2 text-sm text-slate-600 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white" href="/new">Új ajánlat</a>
          <a className="px-3 py-2 text-sm text-slate-600 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white" href="/settings">Beállítások</a>
          <a
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue-500 to-brand-emerald-500 px-4 py-2 text-white shadow-card hover:shadow-pop"
            href="/billing"
          >
            Frissítés
          </a>
        </nav>
      </div>
    </header>
  );
}
