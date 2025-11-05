'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { t } from '@/copy';
import type { OfferTemplate, TemplateId } from '@/app/pdf/templates/types';

type PreviewControlsProps = {
  templateOptions: Array<OfferTemplate & { legacyId?: string }>;
  selectedTemplateId: TemplateId;
  defaultTemplateId: TemplateId;
  brandingPrimary: string;
  brandingSecondary: string;
  brandingLogoUrl: string;
  onTemplateChange: (templateId: TemplateId) => void;
  onBrandingPrimaryChange: (color: string) => void;
  onBrandingSecondaryChange: (color: string) => void;
  onBrandingLogoChange: (url: string) => void;
};

/**
 * Controls for preview customization (template, branding colors, logo).
 * Allows users to customize the appearance of the generated offer preview.
 * 
 * @param templateOptions - Available template options
 * @param selectedTemplateId - Currently selected template
 * @param defaultTemplateId - Default template fallback
 * @param brandingPrimary - Primary brand color (hex)
 * @param brandingSecondary - Secondary brand color (hex)
 * @param brandingLogoUrl - Logo image URL
 * @param onTemplateChange - Callback when template changes
 * @param onBrandingPrimaryChange - Callback when primary color changes
 * @param onBrandingSecondaryChange - Callback when secondary color changes
 * @param onBrandingLogoChange - Callback when logo URL changes
 */
export function PreviewControls({
  templateOptions,
  selectedTemplateId,
  defaultTemplateId,
  brandingPrimary,
  brandingSecondary,
  brandingLogoUrl,
  onTemplateChange,
  onBrandingPrimaryChange,
  onBrandingSecondaryChange,
  onBrandingLogoChange,
}: PreviewControlsProps) {
  const resolvedTemplateForControls = useMemo(
    () =>
      templateOptions.some((template) => template.id === selectedTemplateId)
        ? selectedTemplateId
        : defaultTemplateId,
    [templateOptions, selectedTemplateId, defaultTemplateId],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700">
          {t('offers.previewCard.controls.title')}
        </p>
        <p className="text-xs text-slate-500">{t('offers.previewCard.controls.helper')}</p>
      </div>
      {templateOptions.length > 0 ? (
        <Select
          label={t('offers.previewCard.controls.templateLabel')}
          value={resolvedTemplateForControls}
          onChange={(event) => onTemplateChange(event.target.value as TemplateId)}
        >
          {templateOptions.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          {t('offers.previewCard.controls.brandingTitle')}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('offers.previewCard.controls.primaryLabel')}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingPrimary}
                onChange={(event) => onBrandingPrimaryChange(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-white"
                aria-label={t('offers.previewCard.controls.primaryLabel')}
              />
              <Input
                value={brandingPrimary}
                onChange={(event) => onBrandingPrimaryChange(event.target.value)}
                className="py-2 text-sm font-mono"
                wrapperClassName="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('offers.previewCard.controls.secondaryLabel')}
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingSecondary}
                onChange={(event) => onBrandingSecondaryChange(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-md border border-border bg-white"
                aria-label={t('offers.previewCard.controls.secondaryLabel')}
              />
              <Input
                value={brandingSecondary}
                onChange={(event) => onBrandingSecondaryChange(event.target.value)}
                className="py-2 text-sm font-mono"
                wrapperClassName="flex-1"
              />
            </div>
          </div>
        </div>
        <Input
          label={t('offers.previewCard.controls.logoLabel')}
          placeholder={t('offers.previewCard.controls.logoPlaceholder')}
          value={brandingLogoUrl}
          onChange={(event) => onBrandingLogoChange(event.target.value)}
          type="url"
        />
      </div>
    </div>
  );
}

