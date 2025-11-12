'use client';

import { useEffect, useMemo } from 'react';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingTour, type TourStep } from '../OnboardingTour';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { useOfferWizard } from '@/hooks/useOfferWizard';

export function OfferWizardOnboarding() {
  const { step } = useOfferWizard();
  const { hasCompletedStep, shouldShowElement, completeStep } = useOnboarding();

  const hasSeenWizardTour = hasCompletedStep('offer-wizard-tour');
  const shouldShowTour = shouldShowElement('offer-wizard-tour') && !hasSeenWizardTour;

  const wizardTourSteps: TourStep[] = useMemo(
    () => [
      {
        id: 'wizard-welcome',
        title: 'Let&apos;s Create Your First Offer! 🎉',
        content: (
          <div>
            <p className="mb-2">
              We&apos;ll guide you through creating a professional offer in just 3 simple steps.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Project details and description</li>
              <li>Pricing and line items</li>
              <li>Review and generate PDF</li>
            </ol>
          </div>
        ),
        position: 'center',
        skipable: true,
      },
      {
        id: 'step-1-title',
        target: '[data-onboarding="wizard-title-input"]',
        title: 'Step 1: Project Title',
        content: (
          <div>
            <p>
              Give your offer a clear, descriptive title. This will appear at the top of your offer
              document.
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Example: &quot;Website Redesign for ABC Company&quot;
            </p>
          </div>
        ),
        position: 'bottom',
      },
      {
        id: 'step-1-description',
        target: '[data-onboarding="wizard-description-input"]',
        title: 'Step 1: Project Description',
        content: (
          <div>
            <p>
              Describe what you&apos;ll deliver. Be specific about the scope, deliverables, and
              timeline. The more detail, the better!
            </p>
          </div>
        ),
        position: 'bottom',
      },
      {
        id: 'step-2-pricing',
        target: '[data-onboarding="wizard-pricing-section"]',
        title: 'Step 2: Pricing',
        content: (
          <div>
            <p>
              Add line items for your services. You can include descriptions, quantities, unit
              prices, and VAT.
            </p>
          </div>
        ),
        position: 'top',
      },
      {
        id: 'step-3-preview',
        target: '[data-onboarding="wizard-preview-panel"]',
        title: 'Step 3: Preview & Generate',
        content: (
          <div>
            <p>
              Review your offer here. Once you&apos;re happy, click &quot;Generate PDF&quot; to
              create your professional offer document.
            </p>
          </div>
        ),
        position: 'left',
      },
    ],
    [],
  );

  // Complete steps as user progresses
  useEffect(() => {
    if (step === 2) {
      completeStep('offer-wizard-step-1');
    }
    if (step === 3) {
      completeStep('offer-wizard-step-2');
    }
  }, [step, completeStep]);

  return (
    <>
      <OnboardingTour
        tourId="offer-wizard-tour"
        steps={wizardTourSteps}
        open={shouldShowTour && step === 1}
        onComplete={() => completeStep('offer-wizard-tour')}
      />

      {/* Contextual tooltips for each step */}
      {step === 1 && (
        <>
          <OnboardingTooltip
            tooltipId="wizard-title-tooltip"
            target="[data-onboarding='wizard-title-input']"
            title="Offer Title"
            content="Give your offer a clear, descriptive title that summarizes the project."
            position="bottom"
            trigger="focus"
            showOnce
          />
          <OnboardingTooltip
            tooltipId="wizard-description-tooltip"
            target="[data-onboarding='wizard-description-input']"
            title="Project Description"
            content="Describe what you'll deliver. Include scope, deliverables, and timeline for best results."
            position="bottom"
            trigger="focus"
            showOnce
          />
        </>
      )}

      {step === 2 && (
        <OnboardingTooltip
          tooltipId="wizard-pricing-tooltip"
          target="[data-onboarding='wizard-pricing-section']"
          title="Add Pricing Items"
          content="Click 'Add Item' to add services. Include descriptions, quantities, and prices."
          position="top"
          trigger="hover"
          showOnce
        />
      )}

      {step === 3 && (
        <OnboardingTooltip
          tooltipId="wizard-preview-tooltip"
          target="[data-onboarding='wizard-preview-panel']"
          title="Preview Your Offer"
          content="This is how your offer will look. Review it carefully before generating the PDF."
          position="left"
          trigger="hover"
          showOnce
        />
      )}
    </>
  );
}
