'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
};

/**
 * Breadcrumb navigation component
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Offers', href: '/dashboard/offers' },
 *     { label: 'Current Offer' }
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({ items, className = '', showHome = true }: BreadcrumbProps) {
  return (
    <nav className={`text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 flex-wrap">
        {showHome && (
          <>
            <li>
              <Link
                href="/"
                className="text-fg-muted hover:text-primary transition-colors flex items-center"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            {items.length > 0 && (
              <li className="text-fg-muted" aria-hidden="true">
                <ChevronRight className="w-4 h-4" />
              </li>
            )}
          </>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-fg-muted hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-fg font-medium' : 'text-fg-muted'}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight className="w-4 h-4 text-fg-muted" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
