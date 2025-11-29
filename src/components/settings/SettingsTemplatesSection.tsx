'use client';

import { t } from '@/copy';
import {
  DocumentTextIcon,
  StarIcon,
  LockClosedIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { listTemplates } from '@/lib/offers/templates/index';
import { useMemo, useState } from 'react';
import type { TemplateId } from '@/lib/offers/templates/types';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import Image from 'next/image';

type SettingsTemplatesSectionProps = {
  selectedTemplateId: TemplateId;
  plan: SubscriptionPlan;
  onTemplateSelect: (templateId: TemplateId) => Promise<void>;
};

export function SettingsTemplatesSection({
  selectedTemplateId,
  plan: _plan,
  onTemplateSelect,
}: SettingsTemplatesSectionProps) {
  const allTemplates = useMemo(() => listTemplates(), []);
  const [expandedPreview, setExpandedPreview] = useState<TemplateId | null>(null);

  return (
    <div className="space-y-8 w-full">
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
      <div className="space-y-3 w-full">
        {allTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const isPremium = template.tier === 'premium';
          const isPreviewExpanded = expandedPreview === template.id;

          return (
            <div
              key={template.id}
              className={`w-full rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => onTemplateSelect(template.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Preview thumbnail */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg overflow-hidden border-2 ${
                          isSelected
                            ? 'bg-primary/20 border-primary/30'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        {template.preview ? (
                          <Image
                            src={template.preview}
                            alt={template.label}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <DocumentTextIcon
                            className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-slate-600'}`}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}
                        >
                          {template.label}
                        </h3>
                        {isSelected && (
                          <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                        )}
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                            <LockClosedIcon className="h-3 w-3" />
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 border border-green-200">
                            Ingyenes
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-1">
                        {template.description || 'Professzionális elrendezés'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {template.preview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPreview(isPreviewExpanded ? null : template.id);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label={isPreviewExpanded ? 'Elrejtés' : 'Nagyítás'}
                      >
                        <PhotoIcon className="h-5 w-5 text-slate-600" />
                      </button>
                    )}
                    {isSelected && (
                      <div className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                        Aktív
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded preview */}
              {isPreviewExpanded && template.preview && (
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExpandedPreview(null)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                      aria-label="Bezárás"
                    >
                      <XMarkIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <Image
                      src={template.preview}
                      alt={`${template.label} előnézet`}
                      width={800}
                      height={600}
                      className="w-full rounded-lg shadow-lg border border-slate-200"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
