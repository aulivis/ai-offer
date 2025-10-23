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
  appearance?: 'primary' | 'outline';
  isLoading?: boolean;
} & Pick<ComponentPropsWithoutRef<'button'>, 'onClick' | 'disabled'>;

export function LoadMoreButton({
  appearance = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
}: LoadMoreButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  const variant = appearance === 'outline'
    ? 'border border-border bg-white text-slate-700 shadow-sm hover:border-border hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60'
    : 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${baseClasses} ${variant}`}
    >
      {isLoading ? 'Betöltés…' : 'További ajánlatok betöltése'}
    </button>
  );
}
