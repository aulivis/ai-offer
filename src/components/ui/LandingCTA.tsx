import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type LandingCTAProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * Centralized CTA component for landing page sections
 * Ensures consistent styling with white text color
 */
export function LandingCTA({
  href = '/login?redirect=/new',
  children,
  className = '',
  size = 'lg',
}: LandingCTAProps) {
  const sizeClasses = {
    sm: 'px-6 py-3 text-base min-h-[44px]',
    md: 'px-8 py-4 text-lg min-h-[48px]',
    lg: 'px-12 py-6 text-xl min-h-[56px]',
  };

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 bg-cta hover:bg-cta-hover text-cta-ink font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      <span className="relative z-10 text-cta-ink">{children}</span>
      <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform duration-300 text-cta-ink" />
      <span className="absolute inset-0 bg-gradient-to-r from-cta-hover/80 to-cta/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
    </Link>
  );
}
