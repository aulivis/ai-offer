'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';

type DashboardEmptyStateProps = {
  isEmpty: boolean;
  message: string;
  onClearFilters?: () => void;
};

export function DashboardEmptyState({
  isEmpty,
  message,
  onClearFilters,
}: DashboardEmptyStateProps) {
  return (
    <Card
      className="flex flex-col items-center justify-center gap-6 md:gap-8 p-12 md:p-16 text-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="relative">
        <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <DocumentTextIcon className="h-10 w-10 md:h-12 md:w-12 text-primary" aria-hidden="true" />
        </div>
        <div className="absolute -top-2 -right-2 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
          <MagnifyingGlassIcon
            className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary"
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="space-y-3 max-w-md">
        <h3 className="text-lg md:text-xl font-bold text-fg">{message}</h3>
        {isEmpty ? (
          <>
            <p className="text-sm md:text-base leading-relaxed text-fg-muted">
              {t('dashboard.emptyStates.noOffersMessage')}
            </p>
            <p className="text-xs md:text-sm text-fg-muted/80 mt-2">
              Kezdj el egy új ajánlatot, hogy láthasd azokat itt.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm md:text-base leading-relaxed text-fg-muted">
              {t('dashboard.emptyStates.noResultsMessage')}
            </p>
            <p className="text-xs md:text-sm text-fg-muted/80 mt-2">
              Próbálj meg más szűrőket használni vagy töröld a keresést.
            </p>
          </>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
        {isEmpty ? (
          <Link
            href="/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-primary-ink shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
          >
            <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
            {t('dashboard.actions.newOffer')}
          </Link>
        ) : (
          onClearFilters && (
            <Button
              type="button"
              variant="secondary"
              onClick={onClearFilters}
              className="min-w-[140px]"
            >
              {t('dashboard.filters.clearAll')}
            </Button>
          )
        )}
      </div>
    </Card>
  );
}
