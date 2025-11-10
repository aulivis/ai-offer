'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

type HelpTextProps = {
  text: string;
  className?: string;
  variant?: 'inline' | 'tooltip' | 'popover';
  id?: string;
};

/**
 * HelpText - Contextual help text component for forms
 *
 * Provides accessible help text for form fields with multiple display variants
 */
export function HelpText({ text, className = '', variant = 'inline', id }: HelpTextProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const helpTextId = id || `help-text-${Math.random().toString(36).slice(2)}`;

  if (variant === 'inline') {
    return (
      <p id={helpTextId} className={`text-xs text-fg-muted ${className}`} role="note">
        {text}
      </p>
    );
  }

  if (variant === 'tooltip') {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsTooltipOpen(!isTooltipOpen)}
          onBlur={() => setIsTooltipOpen(false)}
          className="inline-flex items-center justify-center rounded-full text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          {...(isTooltipOpen && { 'aria-describedby': helpTextId })}
          aria-expanded={isTooltipOpen}
          aria-label="Help"
        >
          <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        {isTooltipOpen && (
          <div
            id={helpTextId}
            role="tooltip"
            className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-bg p-3 text-sm text-fg shadow-lg z-50"
          >
            <p>{text}</p>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 h-2 w-2 rotate-45 border-r border-b border-border bg-bg" />
          </div>
        )}
      </div>
    );
  }

  // Popover variant (for mobile-friendly help)
  return (
    <details className={`group ${className}`}>
      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
        <span>Help</span>
      </summary>
      <div
        id={helpTextId}
        className="mt-2 rounded-lg border border-border bg-bg-muted p-3 text-sm text-fg"
        role="note"
      >
        {text}
      </div>
    </details>
  );
}