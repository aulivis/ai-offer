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
      className={`inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E55A2B] text-white font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105 group ${sizeClasses[size]} ${className}`}
    >
      {children}
      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

