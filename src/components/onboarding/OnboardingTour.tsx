'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useOnboarding } from './OnboardingProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type TourStep = {
  id: string;
  target?: string; // CSS selector
  title: string;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
};

export type OnboardingTourProps = {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function OnboardingTour({
  tourId,
  steps,
  onComplete,
  onSkip,
  open: controlledOpen,
  onOpenChange,
}: OnboardingTourProps) {
  const { shouldShowElement, dismissElement, completeStep } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const shouldShow = shouldShowElement(tourId);
  const isControlled = controlledOpen !== undefined;

  useEffect(() => {
    if (isControlled) {
      setIsOpen(controlledOpen);
    } else if (shouldShow && steps.length > 0) {
      setIsOpen(true);
    }
  }, [shouldShow, steps.length, isControlled, controlledOpen]);

  useEffect(() => {
    if (!isOpen || currentStep >= steps.length) return;

    const step = steps[currentStep];
    if (!step.target) {
      setTargetElement(null);
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }

    const element = document.querySelector(step.target) as HTMLElement;
    if (!element) {
      // Element not found, try again after a short delay
      const timeout = setTimeout(() => {
        const retryElement = document.querySelector(step.target!) as HTMLElement;
        if (retryElement) {
          setTargetElement(retryElement);
          updateTooltipPosition(retryElement, step.position);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }

    setTargetElement(element);
    updateTooltipPosition(element, step.position);
  }, [isOpen, currentStep, steps, updateTooltipPosition]);

  const updateTooltipPosition = useCallback(
    (element: HTMLElement, position: TourStep['position'] = 'bottom') => {
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 200;
      const spacing = 16;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - tooltipHeight - spacing;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - spacing;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + spacing;
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipHeight / 2;
          left = window.innerWidth / 2 - tooltipWidth / 2;
          break;
      }

      // Keep tooltip within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

      setTooltipPosition({ top, left });
    },
    [],
  );

  const handleComplete = useCallback(async () => {
    await completeStep(tourId);
    await dismissElement(tourId);
    setIsOpen(false);
    onOpenChange?.(false);
    onComplete?.();
  }, [tourId, completeStep, dismissElement, onOpenChange, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(async () => {
    await dismissElement(tourId);
    setIsOpen(false);
    onOpenChange?.(false);
    onSkip?.();
  }, [tourId, dismissElement, onOpenChange, onSkip]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
      style={{
        animation: reducedMotion ? 'none' : 'fadeIn 200ms ease-out',
      }}
    >
      {/* Dark overlay with spotlight */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          clipPath: targetElement
            ? `polygon(
                0% 0%, 0% 100%, 
                ${targetElement.getBoundingClientRect().left - 8}px 100%, 
                ${targetElement.getBoundingClientRect().left - 8}px ${targetElement.getBoundingClientRect().top - 8}px, 
                ${targetElement.getBoundingClientRect().right + 8}px ${targetElement.getBoundingClientRect().top - 8}px, 
                ${targetElement.getBoundingClientRect().right + 8}px ${targetElement.getBoundingClientRect().bottom + 8}px, 
                ${targetElement.getBoundingClientRect().left - 8}px ${targetElement.getBoundingClientRect().bottom + 8}px, 
                ${targetElement.getBoundingClientRect().left - 8}px 100%, 
                100% 100%, 100% 0%
              )`
            : undefined,
        }}
      />

      {/* Tooltip */}
      {tooltipPosition && (
        <div
          ref={tooltipRef}
          className="absolute z-[10000] w-80 rounded-xl border border-border bg-white p-6 shadow-2xl"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            animation: reducedMotion ? 'none' : 'slideUp 300ms ease-out',
          }}
        >
          {/* Progress indicator */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-fg-muted">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="rounded p-1 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
              aria-label="Skip tour"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-semibold text-fg">{step.title}</h3>
          <div className="mb-6 text-sm text-fg-muted">{step.content}</div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {!isFirst && (
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step.skipable && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              {step.action ? (
                <Button variant="primary" size="sm" onClick={step.action.onClick}>
                  {step.action.label}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleNext}>
                  {isLast ? 'Complete' : 'Next'}
                  {!isLast && <ChevronRightIcon className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
