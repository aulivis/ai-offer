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
      <div>
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <DocumentTextIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-fg mb-2">
              {t('settings.templates.title')}
            </h2>
            <p className="text-sm md:text-base text-fg-muted">
              Kezeld a sablonokat és állítsd be az alapértelmezetteket
            </p>
          </div>
        </div>
      </div>

      {/* Template list */}
      <div className="space-y-4 w-full">
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
                  : 'border-border bg-bg-muted hover:border-border hover:shadow-sm'
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
                            : 'bg-bg-muted border-border'
                        }`}
                      >
                        {template.preview ? (
                          <Image
                            src={template.preview}
                            alt={template.label || template.name}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <DocumentTextIcon
                            className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-fg-muted'}`}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className={`font-bold ${isSelected ? 'text-primary' : 'text-fg'}`}>
                          {template.label || template.name}
                        </h3>
                        {isSelected && (
                          <StarIcon className="h-4 w-4 fill-warning text-warning flex-shrink-0" />
                        )}
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning border border-warning/20">
                            <LockClosedIcon className="h-3 w-3" />
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success border border-success/20">
                            Ingyenes
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-fg-muted line-clamp-1">
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
                        className="p-2 rounded-lg hover:bg-bg-muted transition-colors"
                        aria-label={isPreviewExpanded ? 'Elrejtés' : 'Nagyítás'}
                      >
                        <PhotoIcon className="h-5 w-5 text-fg-muted" />
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
                <div className="border-t border-border p-4 bg-bg-muted">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExpandedPreview(null)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                      aria-label="Bezárás"
                    >
                      <XMarkIcon className="h-5 w-5 text-fg-muted" />
                    </button>
                    <Image
                      src={template.preview}
                      alt={`${template.label || template.name} előnézet`}
                      width={800}
                      height={600}
                      className="w-full rounded-lg shadow-lg border border-border"
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
