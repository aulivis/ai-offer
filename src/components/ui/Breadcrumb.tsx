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
 * Standard Breadcrumb navigation component with ARIA patterns
 * Follows WAI-ARIA Authoring Practices for breadcrumb navigation
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
  const allItems = showHome ? [{ label: 'Home', href: '/' }, ...items] : items;

  return (
    <nav className={`text-sm ${className}`} aria-label="Breadcrumb">
      <ol
        className="flex items-center gap-2 flex-wrap"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const position = index + 1;

          return (
            <li
              key={index}
              className="flex items-center gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-fg-muted hover:text-primary transition-colors flex items-center"
                  itemProp="item"
                >
                  {index === 0 && showHome ? (
                    <>
                      <Home className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-fg font-medium' : 'text-fg-muted'}
                  itemProp="name"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {index === 0 && showHome ? (
                    <>
                      <Home className="w-4 h-4 inline" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
              {!isLast && (
                <ChevronRight
                  className="w-4 h-4 text-fg-muted"
                  aria-hidden="true"
                  role="presentation"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
