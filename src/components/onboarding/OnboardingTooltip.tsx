'use client';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useOnboarding } from './OnboardingProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type OnboardingTooltipProps = {
  tooltipId: string;
  target: string | React.RefObject<HTMLElement>;
  title: string;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  showOnce?: boolean;
  delay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function OnboardingTooltip({
  tooltipId,
  target,
  title,
  content,
  position = 'top',
  trigger = 'hover',
  showOnce = false,
  delay = 300,
  open: controlledOpen,
  onOpenChange,
}: OnboardingTooltipProps) {
  const { shouldShowElement, dismissElement } = useOnboarding();
  const [isOpen, setIsOpen] = useState(controlledOpen ?? false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const targetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reducedMotion = useReducedMotion();

  const shouldShow = shouldShowElement(tooltipId);
  const isControlled = controlledOpen !== undefined;

  useEffect(() => {
    const targetElement =
      typeof target === 'string' ? (document.querySelector(target) as HTMLElement) : target.current;

    if (!targetElement) return;

    targetRef.current = targetElement;

    const updatePosition = () => {
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipHeight = 120;
      const spacing = 12;

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
      }

      // Keep tooltip within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

      setTooltipPosition({ top, left });
    };

    const handleShow = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (shouldShow) {
          updatePosition();
          setIsOpen(true);
          onOpenChange?.(true);
        }
      }, delay);
    };

    const handleHide = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsOpen(false);
      onOpenChange?.(false);
    };

    if (trigger === 'hover') {
      targetElement.addEventListener('mouseenter', handleShow);
      targetElement.addEventListener('mouseleave', handleHide);
    } else if (trigger === 'click') {
      targetElement.addEventListener('click', handleShow);
    } else if (trigger === 'focus') {
      targetElement.addEventListener('focus', handleShow);
      targetElement.addEventListener('blur', handleHide);
    }

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      targetElement.removeEventListener('mouseenter', handleShow);
      targetElement.removeEventListener('mouseleave', handleHide);
      targetElement.removeEventListener('click', handleShow);
      targetElement.removeEventListener('focus', handleShow);
      targetElement.removeEventListener('blur', handleHide);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [target, position, trigger, delay, shouldShow, onOpenChange]);

  const handleDismiss = useCallback(async () => {
    if (showOnce) {
      await dismissElement(tooltipId);
    }
    setIsOpen(false);
    onOpenChange?.(false);
  }, [tooltipId, showOnce, dismissElement, onOpenChange]);

  useEffect(() => {
    if (isControlled) {
      setIsOpen(controlledOpen);
    }
  }, [isControlled, controlledOpen]);

  if (!shouldShow || !isOpen || !tooltipPosition) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9998] w-70 rounded-lg border border-border bg-white p-4 shadow-xl"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        animation: reducedMotion ? 'none' : 'fadeIn 200ms ease-out',
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-fg">{title}</h4>
        <button
          onClick={handleDismiss}
          className="rounded p-0.5 text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
          aria-label="Dismiss tooltip"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-xs text-fg-muted">{content}</div>
      {/* Arrow pointing to target */}
      <div
        className={`absolute h-2 w-2 rotate-45 border border-border bg-white ${
          position === 'top'
            ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0'
            : position === 'bottom'
              ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0'
              : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0'
                : 'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
        }`}
      />
    </div>,
    document.body,
  );
}
