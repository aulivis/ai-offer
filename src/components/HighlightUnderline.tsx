import type { PropsWithChildren } from 'react';

export default function HighlightUnderline({ children }: PropsWithChildren) {
  return (
    <span className="relative inline-block leading-tight transition-transform duration-200 ease-out group-hover:translate-y-[1px]">
      <span className="relative z-10">{children}</span>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[0.05em] h-[0.6em] w-full -z-10"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="24"
          rx="12"
          transform="skewX(-12)"
          fill="rgba(195, 179, 255, 0.7)"
        />
      </svg>
    </span>
  );
}
