// src/components/Stepper.tsx
export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const item = (n: number, label: string) => (
    <div className={`flex items-center gap-2 ${step >= n ? 'text-ink-900 dark:text-white' : 'text-slate-400'}`}>
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold ${
          step >= n ? 'bg-brand-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
        }`}
      >
        {n}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-6">
      {item(1, 'Részletek')}
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      {item(2, 'Árképzés')}
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      {item(3, 'Előnézet & PDF')}
    </div>
  );
}
