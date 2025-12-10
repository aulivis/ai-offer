'use client';

import { t } from '@/copy';
import { Card, CardHeader } from '@/components/ui/Card';
import { LockClosedIcon } from '@heroicons/react/24/outline';

type SettingsProFeaturesSectionProps = {
  plan: 'free' | 'standard' | 'pro';
};

export function SettingsProFeaturesSection({ plan: _plan }: SettingsProFeaturesSectionProps) {
  // This section is now empty as reference images and testimonials have been moved
  // Keeping the card structure for potential future pro features
  return (
    <Card
      id="pro-features"
      as="section"
      className="scroll-mt-24"
      header={
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
              <LockClosedIcon className="relative z-10 h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-fg mb-1">
                {t('settings.proFeatures.title')}
              </h2>
              <p className="text-sm md:text-base text-fg-muted">
                {t('settings.proFeatures.subtitle')}
              </p>
            </div>
          </div>
        </CardHeader>
      }
    >
      <div className="rounded-xl border-2 border-dashed border-border bg-bg p-12 text-center">
        <p className="text-sm text-fg-muted">További Pro funkciók hamarosan...</p>
      </div>
    </Card>
  );
}
