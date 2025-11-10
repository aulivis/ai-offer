'use client';

import { t } from '@/copy';
import Squares2X2Icon from '@heroicons/react/24/outline/Squares2X2Icon';
import ListBulletIcon from '@heroicons/react/24/outline/ListBulletIcon';

export type ViewMode = 'card' | 'list';

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-bg p-1 shadow-sm ${className ?? ''}`}
      role="group"
      aria-label={t('dashboard.viewSwitcher.label')}
    >
      <button
        type="button"
        onClick={() => onChange('card')}
        aria-pressed={value === 'card'}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          value === 'card'
            ? 'bg-primary text-primary-ink shadow-sm'
            : 'text-fg-muted hover:text-fg hover:bg-bg-muted'
        }`}
        aria-label={t('dashboard.viewSwitcher.cardView')}
      >
        <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t('dashboard.viewSwitcher.cardView')}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={value === 'list'}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          value === 'list'
            ? 'bg-primary text-primary-ink shadow-sm'
            : 'text-fg-muted hover:text-fg hover:bg-bg-muted'
        }`}
        aria-label={t('dashboard.viewSwitcher.listView')}
      >
        <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t('dashboard.viewSwitcher.listView')}</span>
      </button>
    </div>
  );
}