'use client';

import { useMemo } from 'react';
import { t } from '@/copy';
import { listTemplateMetadata } from '@/app/pdf/templates/engineRegistry';
import type { TemplateMetadata } from '@/app/pdf/templates/engineRegistry';
import type { TemplateId, TemplateTier } from '@/app/pdf/templates/types';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';

export interface TemplateSelectorProps {
  selectedTemplateId: TemplateId | null;
  plan: SubscriptionPlan;
  onTemplateSelect: (templateId: TemplateId) => void;
  className?: string;
  showDescription?: boolean;
  gridCols?: 1 | 2 | 3 | 4;
}

function planToTemplateTier(plan: SubscriptionPlan): TemplateTier {
  return plan === 'pro' ? 'premium' : 'free';
}

export function TemplateSelector({
  selectedTemplateId,
  plan,
  onTemplateSelect,
  className = '',
  showDescription = true,
  gridCols = 3,
}: TemplateSelectorProps) {
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const userTemplateTier = planToTemplateTier(plan);
  const canUseProTemplates = plan === 'pro';

  const availableTemplates = useMemo(() => {
    const allTemplates = listTemplateMetadata();
    return allTemplates.sort((a, b) => {
      // Premium templates last
      if (a.tier === 'premium' && b.tier !== 'premium') return 1;
      if (a.tier !== 'premium' && b.tier === 'premium') return -1;
      // Sort by label
      return a.label.localeCompare(b.label, 'hu');
    });
  }, []);

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[gridCols];

  const handleSelect = (template: TemplateMetadata) => {
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

          return (
            <button
              key={template.id}
              type="button"
              disabled={requiresUpgrade}
              onClick={() => handleSelect(template)}
              aria-pressed={isSelected}
              aria-label={`Válassza ki a ${template.label} sablont`}
              className={`group relative flex h-full flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30'
                  : 'border-border bg-white hover:border-primary/50 hover:shadow-md'
              } ${requiresUpgrade ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {/* Preview Image */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm">
                {template.preview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.preview}
                      alt={`${template.label} előnézet`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('flex', 'items-center', 'justify-center');
                          parent.innerHTML = `<span class="text-xs font-medium text-slate-400">${template.label}</span>`;
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-12 w-12 rounded-lg border-2 border-dashed border-slate-300 bg-white" />
                      <span className="text-xs font-medium text-slate-400">{template.label}</span>
                    </div>
                  </div>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-2 ring-white">
                      <CheckCircleIcon className="h-6 w-6" />
                    </div>
                  </div>
                )}

                {/* Pro Badge */}
                {requiresPro && (
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      PRO
                    </span>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-slate-900">{template.label}</h3>
                </div>
                {showDescription && (template.description || template.marketingHighlight) && (
                  <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {template.description || template.marketingHighlight}
                  </p>
                )}

                {requiresUpgrade && (
                  <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-amber-600">
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

