'use client';

import { useOnboarding } from '../OnboardingProvider';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingUpsell } from '../OnboardingUpsell';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';

interface SettingsOnboardingProps {
  plan: SubscriptionPlan;
  activeSection?: string;
}

export function SettingsOnboarding({ plan, activeSection }: SettingsOnboardingProps) {
  const { hasCompletedStep } = useOnboarding();

  const isFreeUser = plan === 'free';
  const hasConfiguredCompany = hasCompletedStep('settings-company-configured');
  const hasConfiguredBranding = hasCompletedStep('settings-branding-configured');

  return (
    <>
      {/* Company Information Tooltip */}
      {activeSection === 'company' && !hasConfiguredCompany && (
        <OnboardingTooltip
          tooltipId="settings-company-tooltip"
          target="[data-onboarding='settings-company-section']"
          title="Complete Your Company Profile"
          content="Add your company details to personalize your offers. This information will appear on all your offer documents."
          position="right"
          trigger="hover"
          showOnce
        />
      )}

      {/* Branding Section - Show upsell for free users */}
      {activeSection === 'branding' && isFreeUser && (
        <OnboardingUpsell
          trigger="[data-onboarding='settings-branding-section']"
          title="Unlock Branding Customization"
          description="Upgrade to Standard or Pro to customize colors and add your logo to offers."
          features={['Custom brand colors', 'Company logo on offers', 'Professional appearance']}
          ctaLabel="Upgrade Now"
          ctaHref="/billing"
          variant="inline"
          dismissible
        />
      )}

      {/* Branding Tooltip for paid users */}
      {activeSection === 'branding' && !isFreeUser && !hasConfiguredBranding && (
        <OnboardingTooltip
          tooltipId="settings-branding-tooltip"
          target="[data-onboarding='settings-branding-section']"
          title="Customize Your Brand"
          content="Add your brand colors and logo to make your offers stand out. Changes will apply to all new offers."
          position="right"
          trigger="hover"
          showOnce
        />
      )}

      {/* Templates Section */}
      {activeSection === 'templates' && isFreeUser && (
        <OnboardingUpsell
          trigger="[data-onboarding='settings-templates-section']"
          title="Access Premium Templates"
          description="Upgrade to unlock professional templates that make your offers stand out."
          features={['10+ premium templates', 'Customizable designs', 'Professional layouts']}
          ctaLabel="View Plans"
          ctaHref="/billing"
          variant="inline"
          dismissible
        />
      )}

      {/* Activities Section */}
      {activeSection === 'activities' && (
        <OnboardingTooltip
          tooltipId="settings-activities-tooltip"
          target="[data-onboarding='settings-activities-section']"
          title="Manage Your Services"
          content="Create reusable activity templates with standard prices. These can be quickly added to new offers."
          position="right"
          trigger="hover"
          showOnce
        />
      )}
    </>
  );
}
