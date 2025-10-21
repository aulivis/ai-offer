// src/components/EmptyState.tsx
export function EmptyState() {
  return (
    <div className="text-center py-16">
      <img src="/brand/illustration-empty.svg" alt="" className="mx-auto h-28 mb-6 opacity-90" />
      <h3 className="font-display text-xl text-ink-900 dark:text-slate-100 mb-2">Kezdj egy új ajánlattal</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Hozz létre iparág-specifikus ajánlatot sablonokkal és AI-segítséggel.
      </p>
      <a
        href="/new"
        className="inline-flex items-center rounded-lg bg-brand-emerald-500 hover:bg-brand-emerald-600 px-5 py-2.5 text-white shadow-card"
      >
        Új ajánlat
      </a>
    </div>
  );
}
