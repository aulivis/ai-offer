import { useId, useState } from 'react';
import type { ChangeEventHandler } from 'react';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { t } from '@/copy';
import { type ProjectDetailKey, type ProjectDetails } from '@/lib/projectDetails';

type OfferProjectDetailsSectionProps = {
  title: string;
  projectDetails: ProjectDetails;
  onTitleChange: ChangeEventHandler<HTMLInputElement>;
  onProjectDetailsChange: (field: ProjectDetailKey, value: string) => void;
  errors?: {
    title?: string;
    projectDetails?: Partial<Record<ProjectDetailKey, string>>;
  };
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
  errors,
}: OfferProjectDetailsSectionProps) {
  const [tipsOpen, setTipsOpen] = useState(false);
  const sectionId = useId();
  const tipsContentId = `${sectionId}-tips`;
  const tipsHeadingId = `${sectionId}-tips-heading`;

  const toggleTips = () => setTipsOpen((value) => !value);

  return (
    <Card
      as="section"
      aria-labelledby={sectionId}
      className="w-full max-w-[var(--column-width)] space-y-8"
    >
      <CardHeader className="!mb-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M7 3.75h10A1.25 1.25 0 0 1 18.25 5v14A1.25 1.25 0 0 1 17 20.25H7A1.25 1.25 0 0 1 5.75 19V5A1.25 1.25 0 0 1 7 3.75Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 8.25h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 15.75h3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="space-y-1">
            <h2 id={sectionId} className="text-base font-semibold text-fg">
              {t('offers.wizard.forms.details.sectionHeading')}
            </h2>
            <p className="text-sm text-fg-muted">
              {t('offers.wizard.forms.details.sectionDescription')}
            </p>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-8">
        <Input
          label={t('offers.wizard.forms.details.titleLabel')}
          value={title}
          onChange={onTitleChange}
          placeholder={t('offers.wizard.forms.details.titlePlaceholder')}
          help={t('offers.wizard.forms.details.titleHelp')}
          error={errors?.title}
        />

        <div className="rounded-2xl border border-border/70 bg-[rgb(var(--color-bg-muted-rgb)/0.65)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3.5a6.5 6.5 0 0 1 4.95 10.75c-.73.74-1.2 1.7-1.2 2.77v.48a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75v-.48c0-1.07-.47-2.03-1.2-2.77A6.5 6.5 0 0 1 12 3.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M10 20.25h4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 17.5h2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="space-y-1">
                <h3 id={tipsHeadingId} className="text-sm font-semibold text-fg">
                  {t('offers.wizard.forms.details.tips.title')}
                </h3>
                <p className="text-xs text-fg-muted">
                  {t('offers.wizard.forms.details.tips.subtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTips}
              aria-expanded={tipsOpen}
              aria-controls={tipsContentId}
              className="inline-flex w-full items-center justify-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg transition hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
            >
              {tipsOpen
                ? t('offers.wizard.forms.details.tips.hide')
                : t('offers.wizard.forms.details.tips.show')}
            </button>
          </div>
          <ul
            id={tipsContentId}
            aria-labelledby={tipsHeadingId}
            className={`mt-4 list-disc space-y-2 pl-6 text-xs text-fg-muted transition-opacity duration-200 ${tipsOpen ? 'opacity-100' : 'hidden opacity-0'}`}
            aria-hidden={tipsOpen ? undefined : true}
          >
            <li>{t('offers.wizard.forms.details.tips.items.overview')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.deliverables')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.timeline')}</li>
            <li>{t('offers.wizard.forms.details.tips.items.constraints')}</li>
          </ul>
        </div>

        <div className="space-y-6">
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
              error={errors?.projectDetails?.[field]}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
