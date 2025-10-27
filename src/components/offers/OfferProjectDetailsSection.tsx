import type { ChangeEventHandler } from 'react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

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
    <Card as="section" className="grid w-full max-w-[var(--column-width)] gap-5">
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
    </Card>
  );
}
