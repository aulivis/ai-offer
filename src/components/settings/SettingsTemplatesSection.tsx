'use client';

import { t } from '@/copy';
import { Card, CardHeader } from '@/components/ui/Card';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { TemplateSelector } from '@/components/templates/TemplateSelector';
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
  onTemplateSelect,
}: SettingsTemplatesSectionProps) {
  return (
    <Card
      id="templates"
      as="section"
      className="scroll-mt-24"
      header={
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <DocumentTextIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('settings.templates.title')}</h2>
              <p className="text-sm text-slate-500">{t('settings.templates.subtitle')}</p>
            </div>
          </div>
        </CardHeader>
      }
    >
      <div className="space-y-6">
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          plan={plan}
          onTemplateSelect={onTemplateSelect}
          gridCols={3}
          showDescription={true}
        />
      </div>
    </Card>
  );
}
