'use client';

import { useMemo, useState, useCallback } from 'react';
import { t } from '@/copy';
import { listTemplates } from '@/lib/offers/templates/index';
import type { TemplateId, Template } from '@/lib/offers/templates/types';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { renderOfferHtml } from '@/lib/offers/renderer';
import { createTranslator } from '@/copy';

export interface TemplateSelectorProps {
  selectedTemplateId: TemplateId | null;
  plan: SubscriptionPlan;
  onTemplateSelect: (templateId: TemplateId) => void;
  className?: string;
  showDescription?: boolean;
  gridCols?: 1 | 2 | 3 | 4;
  showPreviews?: boolean;
}

// Sample data for template previews
const SAMPLE_OFFER_DATA = {
  title: 'Minta Ajánlat',
  companyName: 'Példa Kft.',
  bodyHtml:
    '<p>Ez egy példa ajánlat, amely bemutatja a sablon megjelenését.</p><p>A sablonok különböző stílusokat és elrendezéseket kínálnak az ajánlatokhoz.</p>',
  locale: 'hu',
  issueDate: new Date().toLocaleDateString('hu-HU'),
  contactName: 'Kovács János',
  contactEmail: 'kovacs@example.com',
  contactPhone: '+36 1 234 5678',
  companyWebsite: 'https://example.com',
  companyAddress: '1234 Budapest, Példa utca 1.',
  companyTaxId: '12345678-1-23',
  schedule: ['Projekt megkezdése', 'Középső mérföldkő', 'Projekt befejezése'],
  guarantees: ['2 év garancia', '24/7 támogatás'],
  pricingRows: [
    { name: 'Alapcsomag', qty: 1, unit: 'db', unitPrice: 100000, vat: 27 },
    { name: 'Kiegészítő szolgáltatás', qty: 2, unit: 'óra', unitPrice: 15000, vat: 27 },
  ],
  images: [],
  branding: {
    primaryColor: '#1c274c',
    secondaryColor: '#e2e8f0',
    logoUrl: null,
  },
};

export function TemplateSelector({
  selectedTemplateId,
  plan,
  onTemplateSelect,
  className = '',
  gridCols = 3,
  showPreviews = true,
}: TemplateSelectorProps) {
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const canUseProTemplates = plan === 'pro';
  const [previewCache, setPreviewCache] = useState<Record<TemplateId, string>>(
    {} as Record<TemplateId, string>,
  );
  const translator = useMemo(() => createTranslator('hu'), []);

  const availableTemplates = useMemo(() => {
    const allTemplates = listTemplates();
    return allTemplates.sort((a, b) => {
      // Premium templates last
      if (a.tier === 'premium' && b.tier !== 'premium') return 1;
      if (a.tier !== 'premium' && b.tier === 'premium') return -1;
      // Sort by name
      return a.name.localeCompare(b.name, 'hu');
    });
  }, []);

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[gridCols];

  const generatePreview = useCallback(
    (templateId: TemplateId): string => {
      if (previewCache[templateId]) {
        return previewCache[templateId];
      }

      try {
        const html = renderOfferHtml(
          {
            ...SAMPLE_OFFER_DATA,
            templateId,
          },
          translator,
        );
        setPreviewCache((prev) => ({ ...prev, [templateId]: html }));
        return html;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to generate preview for template', templateId, error);
        return '<div style="padding: 2rem; text-align: center; color: #666;">Előnézet betöltése...</div>';
      }
    },
    [previewCache, translator],
  );

  const handleSelect = (template: Template) => {
    const requiresPro = template.tier === 'premium';
    const requiresUpgrade = requiresPro && !canUseProTemplates;

    if (requiresUpgrade) {
      openPlanUpgradeDialog({
        description: t('app.planUpgradeModal.reasons.proTemplates'),
      });
      return;
    }

    if (selectedTemplateId !== template.id) {
      onTemplateSelect(template.id);
    }
  };

  return (
    <div className={className}>
      <div className={`grid gap-4 ${gridColsClass}`}>
        {availableTemplates.map((template) => {
          const requiresPro = template.tier === 'premium';
          const requiresUpgrade = requiresPro && !canUseProTemplates;
          const isSelected = selectedTemplateId === template.id;
          const previewHtml = showPreviews ? generatePreview(template.id) : null;

          return (
            <button
              key={template.id}
              type="button"
              disabled={requiresUpgrade}
              onClick={() => handleSelect(template)}
              aria-pressed={isSelected}
              aria-label={`Válassza ki a ${template.name} sablont`}
              className={`group relative flex h-full flex-col gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30'
                  : 'border-border bg-white hover:border-primary/50 hover:shadow-md'
              } ${requiresUpgrade ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {/* Preview */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm">
                {showPreviews && previewHtml ? (
                  <div className="relative h-full w-full overflow-hidden">
                    <iframe
                      srcDoc={previewHtml}
                      className="absolute inset-0 border-0"
                      style={{
                        transform: 'scale(0.3)',
                        transformOrigin: 'top left',
                        width: '333.33%',
                        height: '333.33%',
                        pointerEvents: 'none',
                      }}
                      sandbox="allow-same-origin"
                      title={`${template.name} előnézet`}
                      aria-label={`${template.name} sablon előnézete`}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-12 w-12 rounded-lg border-2 border-dashed border-slate-300 bg-white" />
                      <span className="text-xs font-medium text-slate-400">{template.name}</span>
                    </div>
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px] pointer-events-none">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-2 ring-white">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Pro Badge */}
                {requiresPro && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      PRO
                    </span>
                  </div>
                )}

                {/* Lock Overlay */}
                {requiresUpgrade && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                    <LockClosedIcon className="h-8 w-8 text-amber-600" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{template.name}</h3>
                </div>

                {requiresUpgrade && (
                  <div className="flex items-center gap-2 pt-2 text-xs font-medium text-amber-600">
                    <LockClosedIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{t('settings.templates.proOnly')}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Upgrade Hint */}
      {!canUseProTemplates && availableTemplates.some((t) => t.tier === 'premium') && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm text-amber-800">{t('settings.templates.upgradeHint')}</p>
        </div>
      )}
    </div>
  );
}
