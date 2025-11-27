'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import {
  PaintBrushIcon,
  PhotoIcon,
  EyeIcon,
  LockClosedIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { normalizeBrandHex } from '@/lib/branding';
import { useSupabase } from '@/components/SupabaseProvider';
import { getBrandLogoUrl } from '@/lib/branding';
import { LogoPreview } from './LogoPreview';
import { ColorPicker } from './ColorPicker';
import type { Profile } from './types';
import { clientLogger } from '@/lib/clientLogger';

type SettingsBrandingSectionProps = {
  profile: Profile;
  plan: string;
  errors: {
    brandPrimary?: string;
    brandSecondary?: string;
  };
  logoUploading: boolean;
  logoUploadProgress: number | null;
  onProfileChange: (updater: (prev: Profile) => Profile) => void;
  onTriggerLogoUpload: () => void;
  onCancelLogoUpload: () => void;
  onSave: () => void;
  onOpenPlanUpgradeDialog: (options: { description: string }) => void;
  saving: boolean;
};

export function SettingsBrandingSection({
  profile,
  plan,
  errors,
  logoUploading,
  logoUploadProgress,
  onProfileChange,
  onTriggerLogoUpload,
  onCancelLogoUpload,
  onSave,
  onOpenPlanUpgradeDialog,
  saving,
}: SettingsBrandingSectionProps) {
  const supabase = useSupabase();
  const primaryPreview = normalizeBrandHex(profile.brand_color_primary) ?? '#1c274c';
  const secondaryPreview = normalizeBrandHex(profile.brand_color_secondary) ?? '#e2e8f0';
  const canUploadBrandLogo = plan !== 'free';
  const hasBrandingErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-8 w-full">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <PaintBrushIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {t('settings.branding.title')}
            </h2>
            <p className="text-sm md:text-base text-slate-600">{t('settings.branding.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-8 w-full">
        <div className="grid gap-6 md:grid-cols-2">
          <ColorPicker
            label={t('settings.branding.primaryLabel')}
            value={profile.brand_color_primary || ''}
            onChange={(value) => onProfileChange((p) => ({ ...p, brand_color_primary: value }))}
            {...(errors.brandPrimary ? { error: errors.brandPrimary } : {})}
            previewColor={primaryPreview}
          />
          <ColorPicker
            label={t('settings.branding.secondaryLabel')}
            value={profile.brand_color_secondary || ''}
            onChange={(value) => onProfileChange((p) => ({ ...p, brand_color_secondary: value }))}
            {...(errors.brandSecondary ? { error: errors.brandSecondary } : {})}
            previewColor={secondaryPreview}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border-2 border-dashed border-border bg-gradient-to-br from-slate-50 to-white p-6">
            <div className="flex items-start gap-4">
              <LogoPreview logoPath={profile.brand_logo_path} />
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('settings.branding.logoUpload.title')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('settings.branding.logoUpload.helper')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!canUploadBrandLogo) {
                        onOpenPlanUpgradeDialog({
                          description: t('app.planUpgradeModal.reasons.brandingLogo'),
                        });
                        return;
                      }
                      onTriggerLogoUpload();
                    }}
                    disabled={logoUploading || !canUploadBrandLogo}
                    variant={canUploadBrandLogo ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {logoUploading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {t('settings.branding.logoUpload.uploading')}
                      </>
                    ) : canUploadBrandLogo ? (
                      <>
                        <PhotoIcon className="h-4 w-4" />
                        {t('settings.branding.logoUpload.button')}
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        {t('settings.branding.logoUpload.lockedButton')}
                      </>
                    )}
                  </Button>
                  {logoUploading && (
                    <Button type="button" onClick={onCancelLogoUpload} variant="ghost" size="sm">
                      <XMarkIcon className="h-4 w-4" />
                      {t('settings.branding.logoUpload.cancel')}
                    </Button>
                  )}
                  {profile.brand_logo_path && (
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!profile.brand_logo_path) return;
                        try {
                          const url = await getBrandLogoUrl(
                            supabase,
                            profile.brand_logo_path,
                            null,
                          );
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (error) {
                          clientLogger.error('Failed to open logo', error, {
                            logoPath: profile.brand_logo_path,
                          });
                        }
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      {t('settings.branding.logoUpload.openInNewTab')}
                    </Button>
                  )}
                </div>
                {logoUploading && logoUploadProgress !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>{t('settings.branding.logoUpload.progress')}</span>
                      <span className="font-semibold">{logoUploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${logoUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {!canUploadBrandLogo && (
                  <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
                    <LockClosedIcon className="h-3.5 w-3.5" />
                    {t('settings.branding.logoUpload.lockedMessage')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border pt-6">
          <Button
            type="button"
            onClick={onSave}
            disabled={saving || hasBrandingErrors}
            loading={saving}
            size="lg"
          >
            {saving ? t('settings.branding.saving') : t('settings.branding.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
