'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import type { Profile } from './types';
import { ALL_INDUSTRIES_HU } from './types';

type SettingsCompanySectionProps = {
  profile: Profile;
  errors: {
    phone?: string;
    tax?: string;
    address?: string;
  };
  newIndustry: string;
  onProfileChange: (updater: (prev: Profile) => Profile) => void;
  onNewIndustryChange: (value: string) => void;
  onToggleIndustry: (industry: string) => void;
  onAddManualIndustry: (industry: string) => void;
  onSave: () => void;
  saving: boolean;
};

export function SettingsCompanySection({
  profile,
  errors,
  newIndustry,
  onProfileChange,
  onNewIndustryChange,
  onToggleIndustry,
  onAddManualIndustry,
  onSave,
  saving,
}: SettingsCompanySectionProps) {
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <BuildingOfficeIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {t('settings.company.title')}
            </h2>
            <p className="text-sm md:text-base text-slate-600">{t('settings.company.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label={t('settings.company.fields.name')}
            value={profile.company_name || ''}
            onChange={(e) => onProfileChange((p) => ({ ...p, company_name: e.target.value }))}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/50"
          />
          <Input
            label={t('settings.company.fields.taxId')}
            placeholder={t('settings.company.placeholders.taxId')}
            value={profile.company_tax_id || ''}
            onChange={(e) => onProfileChange((p) => ({ ...p, company_tax_id: e.target.value }))}
            error={errors.tax}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/50"
          />
          <div className="md:col-span-2">
            <Input
              label={t('settings.company.fields.address')}
              placeholder={t('settings.company.placeholders.address')}
              value={profile.company_address || ''}
              onChange={(e) => onProfileChange((p) => ({ ...p, company_address: e.target.value }))}
              error={errors.address}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/50"
            />
          </div>
          <Input
            label={t('settings.company.fields.phone')}
            placeholder={t('settings.company.placeholders.phone')}
            value={profile.company_phone || ''}
            onChange={(e) => onProfileChange((p) => ({ ...p, company_phone: e.target.value }))}
            error={errors.phone}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/50"
          />
          <Input
            label={t('settings.company.fields.email')}
            type="email"
            value={profile.company_email || ''}
            onChange={(e) => onProfileChange((p) => ({ ...p, company_email: e.target.value }))}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:border-primary/50"
          />
        </div>

        <div className="space-y-4 rounded-xl border border-border/60 bg-slate-50/50 p-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900">
              {t('settings.company.industries.heading')}
            </label>
            <p className="mt-1 text-xs text-slate-500">{t('settings.company.industries.helper')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_INDUSTRIES_HU.map((ind) => {
              const active = profile.industries?.includes(ind);
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => onToggleIndustry(ind)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-border bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-50'
                  }`}
                >
                  {active && <CheckCircleIcon className="h-3.5 w-3.5" />}
                  {ind}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label={t('settings.company.industries.addLabel')}
                placeholder={t('settings.company.industries.addPlaceholder')}
                value={newIndustry}
                onChange={(e) => onNewIndustryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddManualIndustry(newIndustry);
                  }
                }}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => onAddManualIndustry(newIndustry)}
              className="sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              {t('settings.company.industries.addButton')}
            </Button>
          </div>

          {(profile.industries || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(profile.industries || []).map((ind) => (
                <span
                  key={ind}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                >
                  {ind}
                  <button
                    type="button"
                    onClick={() => onToggleIndustry(ind)}
                    className="rounded-full hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t('settings.company.industries.removeAriaLabel', { industry: ind })}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border pt-6">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || hasErrors}
            loading={saving}
            size="lg"
          >
            {saving ? t('settings.company.saving') : t('settings.company.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
