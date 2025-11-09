'use client';

import { t } from '@/copy';
import { Card, CardHeader } from '@/components/ui/Card';
import { LockClosedIcon } from '@heroicons/react/24/outline';

type SettingsProFeaturesSectionProps = {
  plan: 'free' | 'standard' | 'pro';
};

export function SettingsProFeaturesSection({
  plan,
}: SettingsProFeaturesSectionProps) {
  // This section is now empty as reference images and testimonials have been moved
  // Keeping the card structure for potential future pro features
  return (
    <Card
      id="pro-features"
      as="section"
      className="scroll-mt-24"
      header={
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LockClosedIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('settings.proFeatures.title')}</h2>
              <p className="text-sm text-slate-500">{t('settings.proFeatures.subtitle')}</p>
            </div>
          </div>
        </CardHeader>
      }
    >
      <div className="rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-12 text-center">
        <p className="text-sm text-slate-600">
          További Pro funkciók hamarosan...
        </p>
      </div>
    </Card>
  );
}



