'use client';

import { t } from '@/copy';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ViewSwitcher, type ViewMode } from '@/components/dashboard/ViewSwitcher';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import type {
  OfferFilter,
  StatusFilterOption,
  SortByOption,
  SortDirectionOption,
} from '@/app/dashboard/types';
import { STATUS_LABEL_KEYS } from '@/app/dashboard/types';

const STATUS_FILTER_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'lost'] as const;

type DashboardFiltersSectionProps = {
  searchQuery: string;
  sanitizedQuery: string;
  statusFilter: StatusFilterOption;
  offerFilter: OfferFilter;
  sortBy: SortByOption;
  sortDir: SortDirectionOption;
  viewMode: ViewMode;
  teamIds: string[];
  teamMembers: Array<{ user_id: string; email: string | null }>;
  teamMemberFilter: string[];
  statusFilterCounts: Record<string, number>;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: StatusFilterOption) => void;
  onOfferFilterChange: (filter: OfferFilter) => void;
  onTeamMemberFilterChange: (memberIds: string[]) => void;
  onSortByChange: (sortBy: SortByOption) => void;
  onSortDirChange: (sortDir: SortDirectionOption) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onClearFilters: () => void;
  isSortByValue: (value: string) => value is SortByOption;
  isSortDirectionValue: (value: string) => value is SortDirectionOption;
};

export function DashboardFiltersSection({
  searchQuery,
  sanitizedQuery,
  statusFilter,
  offerFilter,
  sortBy,
  sortDir,
  viewMode,
  teamIds,
  teamMembers,
  teamMemberFilter,
  statusFilterCounts,
  filteredCount,
  onSearchChange,
  onStatusFilterChange,
  onOfferFilterChange,
  onTeamMemberFilterChange,
  onSortByChange,
  onSortDirChange,
  onViewModeChange,
  onClearFilters,
  isSortByValue,
  isSortDirectionValue,
}: DashboardFiltersSectionProps) {
  return (
    <Card as="section" className="mb-8">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-fg-muted" aria-hidden="true" />
          </div>
          <Input
            placeholder={t('dashboard.filters.search.placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 pr-4 py-3 text-base shadow-sm"
            wrapperClassName=""
          />
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-fg-muted hover:text-fg transition-colors"
              aria-label={t('dashboard.filters.remove')}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div
          className="flex flex-wrap items-center gap-2 sm:gap-3"
          role="group"
          aria-label={t('dashboard.filters.status.label')}
        >
          <span className="text-xs sm:text-sm font-semibold text-fg">
            {t('dashboard.filters.status.label')}:
          </span>
          {STATUS_FILTER_OPTIONS.map((status) => {
            const count = statusFilterCounts[status] ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                onKeyDown={(e) => {
                  // Keyboard navigation: Arrow keys to navigate between filter chips
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const currentIndex = STATUS_FILTER_OPTIONS.indexOf(status);
                    const direction = e.key === 'ArrowRight' ? 1 : -1;
                    const nextIndex =
                      (currentIndex + direction + STATUS_FILTER_OPTIONS.length) %
                      STATUS_FILTER_OPTIONS.length;
                    const nextStatus = STATUS_FILTER_OPTIONS[nextIndex];
                    onStatusFilterChange(nextStatus);
                    // Focus the next button after state update
                    setTimeout(() => {
                      const buttons = Array.from(
                        e.currentTarget.parentElement?.querySelectorAll('button') || [],
                      );
                      const nextButton = buttons.find(
                        (btn) => btn.getAttribute('aria-pressed') === 'true',
                      );
                      nextButton?.focus();
                    }, 0);
                  }
                  // Home/End keys to jump to first/last
                  if (e.key === 'Home') {
                    e.preventDefault();
                    onStatusFilterChange(STATUS_FILTER_OPTIONS[0]);
                    setTimeout(() => {
                      const buttons = Array.from(
                        e.currentTarget.parentElement?.querySelectorAll('button') || [],
                      );
                      buttons[0]?.focus();
                    }, 0);
                  }
                  if (e.key === 'End') {
                    e.preventDefault();
                    const lastStatus = STATUS_FILTER_OPTIONS[STATUS_FILTER_OPTIONS.length - 1];
                    onStatusFilterChange(lastStatus);
                    setTimeout(() => {
                      const buttons = Array.from(
                        e.currentTarget.parentElement?.querySelectorAll('button') || [],
                      );
                      buttons[buttons.length - 1]?.focus();
                    }, 0);
                  }
                }}
                aria-pressed={statusFilter === status}
                aria-label={`${t('dashboard.filters.status.label')}: ${
                  status === 'all'
                    ? t('dashboard.filters.status.options.all')
                    : t(STATUS_LABEL_KEYS[status])
                }`}
                className={`touch-manipulation min-h-[44px] px-4 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  statusFilter === status
                    ? 'bg-primary text-primary-ink shadow-md ring-2 ring-primary/30 scale-105'
                    : 'bg-bg-muted text-fg border-2 border-border hover:border-primary/50 hover:bg-bg-muted/80'
                }`}
              >
                {status === 'all' ? (
                  <>
                    {t('dashboard.filters.status.options.all')} ({count})
                  </>
                ) : (
                  <>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === 'draft'
                          ? 'bg-warning'
                          : status === 'sent'
                            ? 'bg-primary'
                            : status === 'accepted'
                              ? 'bg-success'
                              : 'bg-danger'
                      }`}
                      aria-hidden="true"
                    />
                    {t(STATUS_LABEL_KEYS[status])} ({count})
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters & Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-4 sm:pt-5 border-t border-border/60">
          <div className="flex flex-wrap items-end gap-3 flex-1">
            {teamIds.length > 0 && (
              <Select
                label="Ajánlat szűrő"
                value={offerFilter}
                onChange={(e) => {
                  const value = e.target.value as OfferFilter;
                  onOfferFilterChange(value);
                  if (value !== 'member') {
                    onTeamMemberFilterChange([]);
                  }
                }}
                className="min-w-[180px]"
                wrapperClassName="flex-1 sm:flex-none"
              >
                <option value="all">Összes</option>
                <option value="my">Saját ajánlataim</option>
                <option value="team">Csapat ajánlatai</option>
                <option value="member">Csapat tag szerint</option>
              </Select>
            )}
            {offerFilter === 'member' && teamMembers.length > 0 && (
              <div className="flex-1 sm:flex-none min-w-[200px]">
                <label className="block text-xs font-semibold uppercase tracking-wide text-fg-muted mb-1.5">
                  Csapat tag
                </label>
                <Select
                  value={teamMemberFilter[0] || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      onTeamMemberFilterChange([value]);
                    } else {
                      onTeamMemberFilterChange([]);
                      onOfferFilterChange('all');
                    }
                  }}
                  className="w-full"
                >
                  <option value="">Válassz csapat tagot...</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.email || member.user_id}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Select
              label={t('dashboard.filters.sortBy.label')}
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value;
                if (isSortByValue(value)) onSortByChange(value);
              }}
              className="min-w-[160px]"
              wrapperClassName="flex-1 sm:flex-none"
            >
              <option value="created">{t('dashboard.filters.sortBy.options.created')}</option>
              <option value="status">{t('dashboard.filters.sortBy.options.status')}</option>
              <option value="title">{t('dashboard.filters.sortBy.options.title')}</option>
              <option value="recipient">{t('dashboard.filters.sortBy.options.recipient')}</option>
            </Select>
            <Select
              label={t('dashboard.filters.sortDir.label')}
              value={sortDir}
              onChange={(e) => {
                const value = e.target.value;
                if (isSortDirectionValue(value)) onSortDirChange(value);
              }}
              className="min-w-[140px]"
              wrapperClassName="flex-1 sm:flex-none"
            >
              <option value="desc">{t('dashboard.filters.sortDir.options.desc')}</option>
              <option value="asc">{t('dashboard.filters.sortDir.options.asc')}</option>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            {filteredCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="font-semibold text-fg">
                  {filteredCount.toLocaleString('hu-HU')}
                </span>
                <span className="text-fg-muted">{t('dashboard.filters.results')}</span>
              </div>
            )}
            <ViewSwitcher value={viewMode} onChange={onViewModeChange} />
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery.trim() || statusFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              {t('dashboard.filters.active')}:
            </span>
            {sanitizedQuery.trim() && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-fg">
                {t('dashboard.filters.search.label')}: &quot;{sanitizedQuery}&quot;
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="rounded-full hover:bg-border/60 p-0.5 transition"
                  aria-label={t('dashboard.filters.remove')}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-fg">
                {t('dashboard.filters.status.label')}: {t(STATUS_LABEL_KEYS[statusFilter])}
                <button
                  type="button"
                  onClick={() => onStatusFilterChange('all')}
                  className="rounded-full hover:bg-border/60 p-0.5 transition"
                  aria-label={t('dashboard.filters.remove')}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              {t('dashboard.filters.clearAll')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
