import { useState } from 'react';
import type { ChangeEventHandler } from 'react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { t } from '@/copy';
import { type ProjectDetailKey, type ProjectDetails } from '@/lib/projectDetails';

type OfferProjectDetailsSectionProps = {
  title: string;
  projectDetails: ProjectDetails;
  onTitleChange: ChangeEventHandler<HTMLInputElement>;
  onProjectDetailsChange: (field: ProjectDetailKey, value: string) => void;
};

const MAX_LENGTHS: Record<ProjectDetailKey, number> = {
  overview: 600,
  deliverables: 400,
  timeline: 400,
  constraints: 400,
};

const fieldOrder: ProjectDetailKey[] = ['overview', 'deliverables', 'timeline', 'constraints'];

export function OfferProjectDetailsSection({
  title,
  projectDetails,
  onTitleChange,
  onProjectDetailsChange,
}: OfferProjectDetailsSectionProps) {
  const [tipsOpen, setTipsOpen] = useState(false);

  const toggleTips = () => setTipsOpen((value) => !value);

  return (
    <Card as="section" className="grid w-full max-w-[var(--column-width)] gap-6">
      <Input
        label={t('offers.wizard.forms.details.titleLabel')}
        value={title}
        onChange={onTitleChange}
        placeholder={t('offers.wizard.forms.details.titlePlaceholder')}
        help={t('offers.wizard.forms.details.titleHelp')}
      />

      <div className="space-y-4 rounded-2xl border border-border/70 bg-bg/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-fg">
              {t('offers.wizard.forms.details.tips.title')}
            </p>
            <p className="text-xs text-fg-muted">
              {t('offers.wizard.forms.details.tips.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleTips}
            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg transition hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {tipsOpen
              ? t('offers.wizard.forms.details.tips.hide')
              : t('offers.wizard.forms.details.tips.show')}
          </button>
        </div>
        {tipsOpen && (
          <ul className="list-disc space-y-2 pl-5 text-xs text-fg-muted">
            <li>{t('offers.wizard.forms.details.tips.items.overview')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.deliverables')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.timeline')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.constraints')}</li>
          </ul>
        )}
      </div>

      {fieldOrder.map((field) => (
        <Textarea
          key={field}
          value={projectDetails[field]}
          onChange={(event) => onProjectDetailsChange(field, event.target.value)}
          label={t(`offers.wizard.forms.details.fields.${field}.label` as const)}
          placeholder={t(`offers.wizard.forms.details.fields.${field}.placeholder` as const)}
          help={t(`offers.wizard.forms.details.fields.${field}.help` as const)}
          maxLength={MAX_LENGTHS[field]}
          showCounter
          className="min-h-[7.5rem]"
        />
      ))}
    </Card>
  );
}
