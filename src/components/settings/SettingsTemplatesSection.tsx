'use client';

import { t } from '@/copy';
import { DocumentTextIcon, StarIcon } from '@heroicons/react/24/outline';
import { listTemplateMetadata } from '@/app/pdf/templates/engineRegistry';
import { useMemo } from 'react';
import type { TemplateId } from '@/app/pdf/templates/types';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';

type SettingsTemplatesSectionProps = {
  selectedTemplateId: TemplateId;
  plan: SubscriptionPlan;
  onTemplateSelect: (templateId: TemplateId) => Promise<void>;
};

export function SettingsTemplatesSection({
  selectedTemplateId,
  _plan,
  onTemplateSelect,
}: SettingsTemplatesSectionProps) {
  const allTemplates = useMemo(() => listTemplateMetadata(), []);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <DocumentTextIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {t('settings.templates.title')}
            </h2>
            <p className="text-sm md:text-base text-slate-600">
              Kezeld a sablonokat és állítsd be az alapértelmezetteket
            </p>
          </div>
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-3">
        {allTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateSelect(template.id)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-primary/20 border-2 border-primary/30'
                        : 'bg-slate-100 border-2 border-slate-200'
                    }`}
                  >
                    <DocumentTextIcon
                      className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-slate-600'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                        {template.label}
                      </h3>
                      {isSelected && (
                        <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {template.description || 'Professzionális elrendezés'}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                      Aktív
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
