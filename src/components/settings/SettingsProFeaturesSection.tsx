'use client';

import { t } from '@/copy';
import { Card, CardHeader } from '@/components/ui/Card';
import { PhotoIcon, ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { Profile } from './types';

type SettingsProFeaturesSectionProps = {
  profile: Profile;
  plan: 'free' | 'standard' | 'pro';
  onProfileChange: (updater: (prev: Profile) => Profile) => void;
  onSave: () => void;
  onOpenPlanUpgradeDialog: (options: { description: string }) => void;
  saving: boolean;
};

export function SettingsProFeaturesSection({
  profile,
  plan,
  onProfileChange,
  onSave,
  onOpenPlanUpgradeDialog,
  saving,
}: SettingsProFeaturesSectionProps) {
  const isPro = plan === 'pro';
  const enableReferencePhotos = profile.enable_reference_photos ?? false;
  const enableTestimonials = profile.enable_testimonials ?? false;

  const handleToggleReferencePhotos = () => {
    if (!isPro) {
      onOpenPlanUpgradeDialog({
        description: t('settings.proFeatures.referencePhotos.upgradeDescription'),
      });
      return;
    }
    onProfileChange((p) => ({ ...p, enable_reference_photos: !enableReferencePhotos }));
    onSave();
  };

  const handleToggleTestimonials = () => {
    if (!isPro) {
      onOpenPlanUpgradeDialog({
        description: t('settings.proFeatures.testimonials.upgradeDescription'),
      });
      return;
    }
    onProfileChange((p) => ({ ...p, enable_testimonials: !enableTestimonials }));
    onSave();
  };

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
      <div className="space-y-6">
        {/* Reference Photos Card */}
        <div
          className={`rounded-xl border-2 p-6 transition-all ${
            enableReferencePhotos && isPro
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-slate-50/50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <PhotoIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('settings.proFeatures.referencePhotos.title')}
                  </h3>
                  {!isPro && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {t('settings.proFeatures.referencePhotos.description')}
                </p>
                {enableReferencePhotos && isPro && (
                  <p className="text-xs font-medium text-primary">
                    {t('settings.proFeatures.referencePhotos.enabled')}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleReferencePhotos}
              disabled={!isPro || saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                enableReferencePhotos && isPro ? 'bg-primary' : 'bg-slate-300'
              } ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enableReferencePhotos && isPro ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Testimonials Card */}
        <div
          className={`rounded-xl border-2 p-6 transition-all ${
            enableTestimonials && isPro
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-slate-50/50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('settings.proFeatures.testimonials.title')}
                  </h3>
                  {!isPro && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {t('settings.proFeatures.testimonials.description')}
                </p>
                {enableTestimonials && isPro && (
                  <p className="text-xs font-medium text-primary">
                    {t('settings.proFeatures.testimonials.enabled')}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleTestimonials}
              disabled={!isPro || saving}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                enableTestimonials && isPro ? 'bg-primary' : 'bg-slate-300'
              } ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enableTestimonials && isPro ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

