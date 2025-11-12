'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './OnboardingProvider';
import { usePlanUpgradeDialog } from '@/components/PlanUpgradeDialogProvider';
import { useRouter } from 'next/navigation';

export type OnboardingUpsellProps = {
  trigger?: string; // Element ID or selector that triggers this
  title: string;
  description: string;
  features?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  variant?: 'banner' | 'modal' | 'inline';
  dismissible?: boolean;
  onDismiss?: () => void;
};

export function OnboardingUpsell({
  trigger,
  title,
  description,
  features = [],
  ctaLabel = 'Upgrade Now',
  ctaHref = '/billing',
  variant = 'banner',
  dismissible = true,
  onDismiss,
}: OnboardingUpsellProps) {
  const { shouldShowElement, dismissElement } = useOnboarding();
  const { openPlanUpgradeDialog } = usePlanUpgradeDialog();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      const element = document.querySelector(trigger);
      if (element) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setIsVisible(entry.isIntersecting);
          },
          { threshold: 0.5 },
        );
        observer.observe(element);
        return () => observer.disconnect();
      }
    } else {
      setIsVisible(true);
    }
  }, [trigger]);

  const elementId = trigger || `upsell-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const shouldShow = shouldShowElement(elementId);

  const handleDismiss = async () => {
    await dismissElement(elementId);
    onDismiss?.();
  };

  const handleCta = () => {
    if (ctaHref) {
      router.push(ctaHref);
    } else {
      openPlanUpgradeDialog({
        title,
        description,
      });
    }
  };

  if (!shouldShow || !isVisible) return null;

  if (variant === 'modal') {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <SparklesIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 text-lg font-semibold text-fg">{title}</h3>
            <p className="mb-4 text-sm text-fg-muted">{description}</p>
            {features.length > 0 && (
              <ul className="mb-4 space-y-2">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-fg-muted">
                    <CheckCircleIcon className="h-4 w-4 text-success flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" onClick={handleCta}>
                {ctaLabel}
              </Button>
              {dismissible && (
                <Button variant="ghost" size="md" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              )}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="border-b border-primary/20 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-fg">{title}</p>
              <p className="text-xs text-fg-muted">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleCta}>
              {ctaLabel}
            </Button>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="rounded p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex items-start gap-3">
        <SparklesIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="mb-1 text-sm font-semibold text-fg">{title}</h4>
          <p className="mb-3 text-xs text-fg-muted">{description}</p>
          <Button variant="primary" size="sm" onClick={handleCta}>
            {ctaLabel}
          </Button>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
