import type { ChangeEventHandler } from 'react';
import { Input } from '@/components/ui/Input';

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
    <section className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
      <div className="grid gap-5">
        <Input
          label="Ajánlat címe"
          value={title}
          onChange={onTitleChange}
          placeholder="Pl. Weboldal fejlesztés"
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-fg">Projekt leírása</span>
          <textarea
            value={description}
            onChange={onDescriptionChange}
            placeholder="Fogalmazd meg röviden az ügyfél problémáját és a megoldást."
            className="h-32 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-base text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
      </div>
    </section>
  );
}
