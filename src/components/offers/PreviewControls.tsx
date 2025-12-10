'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { TemplateId } from '@/lib/offers/templates/types';
import { t } from '@/copy';

type PreviewControlsProps = {
  templateOptions: Array<{ id: string; name: string; tier: 'free' | 'premium' }>;
  selectedTemplateId: TemplateId;
  defaultTemplateId: TemplateId;
  brandingPrimary: string;
  brandingSecondary: string;
  brandingLogoUrl: string;
  onTemplateChange: (templateId: TemplateId) => void;
  onBrandingPrimaryChange: (color: string) => void;
  onBrandingSecondaryChange: (color: string) => void;
  onBrandingLogoChange: (url: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  showMarginGuides?: boolean;
  onToggleMarginGuides?: (enabled: boolean) => void;
  onFullscreen?: () => void;
};

export function PreviewControls({
  templateOptions,
  selectedTemplateId,
  defaultTemplateId,
  brandingPrimary,
  brandingSecondary,
  brandingLogoUrl: _brandingLogoUrl,
  onTemplateChange,
  onBrandingPrimaryChange,
  onBrandingSecondaryChange,
  onBrandingLogoChange: _onBrandingLogoChange,
  zoom = 100,
  onZoomChange,
  showMarginGuides = false,
  onToggleMarginGuides,
  onFullscreen,
}: PreviewControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-fg">
          {t('offers.wizard.previewTemplates.heading')}
        </label>
        {onFullscreen && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onFullscreen}
            className="text-xs"
          >
            {t('wizard.preview.fullscreenButton')}
          </Button>
        )}
      </div>

      <Select
        value={selectedTemplateId ?? defaultTemplateId}
        onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
        className="w-full"
      >
        {templateOptions.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </Select>

      {/* Zoom controls */}
      {onZoomChange && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-fg">{t('wizard.preview.zoom')}</label>
          <div className="flex flex-1 items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onZoomChange(Math.max(50, zoom - 25))}
              disabled={zoom <= 50}
              className="px-2 text-xs"
            >
              −
            </Button>
            <span className="min-w-[3rem] text-center text-xs font-medium text-fg-muted">
              {zoom}%
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onZoomChange(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
              className="px-2 text-xs"
            >
              +
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onZoomChange(100)}
              className="ml-auto px-2 text-xs"
            >
              {t('wizard.preview.zoomReset')}
            </Button>
          </div>
        </div>
      )}

      {/* Margin guides toggle */}
      {onToggleMarginGuides && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showMarginGuides}
            onChange={(e) => onToggleMarginGuides(e.target.checked)}
            className="rounded border-border text-primary focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-fg-muted">{t('wizard.preview.marginGuides')}</span>
        </label>
      )}

      {/* Advanced controls toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-left text-xs font-medium text-fg-muted hover:text-fg"
      >
        {showAdvanced ? '▼' : '▶'} {t('wizard.preview.advancedSettings')}
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-lg border border-border/60 bg-bg-muted/50 p-4">
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-fg">
              {t('wizard.preview.primaryColor')}
            </label>
            <input
              type="color"
              value={brandingPrimary}
              onChange={(e) => onBrandingPrimaryChange(e.target.value)}
              className="h-8 w-full rounded border border-border"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-semibold text-fg">
              {t('wizard.preview.secondaryColor')}
            </label>
            <input
              type="color"
              value={brandingSecondary}
              onChange={(e) => onBrandingSecondaryChange(e.target.value)}
              className="h-8 w-full rounded border border-border"
            />
          </div>
        </div>
      )}
    </div>
  );
}
