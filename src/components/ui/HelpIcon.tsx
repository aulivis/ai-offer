'use client';

import { useState } from 'react';

type HelpIconProps = {
  content: string;
  label: string;
};

/**
 * Inline help icon with tooltip
 */
export function HelpIcon({ content, label }: HelpIconProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="7" strokeWidth="1.8" />
          <path d="M10 7v3.6" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-white px-3 py-2 text-xs text-slate-700 shadow-lg"
          role="tooltip"
        >
          <p>{content}</p>
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-border bg-white" />
        </div>
      )}
    </div>
  );
}



