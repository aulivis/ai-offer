// src/components/ui/Card.tsx
export function Card({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="card dark:border-slate-700 dark:bg-ink-900">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/70">
        <h2 className="font-display text-lg text-ink-900 dark:text-slate-100">{title}</h2>
        <div>{actions}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
