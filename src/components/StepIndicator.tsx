'use client';

type Props = { step: number; total: number; labels: string[] };
export default function StepIndicator({ step, total, labels }: Props) {
  return (
    <ol className="flex flex-wrap items-center gap-4">
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 <= step;
        const current = i + 1 === step;
        return (
          <li key={i} className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-medium transition ${
                active ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-sm ${
                current ? 'font-semibold text-slate-900' : active ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {labels[i] || `Lépés ${i + 1}`}
            </span>
            {i < total - 1 && <span className="h-px w-10 rounded bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}
