'use client';

type Props = { step: number; total: number; labels: string[] };
export default function StepIndicator({ step, total, labels }: Props) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 <= step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full grid place-items-center text-sm
              ${active ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>
              {i + 1}
            </div>
            <div className={`text-sm ${active ? 'text-black font-medium' : 'text-gray-500'}`}>
              {labels[i] || `Lépés ${i + 1}`}
            </div>
            {i < total - 1 && <div className="w-8 h-[2px] bg-gray-200 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
