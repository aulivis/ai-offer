import type { ChangeEventHandler } from 'react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { t } from '@/copy';

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
    <Card as="section" className="grid w-full max-w-[var(--column-width)] gap-6">
      <Input
        label={t('wizard.forms.details.titleLabel')}
        value={title}
        onChange={onTitleChange}
        placeholder={t('wizard.forms.details.titlePlaceholder')}
      />

      <label className="block space-y-3">
        <span className="text-sm font-medium text-fg">
          {t('wizard.forms.details.descriptionLabel')}
        </span>
        <textarea
          value={description}
          onChange={onDescriptionChange}
          placeholder={t('wizard.forms.details.descriptionPlaceholder')}
          className="h-32 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-base text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>
    </Card>
  );
}
