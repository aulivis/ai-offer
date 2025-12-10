'use client';

import { CheckCircle } from 'lucide-react';

type YouAreHereProps = {
  label: string;
  className?: string;
};

/**
 * "You are here" indicator for complex pages
 * Helps users understand their current location in the navigation hierarchy
 */
export function YouAreHere({ label, className = '' }: YouAreHereProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium ${className}`}
      role="status"
      aria-label={`You are here: ${label}`}
    >
      <CheckCircle className="w-4 h-4" aria-hidden="true" />
      <span>Itt vagy: {label}</span>
    </div>
  );
}
