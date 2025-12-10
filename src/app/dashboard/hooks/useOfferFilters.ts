/**
 * Offer Filters Hook
 *
 * Extracted from dashboard page to manage filter state and persistence.
 */

import { useEffect, useState } from 'react';
import type { OfferFilter } from '@/app/dashboard/types';

const STATUS_FILTER_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'lost'] as const;
type StatusFilterOption = (typeof STATUS_FILTER_OPTIONS)[number];

const SORT_BY_OPTIONS = ['created', 'status', 'title', 'recipient'] as const;
type SortByOption = (typeof SORT_BY_OPTIONS)[number];

const SORT_DIRECTION_OPTIONS = ['desc', 'asc'] as const;
type SortDirectionOption = (typeof SORT_DIRECTION_OPTIONS)[number];

function isSortByValue(value: string): value is SortByOption {
  return (SORT_BY_OPTIONS as readonly string[]).includes(value);
}

function isSortDirectionValue(value: string): value is SortDirectionOption {
  return (SORT_DIRECTION_OPTIONS as readonly string[]).includes(value);
}

function isStatusFilterValue(value: string): value is StatusFilterOption {
  return (STATUS_FILTER_OPTIONS as readonly string[]).includes(value);
}

interface UseOfferFiltersOptions {
  initialOfferFilter?: OfferFilter;
  initialStatusFilter?: StatusFilterOption;
  initialSortBy?: SortByOption;
  initialSortDir?: SortDirectionOption;
}

/**
 * Hook to manage offer filtering and sorting state
 */
export function useOfferFilters(options: UseOfferFiltersOptions = {}) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>(
    options.initialStatusFilter || 'all',
  );
  const [offerFilter, setOfferFilter] = useState<OfferFilter>(
    options.initialOfferFilter ||
      (() => {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('dashboard-offer-filter');
          if (saved === 'my' || saved === 'team' || saved === 'all' || saved === 'member') {
            return saved;
          }
        }
        return 'all';
      })(),
  );
  const [sortBy, setSortBy] = useState<SortByOption>(options.initialSortBy || 'created');
  const [sortDir, setSortDir] = useState<SortDirectionOption>(options.initialSortDir || 'desc');

  // Persist offer filter to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-offer-filter', offerFilter);
    }
  }, [offerFilter]);

  return {
    // Search query
    q,
    setQ,

    // Status filter
    statusFilter,
    setStatusFilter,

    // Offer filter (my/team/all/member)
    offerFilter,
    setOfferFilter,

    // Sorting
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,

    // Helpers
    STATUS_FILTER_OPTIONS,
    SORT_BY_OPTIONS,
    SORT_DIRECTION_OPTIONS,
    isSortByValue,
    isSortDirectionValue,
    isStatusFilterValue,
  };
}
