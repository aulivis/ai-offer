import type { ChangeEventHandler } from 'react';

type OfferProjectDetailsSectionProps = {
  title: string;
  description: string;
  onTitleChange: ChangeEventHandler<HTMLInputElement>;
  onDescriptionChange: ChangeEventHandler<HTMLTextAreaElement>;
};

export function OfferProjectDetailsSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: OfferProjectDetailsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Ajánlat címe</span>
          <input
            value={title}
            onChange={onTitleChange}
            placeholder="Pl. Weboldal fejlesztés"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Projekt leírása</span>
          <textarea
            value={description}
            onChange={onDescriptionChange}
            placeholder="Fogalmazd meg röviden az ügyfél problémáját és a megoldást."
            className="h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>
      </div>
    </section>
  );
}
