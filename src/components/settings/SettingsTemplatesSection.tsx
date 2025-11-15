'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import { DocumentTextIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { listTemplateMetadata } from '@/app/pdf/templates/engineRegistry';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { TemplateId } from '@/app/pdf/templates/types';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';

type SettingsTemplatesSectionProps = {
  selectedTemplateId: TemplateId;
  plan: SubscriptionPlan;
  onTemplateSelect: (templateId: TemplateId) => Promise<void>;
};

export function SettingsTemplatesSection({
  selectedTemplateId,
  plan,
}: SettingsTemplatesSectionProps) {
  const router = useRouter();

  const templateStats = useMemo(() => {
    const allTemplates = listTemplateMetadata();
    const availableCount = allTemplates.length;
    const defaultTemplate = allTemplates.find((t) => t.id === selectedTemplateId);

    return {
      available: availableCount,
      default: defaultTemplate,
    };
  }, [selectedTemplateId]);

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

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6">
          <div className="mb-1 text-3xl font-bold text-slate-900">{templateStats.available}</div>
          <div className="text-sm text-slate-600">Elérhető sablon</div>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6">
          <div className="mb-1 text-3xl font-bold text-slate-900">1</div>
          <div className="text-sm text-slate-600">Alapértelmezett</div>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white p-6">
          <div className="mb-1 text-3xl font-bold text-slate-900">
            {plan === 'pro' ? 'Pro' : 'Free'}
          </div>
          <div className="text-sm text-slate-600">Csomag szint</div>
        </div>
      </div>

      {/* Default template */}
      {templateStats.default && (
        <div className="mb-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
            <StarIcon className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span>Alapértelmezett sablon</span>
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-primary/30 bg-white">
                <DocumentTextIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="mb-1 font-bold text-slate-900">{templateStats.default.label}</div>
                <div className="text-sm text-slate-600">
                  {templateStats.default.description || 'Professzionális elrendezés'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push('/new')}
              >
                Előnézet
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => router.push('/new')}>
                Szerkesztés
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CTA to template library */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 p-8 text-center text-white">
        <DocumentTextIcon className="mx-auto mb-4 h-16 w-16 opacity-90" />
        <h3 className="mb-3 text-2xl font-bold">Fedezd fel a sablonkönyvtárat</h3>
        <p className="mb-6 mx-auto max-w-2xl text-purple-100">
          Böngészd át az összes elérhető sablont, hozz létre sajátokat, vagy szabd testre a
          meglévőket
        </p>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.push('/new')}
          className="bg-white text-purple-600 hover:bg-purple-50"
        >
          Sablonkönyvtár megnyitása
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
