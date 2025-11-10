// Utility classes and helpers for mobile optimization

export const touchTarget = {
  // Minimum 44x44px touch targets
  base: 'min-h-[44px] min-w-[44px]',
  // Comfortable spacing between touch targets
  spacing: 'gap-3 sm:gap-4',
  // Active/pressed states for better feedback
  active: 'active:scale-95 transition-transform',
};

export const mobileTypography = {
  // Ensure readable font sizes (min 16px to prevent zoom)
  body: 'text-base sm:text-lg',
  small: 'text-sm sm:text-base',
  heading: 'text-2xl sm:text-3xl md:text-4xl',
  hero: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
};

export const mobileSpacing = {
  section: 'py-12 sm:py-16 md:py-20',
  container: 'px-4 sm:px-6 md:px-8',
  stack: 'space-y-6 sm:space-y-8 md:space-y-12',
};
