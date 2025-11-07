'use client';

import { t } from '@/copy';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { HelpIcon } from '@/components/ui/HelpIcon';
import {
  projectDetailFields,
  emptyProjectDetails,
  type ProjectDetails,
  type ProjectDetailKey,
} from '@/lib/projectDetails';

const PROJECT_DETAIL_LIMITS: Record<ProjectDetailKey, number> = {
  overview: 600,
  deliverables: 400,
  timeline: 400,
  constraints: 400,
};

type Step1Form = {
  industry: string;
  title: string;
  projectDetails: ProjectDetails;
  deadline: string;
  language: 'hu' | 'en';
  brandVoice: 'friendly' | 'formal';
  style: 'compact' | 'detailed';
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type ValidationErrors = {
  title?: string;
  projectDetails: Partial<Record<ProjectDetailKey, string>>;
};

type WizardStep1DetailsProps = {
  form: Step1Form;
  onFormChange: (form: Partial<Step1Form>) => void;
  client: ClientForm;
  onClientChange: (client: Partial<ClientForm>) => void;
  clientList: Client[];
  onClientSelect: (client: Client) => void;
  availableIndustries: string[];
  validationErrors?: ValidationErrors;
  showClientDropdown: boolean;
  onClientDropdownToggle: (show: boolean) => void;
  filteredClients: Client[];
  textTemplates: Array<{ id: string; name: string }>;
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  quotaInfo: {
    title: string;
    description: string;
    remainingText: string | null;
    pendingText: string | null;
    isExhausted: boolean;
  };
};

export function WizardStep1Details({
  form,
  onFormChange,
  client,
  onClientChange,
  clientList,
  onClientSelect,
  availableIndustries,
  validationErrors,
  showClientDropdown,
  onClientDropdownToggle,
  filteredClients,
  textTemplates,
  selectedTemplateId,
  onTemplateSelect,
  quotaInfo,
}: WizardStep1DetailsProps) {
  const router = useRouter();
  const [detailsTipsOpen, setDetailsTipsOpen] = useState(false);

  const handleFieldChange = (field: keyof Step1Form, value: unknown) => {
    onFormChange({ [field]: value });
  };

  const handleProjectDetailChange = (field: ProjectDetailKey, value: string) => {
    onFormChange({
      projectDetails: {
        ...form.projectDetails,
        [field]: value,
      },
    });
  };

  const handleClientFieldChange = (field: keyof ClientForm, value: string) => {
    onClientChange({ [field]: value });
  };

  const pickClient = (c: Client) => {
    onClientSelect(c);
    onClientDropdownToggle(false);
  };

  return (
    <Card className="space-y-5 border-none bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5 sm:space-y-6" aria-label="Projekt részletek">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('offers.wizard.steps.details')}
        </h2>
        <p className="text-xs text-slate-600">
          {t('offers.wizard.forms.details.sections.overviewHint')}
        </p>
      </div>

      {/* Quota Info and Style Selection - Same Row */}
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr] items-start">
        {/* Quota Info - Enhanced */}
        <div
          className={`rounded-xl border-2 p-4 transition-all shadow-sm ${
            quotaInfo.isExhausted
              ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-800 shadow-rose-100'
              : 'border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-slate-50 text-slate-800 shadow-primary/10'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold tracking-tight">{quotaInfo.title}</p>
              {quotaInfo.isExhausted && (
                <span className="inline-flex items-center rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                  KVÓTA TELJES
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-current/90 leading-relaxed">{quotaInfo.description}</p>
            {quotaInfo.remainingText ? (
              <p className="text-sm font-bold text-current">{quotaInfo.remainingText}</p>
            ) : null}
            {quotaInfo.pendingText ? (
              <p className="text-[11px] font-medium text-current/80">{quotaInfo.pendingText}</p>
            ) : null}
            {quotaInfo.isExhausted && (
              <Button
                type="button"
                onClick={() => router.push('/billing')}
                className="mt-3 w-full rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                Frissítés az előfizetésben →
              </Button>
            )}
          </div>
        </div>

        {/* Style Selection */}
        <section className="space-y-2.5 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t('offers.wizard.forms.details.sections.style')}
            </h3>
            <HelpIcon
              content={t('offers.wizard.forms.details.sections.styleHelper')}
              label={t('offers.wizard.forms.details.sections.style')}
            />
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-1">
            {[
              {
                value: 'compact' as const,
                label: t('offers.wizard.forms.details.styleOptions.compact.label'),
                description: t('offers.wizard.forms.details.styleOptions.compact.description'),
              },
              {
                value: 'detailed' as const,
                label: t('offers.wizard.forms.details.styleOptions.detailed.label'),
                description: t('offers.wizard.forms.details.styleOptions.detailed.description'),
              },
            ].map((option) => {
              const active = form.style === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange('style', option.value)}
                  className={`flex h-full w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-border/70 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <span className="text-xs font-semibold">{option.label}</span>
                  <span className="text-[11px] text-current/80">{option.description}</span>
                </Button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Text Templates */}
      {textTemplates.length > 0 && (
        <section className="space-y-3 rounded-xl border border-dashed border-border/70 bg-white/70 p-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t('offers.wizard.forms.details.templates.heading')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {t('offers.wizard.forms.details.templates.helper')}
            </p>
          </div>
          <Select
            label={t('offers.wizard.forms.details.templates.selectLabel')}
            value={selectedTemplateId}
            onChange={(e) => onTemplateSelect(e.target.value)}
          >
            <option value="">
              {t('offers.wizard.forms.details.templates.selectPlaceholder')}
            </option>
            {textTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </section>
      )}

      {/* Project Details */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {t('offers.wizard.forms.details.sections.overview')}
          </h3>
          <HelpIcon
            content={t('offers.wizard.forms.details.sections.overviewHelper')}
            label={t('offers.wizard.forms.details.sections.overview')}
          />
        </div>
        <div className="grid gap-4">
          {form.style === 'detailed' && (
            <Select
              label={t('offers.wizard.forms.details.industryLabel')}
              value={form.industry}
              onChange={(e) => handleFieldChange('industry', e.target.value)}
            >
              {availableIndustries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </Select>
          )}

          <Input
            label={t('offers.wizard.forms.details.titleLabel')}
            placeholder={t('offers.wizard.forms.details.titlePlaceholder')}
            value={form.title}
            error={validationErrors?.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            aria-required="true"
          />

          <Textarea
            label={t('offers.wizard.forms.details.descriptionLabel')}
            placeholder={t('offers.wizard.forms.details.descriptionPlaceholder')}
            value={form.projectDetails.overview}
            maxLength={PROJECT_DETAIL_LIMITS.overview}
            error={validationErrors?.projectDetails?.overview}
            showCounter
            onChange={(e) => handleProjectDetailChange('overview', e.target.value)}
            aria-required="true"
          />

          {form.style === 'detailed' && (
            <div className="space-y-3">
              <div className="space-y-2.5 rounded-xl border border-border/70 bg-white/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-fg">
                      {t('offers.wizard.forms.details.tips.title')}
                    </p>
                    <p className="text-[11px] text-fg-muted">
                      {t('offers.wizard.forms.details.tips.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsTipsOpen((value) => !value)}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-fg transition hover:border-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {detailsTipsOpen
                      ? t('offers.wizard.forms.details.tips.hide')
                      : t('offers.wizard.forms.details.tips.show')}
                  </button>
                </div>
                {detailsTipsOpen && (
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-fg-muted">
                    <li>{t('offers.wizard.forms.details.tips.items.overview')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.deliverables')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.timeline')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.constraints')}</li>
                  </ul>
                )}
              </div>

              {projectDetailFields.filter((field) => field !== 'overview').map((field) => (
                <Textarea
                  key={field}
                  value={form.projectDetails[field]}
                  onChange={(event) => handleProjectDetailChange(field, event.target.value)}
                  label={t(`offers.wizard.forms.details.fields.${field}.label` as const)}
                  placeholder={t(
                    `offers.wizard.forms.details.fields.${field}.placeholder` as const,
                  )}
                  help={t(`offers.wizard.forms.details.fields.${field}.help` as const)}
                  maxLength={PROJECT_DETAIL_LIMITS[field]}
                  error={validationErrors?.projectDetails?.[field]}
                  showCounter
                  className="min-h-[6rem]"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Additional Settings (Detailed Mode) */}
      {form.style === 'detailed' && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t('offers.wizard.forms.details.sections.scope')}
            </h3>
            <HelpIcon
              content={t('offers.wizard.forms.details.sections.scopeHelper')}
              label={t('offers.wizard.forms.details.sections.scope')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={t('offers.wizard.forms.details.deadlineLabel')}
              value={form.deadline}
              onChange={(e) => handleFieldChange('deadline', e.target.value)}
            />
            <Select
              label={t('offers.wizard.forms.details.languageLabel')}
              value={form.language}
              onChange={(e) => handleFieldChange('language', e.target.value as 'hu' | 'en')}
            >
              <option value="hu">{t('offers.wizard.forms.details.languageOptions.hu')}</option>
              <option value="en">{t('offers.wizard.forms.details.languageOptions.en')}</option>
            </Select>
            <Select
              label={t('offers.wizard.forms.details.voiceLabel')}
              value={form.brandVoice}
              onChange={(e) => handleFieldChange('brandVoice', e.target.value as 'friendly' | 'formal')}
            >
              <option value="friendly">
                {t('offers.wizard.forms.details.voiceOptions.friendly')}
              </option>
              <option value="formal">
                {t('offers.wizard.forms.details.voiceOptions.formal')}
              </option>
            </Select>
          </div>
        </section>
      )}

    </Card>
  );
}

