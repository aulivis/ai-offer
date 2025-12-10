'use client';

import { useMemo } from 'react';
import { t } from '@/copy';
import { validatePhoneHU, validateTaxHU, validateAddress } from '@/components/settings/types';
import { normalizeBrandHex } from '@/lib/branding';
import type { Profile } from '@/components/settings/types';

export type ValidationErrors = {
  general: Record<string, string>;
  branding: Record<string, string>;
};

export function useSettingsValidation(profile: Profile) {
  const errors = useMemo<ValidationErrors>(() => {
    const general: Record<string, string> = {};
    const branding: Record<string, string> = {};

    if (profile.company_phone && !validatePhoneHU(profile.company_phone)) {
      general.phone = t('settings.validation.phone');
    }
    if (profile.company_tax_id && !validateTaxHU(profile.company_tax_id)) {
      general.tax = t('settings.validation.tax');
    }
    if (profile.company_address && !validateAddress(profile.company_address)) {
      general.address = t('settings.validation.address');
    }

    const brandPrimary =
      typeof profile.brand_color_primary === 'string' ? profile.brand_color_primary.trim() : '';
    if (brandPrimary && !normalizeBrandHex(brandPrimary)) {
      branding.brandPrimary = t('settings.validation.hexColor');
    }

    const brandSecondary =
      typeof profile.brand_color_secondary === 'string' ? profile.brand_color_secondary.trim() : '';
    if (brandSecondary && !normalizeBrandHex(brandSecondary)) {
      branding.brandSecondary = t('settings.validation.hexColor');
    }

    return { general, branding };
  }, [profile]);

  const hasGeneralErrors = Object.keys(errors.general).length > 0;
  const hasBrandingErrors = Object.keys(errors.branding).length > 0;
  const hasErrors = hasGeneralErrors || hasBrandingErrors;

  return {
    errors,
    hasGeneralErrors,
    hasBrandingErrors,
    hasErrors,
  };
}

