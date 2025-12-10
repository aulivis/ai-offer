'use client';

import { t } from '@/copy';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { useEffect, useCallback } from 'react';
import AppFrame from '@/components/AppFrame';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DEFAULT_OFFER_TEMPLATE_ID } from '@/app/lib/offerTemplates';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import { useProfileSettings } from '@/hooks/useProfileSettings';
import { useLogoUpload } from '@/hooks/useLogoUpload';
import { useActivities } from '@/hooks/useActivities';
import { useGuarantees } from '@/hooks/useGuarantees';
import { useSettingsTabs } from '@/hooks/useSettingsTabs';
import { useSettingsValidation } from '@/hooks/useSettingsValidation';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import type { TemplateId } from '@/lib/offers/templates/types';
import { mapTemplateId } from '@/lib/offers/templates/index';
import { SettingsSecurityTab } from '@/components/settings/SettingsSecurityTab';
import { SettingsCompanySection } from '@/components/settings/SettingsCompanySection';
import { SettingsBrandingSection } from '@/components/settings/SettingsBrandingSection';
import { SettingsTemplatesSection } from '@/components/settings/SettingsTemplatesSection';
import { SettingsActivitiesSection } from '@/components/settings/SettingsActivitiesSection';
import { SettingsGuaranteesSection } from '@/components/settings/SettingsGuaranteesSection';
import { SettingsEmailSubscriptionSection } from '@/components/settings/SettingsEmailSubscriptionSection';
import { TestimonialsManager } from '@/components/settings/TestimonialsManager';
import { SettingsTeamSection } from '@/components/settings/SettingsTeamSection';
import { SectionErrorBoundary } from '@/components/settings/SectionErrorBoundary';
import type { Profile as _Profile } from '@/components/settings/types';
import { ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const supabase = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();

  // Use custom hooks for settings management
  const {
    loading: profileLoading,
    saving: profileSaving,
    email,
    profile,
    setProfile,
    plan,
    saveProfile,
  } = useProfileSettings();

  const {
    logoUploading,
    logoUploadProgress,
    logoInputRef,
    uploadLogo,
    triggerLogoUpload,
    cancelLogoUpload,
  } = useLogoUpload(profile, setProfile, () => saveProfile('branding'));

  const {
    activities: acts,
    newActivity: newAct,
    setNewActivity: setNewAct,
    saving: actSaving,
    deletingId: actDeletingId,
    addActivity,
    deleteActivity,
    loadActivities,
  } = useActivities();

  const {
    guarantees,
    addLoading: guaranteeAddLoading,
    busyId: guaranteeBusyId,
    addGuarantee: addGuaranteeEntry,
    updateGuarantee: updateGuaranteeEntry,
    deleteGuarantee: deleteGuaranteeEntry,
    toggleAttachment: toggleGuaranteeAttachment,
    loadGuarantees,
  } = useGuarantees();

  const { testimonials, loading: testimonialsLoading, reloadTestimonials } = useTestimonials();
  const { googleLinked, linkingGoogle, startGoogleLink } = useGoogleAuth();
  const { activeTab, tabs, handleTabChange } = useSettingsTabs();
  const { errors } = useSettingsValidation(profile);

  // Use the template ID directly from profile for display (enforcement happens on save)
  const selectedTemplateId: TemplateId = profile.offer_template
    ? mapTemplateId(profile.offer_template)
    : mapTemplateId(DEFAULT_OFFER_TEMPLATE_ID);

  const handleTemplateSelect = useCallback(
    async (templateId: TemplateId) => {
      // Update profile state immediately for UI feedback
      setProfile((prev) => ({ ...prev, offer_template: templateId }));

      // Save directly with the selected template ID using hook's saveProfile
      try {
        // Temporarily update profile with template, then save
        setProfile((prev) => ({ ...prev, offer_template: templateId }));
        await saveProfile('branding');
      } catch (error) {
        // Revert to previous template on error
        setProfile((prev) => ({ ...prev, offer_template: selectedTemplateId }));
        throw error;
      }
    },
    [selectedTemplateId, saveProfile, setProfile],
  );

  // Load additional data when profile is loaded
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user || profileLoading) {
      return;
    }

    // Load activities and guarantees through hooks
    loadActivities();
    loadGuarantees();
  }, [authStatus, user, profileLoading, loadActivities, loadGuarantees]);

  function startGoogleLink() {
    if (linkingGoogle || typeof window === 'undefined') {
      return;
    }

    setLinkingGoogle(true);
    const target = new URL('/api/auth/google/link', window.location.origin);
    target.searchParams.set(
      'redirect_to',
      new URL('/settings?link=google_success', window.location.origin).toString(),
    );
    window.location.href = target.toString();
  }

  const loading = profileLoading || testimonialsLoading;

  if (loading) {
    return (
      <PageErrorBoundary>
        <AppFrame title={t('settings.title')} description={t('settings.loadingDescription')}>
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </AppFrame>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <div className="relative min-h-screen bg-gradient-to-br from-navy-50 via-slate-50 to-turquoise-50 overflow-hidden">
        {/* Decorative gradient blobs - subtle version for settings */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-navy-200 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl opacity-40"></div>

        <div className="relative z-10">
          <AppFrame
            title={t('settings.title')}
            description={t('settings.description')}
            actions={
              email ? (
                <div className="flex items-center gap-2 text-sm text-fg-muted">
                  <span>{t('settings.actions.loggedInAs')}</span>
                  <span className="font-semibold text-fg">{email}</span>
                </div>
              ) : null
            }
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 md:py-10">
              {/* Tab navigation */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-muted/95 backdrop-blur-sm shadow-pop w-full">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-bg-muted via-bg-muted to-primary/10 pointer-events-none"></div>

                {/* Tab header */}
                <div className="relative z-10 border-b border-border bg-gradient-to-b from-bg-muted/50 to-bg-muted/50">
                  <div className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`group relative flex items-center gap-2 whitespace-nowrap px-4 sm:px-6 py-4 font-semibold transition-all duration-300 flex-shrink-0 ${
                          activeTab === tab.id ? 'text-primary' : 'text-fg-muted hover:text-fg'
                        }`}
                        aria-label={tab.label}
                      >
                        {/* Active indicator with gradient */}
                        {activeTab === tab.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-turquoise-500 to-primary rounded-t-full"></span>
                        )}
                        {/* Hover effect */}
                        <span
                          className={`absolute inset-0 bg-bg-muted rounded-t-xl transition-opacity duration-300 ${
                            activeTab === tab.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-50'
                          }`}
                        ></span>
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="flex-shrink-0">{tab.icon}</span>
                          <span className="whitespace-nowrap">{tab.label}</span>
                          {activeTab === tab.id && (
                            <span
                              className="ml-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"
                              aria-hidden
                            />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 w-full">
                  <div
                    className={`transition-all duration-300 ${
                      activeTab === 'profile' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'profile' && (
                      <div className="space-y-8 w-full">
                        <SettingsCompanySection
                          profile={profile}
                          errors={errors.general}
                          onProfileChange={setProfile}
                          onSave={() => saveProfile('all')}
                          saving={profileSaving}
                        />
                        <div className="border-t border-slate-200 pt-8">
                          <SettingsBrandingSection
                            profile={profile}
                            plan={plan}
                            errors={errors.branding}
                            logoUploading={logoUploading}
                            logoUploadProgress={logoUploadProgress}
                            onProfileChange={setProfile}
                            onTriggerLogoUpload={triggerLogoUpload}
                            onCancelLogoUpload={cancelLogoUpload}
                            onSave={() => saveProfile('branding')}
                            onOpenPlanUpgradeDialog={openPlanUpgradeDialog}
                            saving={profileSaving}
                          />
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadLogo(file).finally(() => {
                                  if (e.target) e.target.value = '';
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="border-t border-slate-200 pt-8">
                          <SettingsEmailSubscriptionSection />
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'security' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'security' && (
                      <SectionErrorBoundary sectionName={t('settings.authMethods.title')}>
                        <SettingsSecurityTab
                          googleLinked={googleLinked}
                          linkingGoogle={linkingGoogle}
                          email={email}
                          onLinkGoogle={startGoogleLink}
                        />
                      </SectionErrorBoundary>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'templates' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'templates' && (
                      <SectionErrorBoundary sectionName={t('settings.templates.title')}>
                        <SettingsTemplatesSection
                          selectedTemplateId={selectedTemplateId}
                          plan={plan}
                          onTemplateSelect={handleTemplateSelect}
                        />
                      </SectionErrorBoundary>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'activities' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'activities' && (
                      <SectionErrorBoundary sectionName={t('settings.activities.title')}>
                        <SettingsActivitiesSection
                          activities={acts}
                          newActivity={newAct}
                          saving={actSaving}
                          deletingId={actDeletingId}
                          plan={plan}
                          defaultActivityId={profile.default_activity_id}
                          onNewActivityChange={setNewAct}
                          onAddActivity={addActivity}
                          onDeleteActivity={deleteActivity}
                          onActivityImagesChange={async (activityId, imagePaths) => {
                            if (!user) return;
                            try {
                              const { error } = await supabase
                                .from('activities')
                                .update({ reference_images: imagePaths })
                                .eq('id', activityId)
                                .eq('user_id', user.id);
                              if (error) {
                                throw error;
                              }
                              setActs((prev) =>
                                prev.map((a) =>
                                  a.id === activityId ? { ...a, reference_images: imagePaths } : a,
                                ),
                              );
                            } catch (error) {
                              logger.error('Failed to save reference images', error, {
                                activityId,
                              });
                              showToast({
                                title: t('errors.settings.saveFailed', {
                                  message: 'Nem sikerült menteni a referenciafotókat',
                                }),
                                description:
                                  error instanceof Error ? error.message : 'Ismeretlen hiba',
                                variant: 'error',
                              });
                            }
                          }}
                          onDefaultActivityChange={async (activityId) => {
                            if (!user) return;
                            try {
                              setProfile((p) => ({ ...p, default_activity_id: activityId }));
                              const { error } = await supabase
                                .from('profiles')
                                .update({ default_activity_id: activityId })
                                .eq('id', user.id);
                              if (error) {
                                throw error;
                              }
                              showToast({
                                title: t('toasts.settings.saveSuccess'),
                                description: '',
                                variant: 'success',
                              });
                            } catch (error) {
                              logger.error('Failed to save default activity', error, {
                                activityId,
                              });
                              showToast({
                                title: t('errors.settings.saveFailed', {
                                  message: 'Nem sikerült menteni az alapértelmezett tevékenységet',
                                }),
                                description:
                                  error instanceof Error ? error.message : 'Ismeretlen hiba',
                                variant: 'error',
                              });
                            }
                          }}
                          onOpenPlanUpgradeDialog={openPlanUpgradeDialog}
                        />
                      </SectionErrorBoundary>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'guarantees' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'guarantees' && (
                      <SectionErrorBoundary sectionName={t('settings.guarantees.title')}>
                        <SettingsGuaranteesSection
                          activities={acts}
                          guarantees={guarantees}
                          addLoading={guaranteeAddLoading}
                          busyGuaranteeId={guaranteeBusyId}
                          onAddGuarantee={addGuaranteeEntry}
                          onUpdateGuarantee={updateGuaranteeEntry}
                          onDeleteGuarantee={deleteGuaranteeEntry}
                          onToggleAttachment={toggleGuaranteeAttachment}
                        />
                      </SectionErrorBoundary>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'testimonials' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'testimonials' && (
                      <SectionErrorBoundary sectionName={t('settings.testimonials.title')}>
                        <div className="space-y-8 w-full">
                          <div className="mb-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                                  <ChatBubbleLeftRightIcon className="relative z-10 h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h2 className="text-2xl md:text-3xl font-bold text-fg mb-1">
                                    {t('settings.testimonials.title')}
                                  </h2>
                                  <p className="text-sm md:text-base text-fg-muted">
                                    {t('settings.testimonials.subtitle')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            {plan === 'pro' ? (
                              <TestimonialsManager
                                testimonials={testimonials}
                                activities={acts}
                                enabled={true}
                                plan={plan}
                                onTestimonialsChange={reloadTestimonials}
                              />
                            ) : (
                              <div className="rounded-xl border-2 border-border bg-bg-muted/50 p-8 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                                  <LockClosedIcon className="h-6 w-6 text-warning" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-fg">
                                  {t('settings.proFeatures.testimonials.upgradeTitle')}
                                </h3>
                                <p className="mt-2 text-xs text-fg-muted">
                                  {t('settings.proFeatures.testimonials.upgradeDescription')}
                                </p>
                                <Button
                                  onClick={() =>
                                    openPlanUpgradeDialog({
                                      description: t(
                                        'settings.proFeatures.testimonials.upgradeDescription',
                                      ),
                                    })
                                  }
                                  variant="primary"
                                  className="mt-4"
                                >
                                  {t('settings.proFeatures.testimonials.upgradeButton')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </SectionErrorBoundary>
                    )}
                  </div>

                  <div
                    className={`transition-all duration-300 w-full ${
                      activeTab === 'team' ? 'opacity-100 translate-y-0' : 'hidden'
                    }`}
                  >
                    {activeTab === 'team' && (
                      <SectionErrorBoundary
                        sectionName={t('settings.team.title', { default: 'Csapatkezelés' })}
                      >
                        <SettingsTeamSection plan={plan} />
                      </SectionErrorBoundary>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </AppFrame>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
