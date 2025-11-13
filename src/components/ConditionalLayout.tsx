'use client';

import { usePathname } from 'next/navigation';
import LandingHeader from '@/components/LandingHeader';
import { Footer } from '@/components/footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * Conditionally renders header and footer based on the current route.
 * Hides header and footer on offer share pages.
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isOfferPage = pathname?.startsWith('/offer/');

  return (
    <>
      {!isOfferPage && <LandingHeader />}
      <div className="flex-1">{children}</div>
      {!isOfferPage && <Footer />}
    </>
  );
}

/**
 * Client component that conditionally renders decorative background elements.
 * Hides them on offer share pages for a cleaner look.
 */
export function ConditionalBackgroundDecorations() {
  const pathname = usePathname();
  const isOfferPage = pathname?.startsWith('/offer/');

  if (isOfferPage) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-20 h-[520px] bg-[radial-gradient(circle_at_top,_rgba(var(--color-primary-rgb),0.18),_transparent_65%)]" />
      <div className="pointer-events-none absolute -left-32 top-72 h-80 w-80 rounded-full bg-accent/16 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-40 h-72 w-72 rounded-full bg-primary/14 blur-3xl" />
    </>
  );
}
