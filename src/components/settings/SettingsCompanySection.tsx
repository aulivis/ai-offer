'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Profile } from './types';

type SettingsCompanySectionProps = {
  profile: Profile;
  errors: {
    phone?: string;
    tax?: string;
    address?: string;
  };
  onProfileChange: (updater: (prev: Profile) => Profile) => void;
  onSave: () => void;
  saving: boolean;
};

export function SettingsCompanySection({
  profile,
  errors,
  onProfileChange,
  onSave,
  saving,
}: SettingsCompanySectionProps) {
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6 w-full">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <BuildingOfficeIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-fg mb-1">
              {t('settings.company.title')}
            </h2>
            <p className="text-sm md:text-base text-fg-muted">{t('settings.company.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-8 w-full">
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
