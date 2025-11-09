import type { PropsWithChildren } from 'react';

export default function HighlightUnderline({ children }: PropsWithChildren) {
  return (
    <span className="relative inline-block leading-tight align-baseline">
      <span className="relative z-20">{children}</span>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-[0.2em] right-0 bottom-[-0.1em] h-[0.8em] w-full z-0"
        viewBox="0 0 300 80"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C3B3FF" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#B39CFF" stopOpacity="0.70" />
          </linearGradient>
        </defs>

        <path
          d="
           M -10 52 C 37 -5 215 -7 281 35 L 270 91 C 205 44 75 38 12 104 Z
          "
          fill="url(#hl-grad)"
        />
      </svg>
    </span>
  );
}
