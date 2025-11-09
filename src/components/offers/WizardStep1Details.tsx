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
  formality: 'tegeződés' | 'magázódás';
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
    <Card
      className="space-y-6 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6 sm:space-y-8"
      aria-label={t('wizard.details.ariaLabel')}
    >
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h2 className="text-xl font-bold text-slate-900">{t('offers.wizard.steps.details')}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t('offers.wizard.forms.details.sections.overviewHint')}
        </p>
      </div>

      {/* Error Summary */}
      {validationErrors &&
        (validationErrors.title ||
          Object.keys(validationErrors.projectDetails || {}).length > 0) && (
          <div className="mb-6 rounded-xl border-2 border-rose-300 bg-rose-50/90 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-semibold text-rose-900">
                  {t('offers.wizard.validation.errorSummaryTitle')}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
                  {validationErrors.title && <li>{validationErrors.title}</li>}
                  {validationErrors.projectDetails?.overview && (
                    <li>{validationErrors.projectDetails.overview}</li>
                  )}
                  {validationErrors.projectDetails?.deliverables && (
                    <li>{validationErrors.projectDetails.deliverables}</li>
                  )}
                  {validationErrors.projectDetails?.timeline && (
                    <li>{validationErrors.projectDetails.timeline}</li>
                  )}
                  {validationErrors.projectDetails?.constraints && (
                    <li>{validationErrors.projectDetails.constraints}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

      {/* Style Selection - More Prominent */}
      <section className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('offers.wizard.forms.details.sections.style')}
          </h3>
          <HelpIcon
            content={t('offers.wizard.forms.details.sections.styleHelper')}
            label={t('offers.wizard.forms.details.sections.style')}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
              <button
                key={option.value}
                type="button"
                onClick={() => handleFieldChange('style', option.value)}
                className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-4 sm:p-5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[100px] touch-manipulation ${
                  active
                    ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      active ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}
                  >
                    {active && (
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block text-sm font-bold ${active ? 'text-primary' : 'text-slate-700'}`}
                    >
                      {option.label}
                    </span>
                    <span
                      className={`block text-xs leading-relaxed mt-1 ${active ? 'text-slate-700' : 'text-slate-500'}`}
                    >
                      {option.description}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quota Info - Compact but Visible */}
      <div
        className={`mb-6 rounded-xl border-2 p-4 transition-all ${
          quotaInfo.isExhausted
            ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-800'
            : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/30 text-slate-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold">{quotaInfo.title}</p>
              {quotaInfo.isExhausted && (
                <span className="inline-flex items-center rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                  {t('wizard.quota.exhaustedBadge')}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-current/90">{quotaInfo.description}</p>
            {quotaInfo.remainingText && !quotaInfo.isExhausted && (
              <p className="text-sm font-bold text-emerald-700">{quotaInfo.remainingText}</p>
            )}
            {quotaInfo.pendingText && (
              <p className="text-[11px] font-medium text-current/80">{quotaInfo.pendingText}</p>
            )}
          </div>
          {quotaInfo.isExhausted && (
            <Button
              type="button"
              onClick={() => router.push('/billing')}
              className="flex-shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {t('wizard.quota.upgradeButton')}
            </Button>
          )}
        </div>
      </div>

      {/* Text Templates */}
      {textTemplates.length > 0 && (
        <section className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-700">
              {t('offers.wizard.forms.details.templates.heading')}
            </h3>
            <p className="text-xs text-slate-600">
              {t('offers.wizard.forms.details.templates.helper')}
            </p>
          </div>
          <Select
            label={t('offers.wizard.forms.details.templates.selectLabel')}
            value={selectedTemplateId}
            onChange={(e) => onTemplateSelect(e.target.value)}
          >
            <option value="">{t('offers.wizard.forms.details.templates.selectPlaceholder')}</option>
            {textTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </section>
      )}

      {/* Project Details */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
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
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary text-base">💡</span>
                      <p className="text-sm font-semibold text-slate-900">
                        {t('offers.wizard.forms.details.tips.title')}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600">
                      {t('offers.wizard.forms.details.tips.subtitle')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsTipsOpen((value) => !value)}
                    className="flex-shrink-0 rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation min-h-[36px]"
                  >
                    {detailsTipsOpen
                      ? t('offers.wizard.forms.details.tips.hide')
                      : t('offers.wizard.forms.details.tips.show')}
                  </button>
                </div>
                {detailsTipsOpen && (
                  <ul className="list-disc space-y-2 pl-5 text-xs text-slate-700">
                    <li>{t('offers.wizard.forms.details.tips.items.overview')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.deliverables')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.timeline')}</li>
                    <li>{t('offers.wizard.forms.details.tips.items.constraints')}</li>
                  </ul>
                )}
              </div>

              {projectDetailFields
                .filter((field) => field !== 'overview')
                .map((field) => (
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
        <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">
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
              onChange={(e) =>
                handleFieldChange('brandVoice', e.target.value as 'friendly' | 'formal')
              }
            >
              <option value="friendly">
                {t('offers.wizard.forms.details.voiceOptions.friendly')}
              </option>
              <option value="formal">{t('offers.wizard.forms.details.voiceOptions.formal')}</option>
            </Select>
            <Select
              label={t('offers.wizard.forms.details.formalityLabel')}
              value={form.formality}
              onChange={(e) =>
                handleFieldChange('formality', e.target.value as 'tegeződés' | 'magázódás')
              }
            >
              <option value="tegeződés">
                {t('offers.wizard.forms.details.formalityOptions.tegeződés')}
              </option>
              <option value="magázódás">
                {t('offers.wizard.forms.details.formalityOptions.magázódás')}
              </option>
            </Select>
          </div>
        </section>
      )}
    </Card>
  );
}
