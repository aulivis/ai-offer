import React, { type ComponentPropsWithoutRef } from 'react';

export const PAGE_SIZE = 12;

export type OfferWithId = { id: string };

export function mergeOfferPages<T extends OfferWithId>(previous: T[], incoming: T[]): T[] {
  if (!previous.length) {
    return incoming.slice();
  }
  const seen = new Set(previous.map((offer) => offer.id));
  const next = [...previous];
  incoming.forEach((offer) => {
    if (!seen.has(offer.id)) {
      seen.add(offer.id);
      next.push(offer);
    }
  });
  return next;
}

type LoadMoreButtonProps = {
  currentPage: number;
  totalPages?: number | null;
  hasNext?: boolean;
  isLoading?: boolean;
} & Pick<ComponentPropsWithoutRef<'button'>, 'onClick' | 'disabled'>;

export function LoadMoreButton({
  currentPage,
  totalPages = null,
  hasNext = false,
  isLoading = false,
  disabled = false,
  onClick,
}: LoadMoreButtonProps) {
  const renderedCount = typeof totalPages === 'number' && totalPages > 0
    ? Math.max(totalPages, currentPage)
    : currentPage;
  const pagesToRender = Array.from({ length: Math.max(1, renderedCount) }, (_, index) => index + 1);
  const nextPageLabel = currentPage + 1;
  const showNextButton = hasNext;

  return (
    <nav aria-label="Lapozás" className="flex items-center justify-center gap-2">
      {pagesToRender.map((page) => {
        const isCurrent = page === currentPage;
        const isFuture = page > currentPage;
        const cls = [
          'h-9 w-9 rounded-full text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isCurrent
            ? 'bg-primary text-primary-ink'
            : 'border border-border',
          isFuture
            ? 'text-fg-muted'
            : 'text-fg hover:bg-[rgb(var(--color-bg-muted-rgb)/0.6)]',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={page}
            type="button"
            className={cls}
            aria-current={isCurrent ? 'page' : undefined}
            disabled
            aria-disabled
          >
            {page.toLocaleString('hu-HU')}
          </button>
        );
      })}

      {showNextButton ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || isLoading}
          aria-busy={isLoading || undefined}
          className="h-9 w-9 rounded-full border border-border text-sm font-semibold text-fg transition hover:bg-[rgb(var(--color-bg-muted-rgb)/0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? '…' : nextPageLabel.toLocaleString('hu-HU')}
        </button>
      ) : null}
    </nav>
  );
}
