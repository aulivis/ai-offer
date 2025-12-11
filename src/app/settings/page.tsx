'use client';

import { t } from '@/copy';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { useEffect, useCallback, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { useSettingsValidation } from '@/hooks/useSettingsValidation';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import type { TemplateId } from '@/lib/offers/templates/types';
import { mapTemplateId } from '@/lib/offers/templates/index';
import { SectionErrorBoundary } from '@/components/settings/SectionErrorBoundary';

// Lazy load settings tab sections for route-based code splitting
const SettingsSecurityTab = dynamic(
  () => import('@/components/settings/SettingsSecurityTab').then((mod) => mod.SettingsSecurityTab),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsCompanySection = dynamic(
  () =>
    import('@/components/settings/SettingsCompanySection').then(
      (mod) => mod.SettingsCompanySection,
    ),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsBrandingSection = dynamic(
  () =>
    import('@/components/settings/SettingsBrandingSection').then(
      (mod) => mod.SettingsBrandingSection,
    ),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsTemplatesSection = dynamic(
  () =>
    import('@/components/settings/SettingsTemplatesSection').then(
      (mod) => mod.SettingsTemplatesSection,
    ),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsActivitiesSection = dynamic(
  () =>
    import('@/components/settings/SettingsActivitiesSection').then(
      (mod) => mod.SettingsActivitiesSection,
    ),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsGuaranteesSection = dynamic(
  () =>
    import('@/components/settings/SettingsGuaranteesSection').then(
      (mod) => mod.SettingsGuaranteesSection,
    ),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsEmailSubscriptionSection = dynamic(
  () =>
    import('@/components/settings/SettingsEmailSubscriptionSection').then(
      (mod) => mod.SettingsEmailSubscriptionSection,
    ),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const TestimonialsManager = dynamic(
  () => import('@/components/settings/TestimonialsManager').then((mod) => mod.TestimonialsManager),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const SettingsTeamSection = dynamic(
  () => import('@/components/settings/SettingsTeamSection').then((mod) => mod.SettingsTeamSection),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
import type { Profile as _Profile } from '@/components/settings/types';
import { ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { H2 } from '@/components/ui/Heading';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { createClientLogger } from '@/lib/clientLogger';

export default function SettingsPage() {
  const supabase = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const { showToast } = useToast();

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
    updateActivityImages,
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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'SettingsPage' }),
    [user?.id],
  );

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
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
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
      <div className="relative min-h-screen bg-gradient-settings overflow-hidden">
        {/* Decorative gradient blobs - subtle version for settings */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 motion-safe:animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-20 motion-safe:animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-2xl opacity-40"></div>

        <div className="relative z-10">
          <AppFrame
            title={t('settings.title')}
            description={t('settings.description')}
            actions={
              <div className="flex items-center gap-4">
                {email && (
                  <div className="flex items-center gap-2 text-body-small text-fg-muted">
                    <span>{t('settings.actions.loggedInAs')}</span>
                    <span className="font-semibold text-fg">{email}</span>
                  </div>
                )}
                <Button
                  onClick={async () => {
                    try {
                      // Save all sections
                      await Promise.all([saveProfile('all'), saveProfile('branding')]);
                      setShowSuccessMessage(true);
                      showToast({
                        title: t('toasts.settings.saveSuccess'),
                        description: 'Minden változtatás mentve',
                        variant: 'success',
                      });
                      // Hide success message after 5 seconds
                      setTimeout(() => setShowSuccessMessage(false), 5000);
                    } catch {
                      showToast({
                        title: t('errors.settings.saveFailed', { message: 'Nem sikerült menteni' }),
                        description: 'Kérjük, próbálja újra később',
                        variant: 'error',
                      });
                    }
                  }}
                  disabled={profileSaving}
                  loading={profileSaving}
                  variant="primary"
                  size="lg"
                  className="min-w-[160px]"
                >
                  {profileSaving ? t('settings.actions.saving') : t('settings.actions.saveAll')}
                </Button>
              </div>
            }
          >
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 md:py-10">
              {/* Breadcrumb Navigation */}
              <Breadcrumb items={[{ label: t('settings.title') }]} />

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-6 rounded-xl border-2 border-success/40 bg-gradient-to-br from-success/20 to-success/10 p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-success rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h5 font-bold text-success mb-1">
                        {t('settings.successMessage.title')}
                      </h3>
                      <p className="text-body text-success/90 mb-3">
                        {t('settings.successMessage.description')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/dashboard"
                          className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-body-small font-semibold text-white transition-all hover:bg-success/90"
                        >
                          {t('settings.successMessage.backToDashboard')}
                        </Link>
                        <Link
                          href="/new"
                          className="inline-flex items-center gap-2 rounded-lg border-2 border-success/30 bg-success/10 px-4 py-2 text-body-small font-semibold text-success transition-all hover:bg-success/20"
                        >
                          {t('settings.successMessage.createNewOffer')}
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSuccessMessage(false)}
                      className="flex-shrink-0 text-success/70 hover:text-success transition-colors"
                      aria-label={t('settings.successMessage.closeAriaLabel')}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab navigation using Radix UI */}
              <Tabs
                value={activeTab}
                onValueChange={(value) => handleTabChange(value as typeof activeTab)}
                className="w-full"
              >
                <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-muted/95 backdrop-blur-sm shadow-pop w-full">
                  <TabsList className="w-full justify-start rounded-none border-b-2 border-border bg-transparent p-0 h-auto">
                    <div className="relative flex items-center gap-2 overflow-x-auto px-3 sm:px-4 md:px-6 scrollbar-hide w-full">
                      {/* Scroll indicators for mobile */}
                      <div
                        className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-bg-muted/95 to-transparent md:hidden z-10"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-bg-muted/95 to-transparent md:hidden z-10"
                        aria-hidden
                      />
                      {tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="group relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap px-3 sm:px-5 md:px-7 py-4 sm:py-5 transition-all duration-300 flex-shrink-0 min-h-[44px] data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:text-body data-[state=active]:scale-105 text-fg-muted font-semibold text-body-small hover:text-fg hover:scale-105 rounded-none border-b-2 border-transparent data-[state=active]:border-primary touch-manipulation"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="flex-shrink-0">{tab.icon}</span>
                            <span className="whitespace-nowrap">{tab.label}</span>
                          </span>
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>

                  {/* Tab content */}
                  <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full min-h-[400px]">
                    <TabsContent value="profile" className="mt-0">
                      {activeTab === 'profile' && (
                        <section
                          // eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings
                          aria-labelledby="profile-settings-heading"
                          className="space-y-8 w-full"
                        >
                          <h2 id="profile-settings-heading" className="sr-only">
                            {t('settings.profile.heading')}
                          </h2>
                          <SettingsCompanySection
                            profile={profile}
                            errors={errors.general}
                            onProfileChange={setProfile}
                            onSave={() => saveProfile('all')}
                            saving={profileSaving}
                          />
                          <div className="border-t-2 border-border/60 pt-8">
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
                          <div className="border-t-2 border-border/60 pt-8">
                            <SettingsEmailSubscriptionSection />
                          </div>
                        </section>
                      )}
                    </TabsContent>

                    <TabsContent value="security" className="mt-0">
                      {activeTab === 'security' && (
                        <SectionErrorBoundary sectionName={t('settings.authMethods.title')}>
                          {/* eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings */}
                          <section aria-labelledby="security-settings-heading">
                            <h2 id="security-settings-heading" className="sr-only">
                              {t('settings.security.heading')}
                            </h2>
                            <SettingsSecurityTab
                              googleLinked={googleLinked}
                              linkingGoogle={linkingGoogle}
                              email={email}
                              onLinkGoogle={startGoogleLink}
                            />
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>

                    <TabsContent value="templates" className="mt-0">
                      {activeTab === 'templates' && (
                        <SectionErrorBoundary sectionName={t('settings.templates.title')}>
                          {/* eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings */}
                          <section aria-labelledby="templates-settings-heading">
                            <h2 id="templates-settings-heading" className="sr-only">
                              {t('settings.templates.heading')}
                            </h2>
                            <SettingsTemplatesSection
                              selectedTemplateId={selectedTemplateId}
                              plan={plan}
                              onTemplateSelect={handleTemplateSelect}
                            />
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>

                    <TabsContent value="activities" className="mt-0">
                      {activeTab === 'activities' && (
                        <SectionErrorBoundary sectionName={t('settings.activities.title')}>
                          {/* eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings */}
                          <section aria-labelledby="activities-settings-heading">
                            <h2 id="activities-settings-heading" className="sr-only">
                              {t('settings.activities.heading')}
                            </h2>
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
                                try {
                                  await updateActivityImages(activityId, imagePaths);
                                  showToast({
                                    title: t('toasts.settings.saveSuccess'),
                                    description: '',
                                    variant: 'success',
                                  });
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
                                      message:
                                        'Nem sikerült menteni az alapértelmezett tevékenységet',
                                    }),
                                    description:
                                      error instanceof Error ? error.message : 'Ismeretlen hiba',
                                    variant: 'error',
                                  });
                                }
                              }}
                              onOpenPlanUpgradeDialog={openPlanUpgradeDialog}
                            />
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>

                    <TabsContent value="guarantees" className="mt-0">
                      {activeTab === 'guarantees' && (
                        <SectionErrorBoundary sectionName={t('settings.guarantees.title')}>
                          {/* eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings */}
                          <section aria-labelledby="guarantees-settings-heading">
                            <h2 id="guarantees-settings-heading" className="sr-only">
                              {t('settings.guarantees.heading')}
                            </h2>
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
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>

                    <TabsContent value="testimonials" className="mt-0">
                      {activeTab === 'testimonials' && (
                        <SectionErrorBoundary sectionName={t('settings.testimonials.title')}>
                          <section
                            // eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings
                            aria-labelledby="testimonials-settings-heading"
                            className="space-y-8 w-full"
                          >
                            <h2 id="testimonials-settings-heading" className="sr-only">
                              {t('settings.testimonials.heading')}
                            </h2>
                            <div className="mb-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
                                    <ChatBubbleLeftRightIcon className="relative z-10 h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <H2 className="mb-1" fluid>
                                      {t('settings.testimonials.title')}
                                    </H2>
                                    <p className="text-body-small md:text-body text-fg-muted">
                                      {t('settings.testimonials.subtitle')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-6">
                              {plan === 'pro' ? (
                                <TestimonialsManager
                                  testimonials={testimonials || []}
                                  activities={acts || []}
                                  enabled={true}
                                  plan={plan}
                                  onTestimonialsChange={reloadTestimonials}
                                />
                              ) : (
                                <div className="rounded-xl border-2 border-border bg-bg-muted/50 p-8 text-center">
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                                    <LockClosedIcon className="h-6 w-6 text-warning" />
                                  </div>
                                  <h3 className="mt-4 text-body-small font-semibold text-fg">
                                    {t('settings.proFeatures.testimonials.upgradeTitle')}
                                  </h3>
                                  <p className="mt-2 text-body-small text-fg-muted">
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
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>

                    <TabsContent value="team" className="mt-0">
                      {activeTab === 'team' && (
                        <SectionErrorBoundary sectionName={t('settings.team.title')}>
                          {/* eslint-disable-next-line no-hardcoded-ui-strings/no-hardcoded-ui-strings */}
                          <section aria-labelledby="team-settings-heading">
                            <h2 id="team-settings-heading" className="sr-only">
                              {t('settings.team.heading')}
                            </h2>
                            <SettingsTeamSection plan={plan} />
                          </section>
                        </SectionErrorBoundary>
                      )}
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>
          </AppFrame>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
