'use client';

import { useEffect, useMemo } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingTour, type TourStep } from '../OnboardingTour';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { OnboardingChecklist, type ChecklistItem } from '../OnboardingChecklist';

export function DashboardOnboarding() {
  const { hasCompletedStep, shouldShowElement, completeStep } = useOnboarding();

  const hasSeenDashboard = hasCompletedStep('dashboard-tour');
  const hasCreatedFirstOffer = hasCompletedStep('first-offer-created');
  const shouldShowTour = shouldShowElement('dashboard-tour') && !hasSeenDashboard;

  const dashboardTourSteps: TourStep[] = useMemo(
    () => [
      {
        id: 'welcome',
        title: 'Welcome to Your Dashboard! 👋',
        content: (
          <div>
            <p className="mb-2">
              This is your dashboard where you can manage all your offers. Let&apos;s take a quick
              tour to get you started.
            </p>
            <p>We&apos;ll show you the key features in just a few steps.</p>
          </div>
        ),
        position: 'center',
        skipable: true,
      },
      {
        id: 'create-offer-button',
        target: '[data-onboarding="create-offer-button"]',
        title: 'Create Your First Offer',
        content: (
          <div>
            <p>
              Click this button to start creating a professional offer. The wizard will guide you
              through the process step by step.
            </p>
          </div>
        ),
        position: 'bottom',
        action: {
          label: 'Start Creating',
          onClick: () => {
            window.location.href = '/dashboard/offers/new';
          },
        },
      },
      {
        id: 'offers-list',
        target: '[data-onboarding="offers-list"]',
        title: 'Your Offers',
        content: (
          <div>
            <p>
              All your offers will appear here. You can filter, sort, and manage them from this
              view.
            </p>
          </div>
        ),
        position: 'bottom',
      },
      {
        id: 'metrics',
        target: '[data-onboarding="metrics"]',
        title: 'Track Your Progress',
        content: (
          <div>
            <p>
              These metrics show your offer statistics - how many you&apos;ve created, sent, and
              their status.
            </p>
          </div>
        ),
        position: 'bottom',
      },
    ],
    [],
  );

  const checklistItems: ChecklistItem[] = useMemo(
    () => [
      {
        id: 'first-offer-created',
        label: 'Create your first offer',
        description: 'Use the wizard to create a professional offer',
        completed: hasCreatedFirstOffer,
        action: {
          label: 'Create Offer',
          href: '/dashboard/offers/new',
        },
      },
      {
        id: 'settings-configured',
        label: 'Complete your company profile',
        description: 'Add your company details in settings',
        completed: hasCompletedStep('settings-configured'),
        action: {
          label: 'Go to Settings',
          href: '/settings#company',
        },
      },
      {
        id: 'first-offer-shared',
        label: 'Share your first offer',
        description: 'Generate a shareable link for your offer',
        completed: hasCompletedStep('first-offer-shared'),
        action: {
          label: 'View Offers',
          href: '/dashboard',
        },
      },
    ],
    [hasCreatedFirstOffer, hasCompletedStep],
  );

  // Auto-complete dashboard tour when user creates first offer
  useEffect(() => {
    if (hasCreatedFirstOffer && !hasSeenDashboard) {
      completeStep('dashboard-tour');
    }
  }, [hasCreatedFirstOffer, hasSeenDashboard, completeStep]);

  return (
    <>
      <OnboardingTour
        tourId="dashboard-tour"
        steps={dashboardTourSteps}
        open={shouldShowTour}
        onComplete={() => completeStep('dashboard-tour')}
      />

      {!hasCreatedFirstOffer && (
        <OnboardingChecklist
          title="Getting Started"
          items={checklistItems}
          onItemClick={(itemId) => {
            if (itemId === 'first-offer-created') {
              completeStep('dashboard-checklist-viewed');
            }
          }}
        />
      )}

      <OnboardingTooltip
        tooltipId="dashboard-create-offer-tooltip"
        target="[data-onboarding='create-offer-button']"
        title="Create Your First Offer"
        content="Click here to start creating a professional offer with our guided wizard."
        position="bottom"
        trigger="hover"
        showOnce
      />
    </>
  );
}
