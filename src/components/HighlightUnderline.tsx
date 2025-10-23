import type { PropsWithChildren } from 'react';

export default function HighlightUnderline({ children }: PropsWithChildren) {
  return (
    <span className="relative inline-block leading-tight">
      {/* Text above the highlight */}
      <span className="relative z-10">{children}</span>

      {/* Decorative curved highlight */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[0.05em] h-[0.65em] w-full -z-10"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 12 C25 0, 75 24, 100 12 L100 24 L0 24 Z"
          fill="rgba(195, 179, 255, 0.7)"
        />
      </svg>
    </span>
  );
}
