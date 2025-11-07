'use client';

import { t } from '@/copy';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useToast } from '@/components/ToastProvider';
import { LoadMoreButton, PAGE_SIZE, mergeOfferPages } from './offersPagination';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { currentMonthStart } from '@/lib/services/usage';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth } from '@/lib/api';
import OfferCard from '@/components/dashboard/OfferCard';
import { OfferListItem } from '@/components/dashboard/OfferListItem';
import { ViewSwitcher, type ViewMode } from '@/components/dashboard/ViewSwitcher';
import type { Offer } from '@/app/dashboard/types';
import { STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import { OfferCardSkeleton, MetricSkeleton } from '@/components/ui/Skeleton';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import DocumentCheckIcon from '@heroicons/react/24/outline/DocumentCheckIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import FunnelIcon from '@heroicons/react/24/outline/FunnelIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ArrowsPointingOutIcon from '@heroicons/react/24/outline/ArrowsPointingOutIcon';
import ArrowsPointingInIcon from '@heroicons/react/24/outline/ArrowsPointingInIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';

const STATUS_FILTER_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'lost'] as const;
type StatusFilterOption = (typeof STATUS_FILTER_OPTIONS)[number];
const SORT_BY_OPTIONS = ['created', 'status', 'title', 'recipient', 'industry'] as const;
type SortByOption = (typeof SORT_BY_OPTIONS)[number];
const SORT_DIRECTION_OPTIONS = ['desc', 'asc'] as const;
type SortDirectionOption = (typeof SORT_DIRECTION_OPTIONS)[number];

function isStatusFilterValue(value: string): value is StatusFilterOption {
  return (STATUS_FILTER_OPTIONS as readonly string[]).includes(value);
}
function isSortByValue(value: string): value is SortByOption {
  return (SORT_BY_OPTIONS as readonly string[]).includes(value);
}
function isSortDirectionValue(value: string): value is SortDirectionOption {
  return (SORT_DIRECTION_OPTIONS as readonly string[]).includes(value);
}

/** Enhanced KPI Card with modern design */
function MetricCard({
  label,
  value,
  helper,
  progress,
  icon,
  trend,
  trendValue,
  color = 'primary',
  onClick,
  quickAction,
  comparison,
  isEmpty = false,
  emptyMessage,
}: {
  label: string;
  value: string;
  helper?: ReactNode;
  progress?: { used: number; limit: number | null };
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  quickAction?: { label: string; onClick: () => void; icon?: ReactNode };
  comparison?: { label: string; value: string; trend: 'up' | 'down' | 'neutral' };
  isEmpty?: boolean;
  emptyMessage?: string;
}) {
  const progressPercentage =
    progress && progress.limit !== null
      ? Math.min((progress.used / progress.limit) * 100, 100)
      : null;

  const iconColors = {
    primary: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    info: 'text-blue-600',
  };

  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-fg-muted',
  };

  const isEmptyState = isEmpty && (value === '—' || value === '0' || !value);

  return (
    <Card 
      className={`group relative overflow-hidden p-5 sm:p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-primary/30' : 'hover:shadow-lg'
      } ${isEmptyState ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            {icon && (
              <div className={`flex-shrink-0 ${iconColors[color]} scale-90 sm:scale-100 mt-0.5`}>
                {icon}
              </div>
            )}
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-fg-muted leading-tight break-words min-w-0 flex-1">{label}</p>
          </div>
          {isEmptyState && emptyMessage ? (
            <div className="mt-2.5 sm:mt-3">
              <p className="text-base sm:text-lg font-semibold text-fg-muted">{value}</p>
              <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs leading-relaxed text-fg-muted break-words">{emptyMessage}</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 flex-wrap">
                <p className="text-2xl sm:text-3xl font-bold text-fg break-words">{value}</p>
                {trend && trendValue && (
                  <span className={`text-xs sm:text-sm font-semibold flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ${trendColors[trend]}`}>
                    {trend === 'up' ? (
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : trend === 'down' ? (
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                      </svg>
                    )}
                    {trendValue}
                  </span>
                )}
              </div>
              {comparison && (
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs flex-wrap">
                  <span className="text-fg-muted">{comparison.label}:</span>
                  <span className={`font-semibold flex items-center gap-0.5 sm:gap-1 ${
                    comparison.trend === 'up' ? 'text-emerald-600' :
                    comparison.trend === 'down' ? 'text-rose-600' :
                    'text-fg-muted'
                  }`}>
                    {comparison.trend === 'up' ? '↑' : comparison.trend === 'down' ? '↓' : '→'}
                    {comparison.value}
                  </span>
                </div>
              )}
              {progressPercentage !== null && progress && (
                <div className="mt-3 sm:mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="text-fg-muted">Használat</span>
                    <span className="font-semibold text-fg break-words">
                      {progress.used.toLocaleString('hu-HU')} / {progress.limit?.toLocaleString('hu-HU')}
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full rounded-full bg-border/60 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        progressPercentage >= 90
                          ? 'bg-danger'
                          : progressPercentage >= 75
                            ? 'bg-warning'
                            : 'bg-primary'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                      aria-label={`${progressPercentage.toFixed(0)}% used`}
                    />
                  </div>
                </div>
              )}
              {helper && <p className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs leading-relaxed text-fg-muted break-words hyphens-auto">{helper}</p>}
            </>
          )}
        </div>
        {quickAction && (
          <div className="flex-shrink-0 ml-1 sm:ml-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                quickAction.onClick();
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-border/60 bg-white/90 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-fg shadow-sm transition-colors hover:bg-primary/10 hover:border-primary/60 hover:text-primary"
              title={quickAction.label}
            >
              {quickAction.icon}
              <span className="hidden sm:inline">{quickAction.label}</span>
            </button>
          </div>
        )}
      </div>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      {onClick && (
        <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary/5 pointer-events-none" />
      )}
    </Card>
  );
}

type UsageQuotaSnapshot = {
  plan: SubscriptionPlan;
  limit: number | null;
  used: number;
  pending: number;
  devicePending: number | null;
  periodStart: string | null;
};

type UsageWithPendingResponse = {
  plan: SubscriptionPlan;
  limit: number | null;
  confirmed: number;
  pendingUser: number;
  pendingDevice: number | null;
  periodStart: string;
};

function isSubscriptionPlan(value: unknown): value is SubscriptionPlan {
  return value === 'free' || value === 'standard' || value === 'pro';
}

function parseUsageResponse(payload: unknown): UsageWithPendingResponse | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (!isSubscriptionPlan(record.plan)) {
    return null;
  }

  let limit: number | null = null;
  if (record.limit === null) {
    limit = null;
  } else if (record.limit !== undefined) {
    const numericLimit = Number(record.limit);
    if (Number.isFinite(numericLimit)) {
      limit = numericLimit;
    } else {
      return null;
    }
  }

  const confirmedValue = Number(record.confirmed);
  const confirmed = Number.isFinite(confirmedValue) ? confirmedValue : 0;

  const pendingUserValue = Number(record.pendingUser);
  const pendingUser = Number.isFinite(pendingUserValue) ? pendingUserValue : 0;

  let pendingDevice: number | null = null;
  if (record.pendingDevice === null) {
    pendingDevice = null;
  } else if (record.pendingDevice !== undefined) {
    const numericPendingDevice = Number(record.pendingDevice);
    if (Number.isFinite(numericPendingDevice)) {
      pendingDevice = numericPendingDevice;
    }
  }

  const periodStart = typeof record.periodStart === 'string' ? record.periodStart : '';

  if (!periodStart) {
    return null;
  }

  return {
    plan: record.plan,
    limit,
    confirmed,
    pendingUser,
    pendingDevice,
    periodStart,
  };
}

function parsePeriodStart(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function getDeviceIdFromCookie(name = 'propono_device_id'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const rawCookie = document.cookie;
  if (!rawCookie) {
    return null;
  }

  const parts = rawCookie.split(';');
  for (const part of parts) {
    const [cookieName, ...rest] = part.trim().split('=');
    if (cookieName === name) {
      const value = rest.join('=');
      if (!value) {
        return null;
      }
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

function computeNextResetDate(periodStart: string | null | undefined): Date | null {
  const parsed = parsePeriodStart(periodStart);
  if (!parsed) {
    return null;
  }

  const next = new Date(parsed);
  next.setHours(0, 0, 0, 0);
  next.setMonth(next.getMonth() + 1, 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (next <= today) {
    next.setMonth(next.getMonth() + 1, 1);
  }

  return next;
}

function hasAdminFlag(value: unknown): boolean {
  if (value === true) {
    return true;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'admin';
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasAdminFlag(entry));
  }
  return false;
}

function createOfferPdfFileName(offer: Offer): string {
  const base = (offer.title || '').trim().toLowerCase();
  const normalized = base
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  const safeBase = normalized || 'ajanlat';
  return `${safeBase}.pdf`;
}

/** Törlés megerősítése (dialog) — semantic + A11y */
function DeleteConfirmationDialog({
  offer,
  onCancel,
  onConfirm,
  isDeleting,
}: {
  offer: Offer | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const open = Boolean(offer);
  const labelId = open ? `delete-offer-title-${offer!.id}` : undefined;
  const descriptionId = open ? `delete-offer-description-${offer!.id}` : undefined;

  const handleClose = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      {...(labelId ? { labelledBy: labelId } : {})}
      {...(descriptionId ? { describedBy: descriptionId } : {})}
    >
      {open && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
              {t('dashboard.deleteModal.badge')}
            </div>
            <h2 id={labelId} className="text-lg font-semibold text-fg">
              {t('dashboard.deleteModal.title')}
            </h2>
            <p id={descriptionId} className="text-sm leading-6 text-fg-muted">
              {t('dashboard.deleteModal.description', {
                title: offer!.title || t('dashboard.deleteModal.untitled'),
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('dashboard.deleteModal.cancel')}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:brightness-95"
            >
              {isDeleting
                ? t('dashboard.deleteModal.deleting')
                : t('dashboard.deleteModal.confirm')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const sb = useSupabase();
  const router = useRouter();
  const { status: authStatus, user } = useRequireAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [quotaSnapshot, setQuotaSnapshot] = useState<UsageQuotaSnapshot | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByOption>('created');
  const [sortDir, setSortDir] = useState<SortDirectionOption>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-view-mode');
      return (saved === 'list' || saved === 'card' ? saved : 'card') as ViewMode;
    }
    return 'card';
  });
  const [metricsViewMode, setMetricsViewMode] = useState<'detailed' | 'compact'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-metrics-view-mode');
      return (saved === 'compact' || saved === 'detailed' ? saved : 'detailed') as 'detailed' | 'compact';
    }
    return 'detailed';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-view-mode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-metrics-view-mode', metricsViewMode);
    }
  }, [metricsViewMode]);

  const isAdmin = useMemo(() => {
    if (!user) {
      return false;
    }

    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;

    return (
      hasAdminFlag(appMeta.role) ||
      hasAdminFlag(appMeta.roles) ||
      hasAdminFlag(appMeta.is_admin) ||
      hasAdminFlag(userMeta.role) ||
      hasAdminFlag(userMeta.roles) ||
      hasAdminFlag(userMeta.is_admin)
    );
  }, [user]);

  const fetchPage = useCallback(
    async (user: string, pageNumber: number): Promise<{ items: Offer[]; count: number | null }> => {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      // Ensure session is initialized from cookies before querying
      // This is critical for custom cookie-based auth (propono_at, propono_rt)
      // Pass the expected user ID to validate the session matches
      // Use more aggressive retry settings for dashboard queries (post-OAuth scenarios)
      try {
        const { ensureSession } = await import('@/lib/supabaseClient');
        await ensureSession(user, {
          maxRetries: 8, // More retries for dashboard (may be loaded right after OAuth)
          initialDelay: 150, // Slightly longer initial delay
          maxDelay: 3000, // Longer max delay for post-OAuth scenarios
        });
      } catch (error) {
        console.error('Failed to ensure Supabase session', error);
        // If session initialization fails, provide user-friendly error
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Session initialization failed';
        
        // Show user-friendly toast and throw error
        showToast({
          title: t('errors.auth.sessionFailed'),
          description: errorMessage,
          variant: 'error',
        });
        
        throw new Error(errorMessage);
      }
      
      // Verify the session one more time before querying
      // Give it a moment for the session to fully propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: { session }, error: sessionError } = await sb.auth.getSession();
      const sessionMatches = session?.user?.id === user;
      
      console.log('Dashboard auth session check', {
        userId: user,
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionError,
        matchesUserId: sessionMatches,
      });
      
      // If session doesn't match after ensureSession, this is unexpected
      // ensureSession should have thrown an error already, but check anyway
      if (!sessionMatches) {
        console.error('Session verification failed after ensureSession', {
          expectedUserId: user,
          sessionUserId: session?.user?.id,
        });
        
        // Show user-friendly error
        showToast({
          title: t('errors.auth.sessionVerificationFailed'),
          description: t('errors.auth.sessionVerificationFailedDescription'),
          variant: 'error',
        });
        
        throw new Error('Session verification failed. Please refresh the page.');
      }
      
      // First, try a simple query without the join to see if that's the issue
      const { data: simpleData, error: simpleError, count: simpleCount } = await sb
        .from('offers')
        .select('id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id', { count: 'exact' })
        .eq('user_id', user)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      console.log('Dashboard simple query (no join)', {
        userId: user,
        pageNumber,
        count: simpleCount,
        itemsCount: Array.isArray(simpleData) ? simpleData.length : 0,
        error: simpleError,
        errorMessage: simpleError?.message,
        errorCode: simpleError?.code,
        errorDetails: simpleError?.details,
        offerIds: Array.isArray(simpleData) ? simpleData.map((item: { id?: string }) => item.id).slice(0, 5) : [],
      });
      
      // Now try with the join
      const { data, error, count } = await sb
        .from('offers')
        .select(
          'id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )',
          { count: 'exact' },
        )
        .eq('user_id', user)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Dashboard fetch error (with join)', {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
        });
        // If join fails, fall back to simple query
        if (simpleError) {
          throw simpleError;
        }
        // Use simple data if join failed but simple query succeeded
        const finalData = simpleData;
        const finalCount = simpleCount;
        console.log('Using simple query results due to join error', {
          itemsCount: Array.isArray(finalData) ? finalData.length : 0,
        });
        
        const rawItems = Array.isArray(finalData) ? finalData : [];
        const items: Offer[] = rawItems.map((entry) => ({
          id: String(entry.id),
          title: typeof entry.title === 'string' ? entry.title : '',
          industry: typeof entry.industry === 'string' ? entry.industry : '',
          status: (entry.status ?? 'draft') as Offer['status'],
          created_at: entry.created_at ?? null,
          sent_at: entry.sent_at ?? null,
          decided_at: entry.decided_at ?? null,
          decision: (entry.decision ?? null) as Offer['decision'],
          pdf_url: entry.pdf_url ?? null,
          recipient_id: entry.recipient_id ?? null,
          recipient: null, // No recipient data due to join failure
        }));
        
        return {
          items,
          count: typeof finalCount === 'number' ? finalCount : null,
        };
      }

      console.log('Dashboard fetched offers', {
        userId: user,
        pageNumber,
        count,
        itemsCount: Array.isArray(data) ? data.length : 0,
        offersWithPdf: Array.isArray(data) ? data.filter((item: { pdf_url?: string | null }) => item.pdf_url).length : 0,
        offerIds: Array.isArray(data) ? data.map((item: { id?: string }) => item.id).slice(0, 5) : [],
        offersWithPdfIds: Array.isArray(data) 
          ? data.filter((item: { pdf_url?: string | null }) => item.pdf_url).map((item: { id?: string }) => item.id)
          : [],
      });

      const rawItems = Array.isArray(data) ? data : [];
      const items: Offer[] = rawItems.map((entry) => {
        const recipientValue = Array.isArray(entry.recipient)
          ? (entry.recipient[0] ?? null)
          : (entry.recipient ?? null);

        return {
          id: String(entry.id),
          title: typeof entry.title === 'string' ? entry.title : '',
          industry: typeof entry.industry === 'string' ? entry.industry : '',
          status: (entry.status ?? 'draft') as Offer['status'],
          created_at: entry.created_at ?? null,
          sent_at: entry.sent_at ?? null,
          decided_at: entry.decided_at ?? null,
          decision: (entry.decision ?? null) as Offer['decision'],
          pdf_url: entry.pdf_url ?? null,
          recipient_id: entry.recipient_id ?? null,
          recipient: recipientValue,
        };
      });

      return {
        items,
        count: typeof count === 'number' ? count : null,
      };
    },
    [sb],
  );

  useEffect(() => {
    let active = true;
    if (authStatus !== 'authenticated' || !user) {
      return () => {
        active = false;
      };
    }

    const loadInitialPage = async () => {
      setLoading(true);
      try {
        setUserId(user.id);
        const { items, count } = await fetchPage(user.id, 0);
        if (!active) return;
        setOffers(items);
        setPageIndex(0);
        setTotalCount(count);
      } catch (error) {
        console.error('Failed to load offers', error);
        const message =
          error instanceof Error ? error.message : t('toasts.offers.loadFailed.description');
        showToast({
          title: t('toasts.offers.loadFailed.title'),
          description: message || t('toasts.offers.loadFailed.description'),
          variant: 'error',
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialPage();
    
    // Refresh offers when page becomes visible (e.g., after redirect from offer creation)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        loadInitialPage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh after a short delay to catch any updates that happened during redirect
    const refreshTimeout = setTimeout(() => {
      if (active) {
        loadInitialPage();
      }
    }, 2000);
    
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(refreshTimeout);
    };
  }, [authStatus, fetchPage, showToast, sb, user]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsQuotaLoading(false);
      return;
    }

    let active = true;
    setIsQuotaLoading(true);

    (async () => {
      try {
        const deviceId = getDeviceIdFromCookie();
        const { iso: expectedPeriod } = currentMonthStart();
        const params = new URLSearchParams({ period_start: expectedPeriod });
        if (deviceId) {
          params.set('device_id', deviceId);
        }

        const response = await fetchWithSupabaseAuth(
          `/api/usage/with-pending?${params.toString()}`,
          { method: 'GET', defaultErrorMessage: t('errors.requestFailed') },
        );

        if (!active) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as unknown;
        const usageData = parseUsageResponse(payload);

        if (!usageData) {
          throw new Error('Invalid usage response payload.');
        }

        const normalizedDevicePending = deviceId
          ? typeof usageData.pendingDevice === 'number'
            ? usageData.pendingDevice
            : 0
          : usageData.pendingDevice;

        setQuotaSnapshot({
          plan: usageData.plan,
          limit: usageData.limit,
          used: usageData.confirmed,
          pending: usageData.pendingUser,
          devicePending: normalizedDevicePending,
          periodStart: usageData.periodStart,
        });
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load usage quota.', error);
        setQuotaSnapshot(null);
      } finally {
        if (active) {
          setIsQuotaLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authStatus, user]);

  const hasMore = totalCount !== null ? offers.length < totalCount : false;

  const handleLoadMore = useCallback(async () => {
    if (!userId || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = pageIndex + 1;
      const { items, count } = await fetchPage(userId, nextPage);
      setOffers((prev) => mergeOfferPages(prev, items));
      if (count !== null) setTotalCount(count);
      setPageIndex(nextPage);
    } catch (error) {
      console.error('Failed to load offers', error);
      const message =
        error instanceof Error ? error.message : t('toasts.offers.loadMoreFailed.description');
      showToast({
        title: t('toasts.offers.loadMoreFailed.title'),
        description: message || t('toasts.offers.loadMoreFailed.description'),
        variant: 'error',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoadingMore, pageIndex, showToast, userId]);

  const industries = useMemo(() => {
    const s = new Set<string>();
    offers.forEach((o) => {
      if (o.industry) s.add(o.industry);
    });
    return Array.from(s).sort();
  }, [offers]);

  async function applyPatch(offer: Offer, patch: Partial<Offer>) {
    setUpdatingId(offer.id);
    try {
      const { error } = await sb.from('offers').update(patch).eq('id', offer.id);
      if (error) throw error;
      setOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, ...patch } : item)),
      );
    } catch (error) {
      console.error('Offer status update failed', error);
      const message =
        error instanceof Error ? error.message : t('toasts.offers.statusUpdateFailed.description');
      showToast({
        title: t('toasts.offers.statusUpdateFailed.title'),
        description: message || t('toasts.offers.statusUpdateFailed.description'),
        variant: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const handleDownloadPdf = useCallback(
    async (offer: Offer) => {
      if (!offer.pdf_url) return;

      setDownloadingId(offer.id);
      try {
        const response = await fetch(offer.pdf_url, { credentials: 'include' });
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = createOfferPdfFileName(offer);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Failed to download offer PDF', error);
        showToast({
          title: t('toasts.offers.downloadFailed.title'),
          description: t('toasts.offers.downloadFailed.description'),
          variant: 'error',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [showToast],
  );

  async function markSent(offer: Offer, date?: string) {
    const timestamp = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Number.isNaN(timestamp.getTime())) return;
    const patch: Partial<Offer> = {
      sent_at: timestamp.toISOString(),
      status: offer.status === 'draft' ? 'sent' : offer.status,
    };
    if (offer.status === 'draft') {
      patch.decision = null;
      patch.decided_at = null;
    }
    await applyPatch(offer, patch);
  }

  async function markDecision(offer: Offer, decision: 'accepted' | 'lost', date?: string) {
    const timestamp = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Number.isNaN(timestamp.getTime())) return;
    const patch: Partial<Offer> = {
      status: decision,
      decision,
      decided_at: timestamp.toISOString(),
    };
    if (!offer.sent_at) patch.sent_at = timestamp.toISOString();
    await applyPatch(offer, patch);
  }

  async function revertToSent(offer: Offer) {
    const patch: Partial<Offer> = { status: 'sent', decision: null, decided_at: null };
    if (!offer.sent_at) patch.sent_at = new Date().toISOString();
    await applyPatch(offer, patch);
  }

  async function revertToDraft(offer: Offer) {
    const patch: Partial<Offer> = {
      status: 'draft',
      sent_at: null,
      decided_at: null,
      decision: null,
    };
    await applyPatch(offer, patch);
  }

  const confirmDeleteOffer = useCallback(async () => {
    if (!offerToDelete) return;

    setDeletingId(offerToDelete.id);
    try {
      await fetchWithSupabaseAuth(`/api/offers/${offerToDelete.id}`, {
        method: 'DELETE',
        defaultErrorMessage: t('toasts.offers.deleteFailed.description'),
      });

      setOffers((prev) => prev.filter((item) => item.id !== offerToDelete.id));
      setTotalCount((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));
      showToast({
        title: t('toasts.offers.deleteSuccess.title'),
        description: t('toasts.offers.deleteSuccess.description'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete offer', error);
      const message =
        error instanceof Error ? error.message : t('toasts.offers.deleteFailed.description');
      showToast({
        title: t('toasts.offers.deleteFailed.title'),
        description: message || t('toasts.offers.deleteFailed.description'),
        variant: 'error',
      });
    } finally {
      setDeletingId(null);
      setOfferToDelete(null);
    }
  }, [offerToDelete, showToast]);

  const handleCancelDelete = useCallback(() => {
    if (deletingId) return;
    setOfferToDelete(null);
  }, [deletingId]);

  useEffect(() => {
    if (!offerToDelete) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!deletingId) setOfferToDelete(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [offerToDelete, deletingId]);

  /** Szűrés + rendezés (változatlan logika) */
  const filtered = useMemo(() => {
    let list = offers.slice();

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (o) =>
          o.title?.toLowerCase().includes(t) ||
          (o.recipient?.company_name || '').toLowerCase().includes(t),
      );
    }

    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (industryFilter !== 'all') list = list.filter((o) => o.industry === industryFilter);

    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'status':
          return dir * a.status.localeCompare(b.status);
        case 'title':
          return dir * (a.title || '').localeCompare(b.title || '');
        case 'recipient':
          return (
            dir * (a.recipient?.company_name || '').localeCompare(b.recipient?.company_name || '')
          );
        case 'industry':
          return dir * (a.industry || '').localeCompare(b.industry || '');
        case 'created':
        default:
          return (
            dir * (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
          );
      }
    });

    return list;
  }, [offers, q, statusFilter, industryFilter, sortBy, sortDir]);

  /** Metrikák (enhanced with previous period comparison) */
  const stats = useMemo(() => {
    const total = offers.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = monthStart - 1;

    // Current period stats
    const createdThisMonth = offers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= monthStart;
    }).length;

    // Previous period stats
    const createdLastMonth = offers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= lastMonthStart && created < monthStart;
    }).length;

    const sentStatuses: Offer['status'][] = ['sent', 'accepted', 'lost'];
    const sent = offers.filter((offer) => sentStatuses.includes(offer.status)).length;
    const accepted = offers.filter((offer) => offer.status === 'accepted').length;
    const lost = offers.filter((offer) => offer.status === 'lost').length;
    const inReview = offers.filter((offer) => offer.status === 'sent').length;
    const drafts = offers.filter((offer) => offer.status === 'draft').length;

    const acceptanceRate = sent > 0 ? (accepted / sent) * 100 : null;
    const winRate = (accepted + lost) > 0 ? (accepted / (accepted + lost)) * 100 : null;

    const decisionDurations: number[] = [];
    offers.forEach((offer) => {
      if (offer.status !== 'accepted' || !offer.decided_at) return;
      const decided = new Date(offer.decided_at).getTime();
      const sentAt = offer.sent_at
        ? new Date(offer.sent_at).getTime()
        : offer.created_at
          ? new Date(offer.created_at).getTime()
          : NaN;
      if (!Number.isFinite(decided) || !Number.isFinite(sentAt)) return;
      const diffDays = (decided - sentAt) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) decisionDurations.push(diffDays);
    });
    const avgDecisionDays = decisionDurations.length
      ? decisionDurations.reduce((sum, value) => sum + value, 0) / decisionDurations.length
      : null;

    return {
      total,
      sent,
      accepted,
      lost,
      inReview,
      drafts,
      acceptanceRate,
      winRate,
      avgDecisionDays,
      createdThisMonth,
      createdLastMonth,
    };
  }, [offers]);

  /** Realtime frissítések (változatlan logika) */
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return;

    const channel = sb
      .channel(`offers-updates-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'offers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Partial<Offer> & { id?: string };
          if (!updated || typeof updated.id !== 'string') return;
          
          // Log all updates for debugging
          console.log('Offer updated via realtime subscription', {
            offerId: updated.id,
            updatedFields: Object.keys(updated),
            pdfUrl: updated.pdf_url,
            oldPdfUrl: payload.old ? (payload.old as { pdf_url?: string | null }).pdf_url : null,
          });
          
          // Log PDF URL updates specifically
          if (updated.pdf_url && payload.old && (payload.old as { pdf_url?: string | null }).pdf_url !== updated.pdf_url) {
            console.log('Offer PDF URL updated via realtime', {
              offerId: updated.id,
              oldPdfUrl: (payload.old as { pdf_url?: string | null }).pdf_url,
              newPdfUrl: updated.pdf_url,
            });
          }
          
          setOffers((prev) => {
            let didChange = false;
            const next = prev.map((item) => {
              if (item.id !== updated.id) return item;
              didChange = true;
              const recipientValue =
                updated.recipient !== undefined
                  ? Array.isArray(updated.recipient)
                    ? (updated.recipient[0] ?? null)
                    : (updated.recipient ?? null)
                  : (item.recipient ?? null);

              return { ...item, ...updated, recipient: recipientValue };
            });
            return didChange ? next : prev;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'offers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const inserted = payload.new as Partial<Offer> & { id?: string };
          if (!inserted || typeof inserted.id !== 'string') return;
          
          console.log('New offer inserted via realtime', {
            offerId: inserted.id,
            pdfUrl: inserted.pdf_url,
            title: inserted.title,
            fullPayload: payload,
          });
          
          // Add new offer to the beginning of the list if it's not already there
          setOffers((prev) => {
            const exists = prev.some((item) => item.id === inserted.id);
            if (exists) return prev;
            
            const recipientValue =
              inserted.recipient !== undefined
                ? Array.isArray(inserted.recipient)
                  ? (inserted.recipient[0] ?? null)
                  : (inserted.recipient ?? null)
                : null;
            
            const newOffer: Offer = {
              id: String(inserted.id),
              title: typeof inserted.title === 'string' ? inserted.title : '',
              industry: typeof inserted.industry === 'string' ? inserted.industry : '',
              status: (inserted.status ?? 'draft') as Offer['status'],
              created_at: inserted.created_at ?? null,
              sent_at: inserted.sent_at ?? null,
              decided_at: inserted.decided_at ?? null,
              decision: (inserted.decision ?? null) as Offer['decision'],
              pdf_url: inserted.pdf_url ?? null,
              recipient_id: inserted.recipient_id ?? null,
              recipient: recipientValue,
            };
            
            // Add to beginning and update count
            setTotalCount((prevCount) =>
              typeof prevCount === 'number' ? prevCount + 1 : null,
            );
            
            return [newOffer, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'offers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const removed = payload.old as { id?: string } | null;
          if (!removed || typeof removed.id !== 'string') return;
          setOffers((prev) => {
            const next = prev.filter((item) => item.id !== removed.id);
            if (next.length !== prev.length) {
              setTotalCount((prevCount) =>
                typeof prevCount === 'number' ? Math.max(prevCount - 1, 0) : prevCount,
              );
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [authStatus, sb, user]);

  const quotaResetLabel = useMemo(() => {
    if (!quotaSnapshot?.periodStart) {
      return null;
    }
    const reset = computeNextResetDate(quotaSnapshot.periodStart);
    if (!reset) {
      return null;
    }
    return reset.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [quotaSnapshot?.periodStart]);

  const quotaValue = useMemo(() => {
    if (isQuotaLoading) {
      return t('dashboard.metrics.quota.loading');
    }
    if (!quotaSnapshot) {
      return '—';
    }
    // Always determine limit based on plan, not API response
    // This ensures correct display even if API returns wrong limit value
    let displayLimit: number | null = null;
    if (quotaSnapshot.plan === 'pro') {
      displayLimit = null; // Unlimited for pro
    } else if (quotaSnapshot.plan === 'standard') {
      displayLimit = 5;
    } else {
      displayLimit = 2; // Free plan
    }
    
    if (displayLimit === null) {
      return t('dashboard.metrics.quota.unlimitedValue');
    }
    const pendingTotal = Math.max(0, quotaSnapshot.pending);
    const remaining = Math.max(displayLimit - (quotaSnapshot.used + pendingTotal), 0);
    return t('dashboard.metrics.quota.value', {
      remaining: remaining.toLocaleString('hu-HU'),
      limit: displayLimit.toLocaleString('hu-HU'),
    });
  }, [isQuotaLoading, quotaSnapshot]);

  const quotaHelper = useMemo(() => {
    if (isQuotaLoading || !quotaSnapshot) {
      return undefined;
    }
    // Always determine limit based on plan, not API response
    let displayLimit: number | null = null;
    if (quotaSnapshot.plan === 'pro') {
      displayLimit = null; // Unlimited for pro
    } else if (quotaSnapshot.plan === 'standard') {
      displayLimit = 5;
    } else {
      displayLimit = 2; // Free plan
    }
    // For unlimited plans, show only the plan info
    if (displayLimit === null) {
      return t('dashboard.metrics.quota.helperUnlimited', {
        confirmed: quotaSnapshot.used.toLocaleString('hu-HU'),
        pending: quotaSnapshot.pending.toLocaleString('hu-HU'),
      });
    }
    // For limited plans, show reset date if available
    if (quotaResetLabel) {
      const remaining = displayLimit - quotaSnapshot.used - quotaSnapshot.pending;
      return t('dashboard.metrics.quota.helperLimitedWithReset', {
        confirmed: quotaSnapshot.used.toLocaleString('hu-HU'),
        pending: quotaSnapshot.pending.toLocaleString('hu-HU'),
        remaining: remaining.toLocaleString('hu-HU'),
        resetDate: quotaResetLabel,
      });
    }
    return undefined;
  }, [isQuotaLoading, quotaResetLabel, quotaSnapshot, t]);

  /** Derived UI szövegek */
  const acceptanceLabel =
    stats.acceptanceRate !== null
      ? `${stats.acceptanceRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
      : '—';
  const winRateLabel =
    stats.winRate !== null
      ? `${stats.winRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
      : '—';
  const avgDecisionLabel =
    stats.avgDecisionDays !== null
      ? `${stats.avgDecisionDays.toLocaleString('hu-HU', { maximumFractionDigits: 1 })} nap`
      : '—';
  const totalOffersCount = totalCount ?? stats.total;
  const displayedCount = totalCount !== null ? Math.min(offers.length, totalCount) : offers.length;
  const monthlyHelper = t('dashboard.metrics.created.monthlyHelper', {
    count: stats.createdThisMonth.toLocaleString('hu-HU'),
  });
  const totalHelper =
    totalCount !== null
      ? t('dashboard.metrics.created.totalHelper', {
          displayed: displayedCount.toLocaleString('hu-HU'),
          total: totalCount.toLocaleString('hu-HU'),
          monthly: monthlyHelper,
        })
      : monthlyHelper;

  // Comparison calculations
  const createdComparison = stats.createdLastMonth > 0
    ? {
        label: 'Előző hónap',
        value: stats.createdLastMonth.toLocaleString('hu-HU'),
        trend: stats.createdThisMonth > stats.createdLastMonth ? 'up' as const :
               stats.createdThisMonth < stats.createdLastMonth ? 'down' as const : 'neutral' as const,
      }
    : undefined;

  // Click handlers for filtering
  const handleMetricClick = useCallback((filterStatus: StatusFilterOption) => {
    setStatusFilter(filterStatus);
    // Scroll to offers section
    setTimeout(() => {
      const offersSection = document.querySelector('[data-offers-section]');
      if (offersSection) {
        offersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const paginationSummary =
    totalCount !== null
      ? t('dashboard.pagination.summary', {
          displayed: displayedCount.toLocaleString('hu-HU'),
          total: totalCount.toLocaleString('hu-HU'),
        })
      : null;
  const currentPage = pageIndex + 1;
  const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;
  const noOffersLoaded = !loading && offers.length === 0;
  const emptyMessage = noOffersLoaded
    ? t('dashboard.emptyStates.noOffers')
    : t('dashboard.emptyStates.noResults');

  return (
    <>
      <AppFrame
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            {isAdmin ? (
              <Link
                href="/dashboard/telemetry"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-5 py-2 text-sm font-semibold text-fg transition hover:border-fg hover:bg-bg/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('dashboard.actions.templateTelemetry')}
              </Link>
            ) : null}
            <Link
              href="/new"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t('dashboard.actions.newOffer')}
            </Link>
          </div>
        }
      >
        {/* Enhanced KPI Dashboard with Visual Funnel */}
        <div className="space-y-6 pb-8 border-b border-border/40">
          {/* Header with View Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg">Teljesítmény mutatók</h2>
              <p className="text-sm text-fg-muted mt-1">Kattints egy metrikára a szűréshez</p>
            </div>
            <button
              type="button"
              onClick={() => setMetricsViewMode(metricsViewMode === 'compact' ? 'detailed' : 'compact')}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg hover:bg-bg/80"
              title={metricsViewMode === 'compact' ? 'Részletes nézet' : 'Kompakt nézet'}
            >
              {metricsViewMode === 'compact' ? (
                <>
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Részletes</span>
                </>
              ) : (
                <>
                  <ArrowsPointingInIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Kompakt</span>
                </>
              )}
            </button>
          </div>

          {/* Conversion Funnel Group */}
          <div className="relative">
            {/* Funnel visualization line */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />
            
            <div className={`grid gap-3 sm:gap-4 ${
              metricsViewMode === 'compact' 
                ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'
            }`}>
              {loading ? (
                <>
                  {Array.from({ length: metricsViewMode === 'compact' ? 7 : 7 }).map((_, i) => (
                    <MetricSkeleton key={i} />
                  ))}
                </>
              ) : (
                <>
                  {/* Quota Card */}
                  <MetricCard
                    label={t('dashboard.metrics.quota.label')}
                    value={quotaValue}
                    {...(quotaHelper && metricsViewMode === 'detailed' ? { helper: quotaHelper } : {})}
                    {...(quotaSnapshot && quotaSnapshot.plan !== 'pro'
                      ? {
                          progress: {
                            used: quotaSnapshot.used + quotaSnapshot.pending,
                            limit: quotaSnapshot.plan === 'standard' ? 5 : 2,
                          },
                        }
                      : {})}
                    icon={<ChartBarIcon className="h-7 w-7" />}
                    color="info"
                    isEmpty={totalOffersCount === 0}
                    emptyMessage={t('dashboard.emptyStates.noOffersMessage')}
                  />

                  {/* Created Offers - Funnel Start */}
                  <MetricCard
                    label={t('dashboard.metrics.created.label')}
                    value={totalOffersCount.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: totalHelper } : {})}
                    icon={<DocumentTextIcon className="h-7 w-7" />}
                    color="primary"
                    trend={stats.createdThisMonth > 0 ? 'up' : stats.createdThisMonth === 0 && stats.createdLastMonth > 0 ? 'down' : 'neutral'}
                    {...(stats.createdThisMonth > 0 ? { trendValue: `+${stats.createdThisMonth}` } : {})}
                    {...(createdComparison ? { comparison: createdComparison } : {})}
                    onClick={() => handleMetricClick('all')}
                    isEmpty={totalOffersCount === 0}
                    emptyMessage="Még nincs ajánlatod"
                  />

                  {/* Active Offers (In Review) */}
                  <MetricCard
                    label="Döntésre vár"
                    value={stats.inReview.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: `${stats.inReview} ajánlat döntésre vár` } : {})}
                    icon={<EyeIcon className="h-7 w-7" />}
                    color="info"
                    onClick={() => handleMetricClick('sent')}
                    isEmpty={stats.inReview === 0}
                    emptyMessage="Nincs döntésre váró ajánlat"
                  />

                  {/* Sent Offers */}
                  <MetricCard
                    label={t('dashboard.metrics.sent.label')}
                    value={stats.sent.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: t('dashboard.metrics.sent.helper', {
                      pending: stats.inReview.toLocaleString('hu-HU'),
                    }) } : {})}
                    icon={<PaperAirplaneIcon className="h-7 w-7" />}
                    color="info"
                    onClick={() => handleMetricClick('sent')}
                    isEmpty={stats.sent === 0}
                    emptyMessage="Még nem küldtél el ajánlatot"
                  />

                  {/* Accepted Offers */}
                  <MetricCard
                    label={t('dashboard.metrics.accepted.label')}
                    value={stats.accepted.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: t('dashboard.metrics.accepted.helper', { rate: acceptanceLabel }) } : {})}
                    icon={<DocumentCheckIcon className="h-7 w-7" />}
                    color="success"
                    trend={stats.acceptanceRate !== null && stats.acceptanceRate > 50 ? 'up' : stats.acceptanceRate !== null && stats.acceptanceRate < 30 ? 'down' : 'neutral'}
                    {...(acceptanceLabel !== '—' ? { trendValue: acceptanceLabel } : {})}
                    onClick={() => handleMetricClick('accepted')}
                    isEmpty={stats.accepted === 0}
                    emptyMessage="Még nincs elfogadott ajánlatod"
                  />

                  {/* Lost Offers - NEW */}
                  <MetricCard
                    label="Elutasított ajánlatok"
                    value={stats.lost.toLocaleString('hu-HU')}
                    {...(metricsViewMode === 'detailed' ? { helper: `${stats.lost} ajánlat elutasítva` } : {})}
                    icon={<XCircleIcon className="h-7 w-7" />}
                    color="danger"
                    onClick={() => handleMetricClick('lost')}
                    isEmpty={stats.lost === 0}
                    emptyMessage="Nincs elutasított ajánlat"
                  />

                  {/* Win Rate - NEW */}
                  <MetricCard
                    label="Sikeres arány"
                    value={winRateLabel}
                    {...(metricsViewMode === 'detailed' ? { helper: `Elfogadott / (Elfogadott + Elutasított)` } : {})}
                    icon={<ChartBarIcon className="h-7 w-7" />}
                    color={stats.winRate !== null && stats.winRate > 50 ? 'success' : stats.winRate !== null && stats.winRate < 30 ? 'danger' : 'warning'}
                    trend={stats.winRate !== null && stats.winRate > 50 ? 'up' : stats.winRate !== null && stats.winRate < 30 ? 'down' : 'neutral'}
                    {...(winRateLabel !== '—' ? { trendValue: winRateLabel } : {})}
                    isEmpty={stats.winRate === null}
                    emptyMessage="Nincs elég adat a számításhoz"
                  />

                  {/* Average Decision Time */}
                  <MetricCard
                    label={t('dashboard.metrics.avgDecision.label')}
                    value={avgDecisionLabel}
                    {...(metricsViewMode === 'detailed' ? { helper: t('dashboard.metrics.avgDecision.helper', {
                      drafts: stats.drafts.toLocaleString('hu-HU'),
                    }) } : {})}
                    icon={<ClockIcon className="h-7 w-7" />}
                    color="warning"
                    isEmpty={stats.avgDecisionDays === null}
                    emptyMessage="Nincs elég adat a számításhoz"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search & Filters */}
        <Card as="section" className="mb-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-fg-muted" aria-hidden="true" />
              </div>
              <Input
                placeholder={t('dashboard.filters.search.placeholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-11 pr-4 py-3 text-base shadow-sm"
                wrapperClassName=""
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-fg-muted hover:text-fg transition-colors"
                  aria-label={t('dashboard.filters.remove')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted flex items-center gap-2">
                <FunnelIcon className="h-4 w-4" />
                {t('dashboard.filters.status.label')}:
              </span>
              {STATUS_FILTER_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-primary text-primary-ink shadow-md scale-105'
                      : 'bg-bg-muted text-fg-muted hover:bg-bg hover:text-fg border border-border/60'
                  }`}
                >
                  {status === 'all' ? (
                    t('dashboard.filters.status.options.all')
                  ) : (
                    <>
                      <span className={`h-2 w-2 rounded-full ${
                        status === 'draft' ? 'bg-amber-500' :
                        status === 'sent' ? 'bg-blue-500' :
                        status === 'accepted' ? 'bg-emerald-500' :
                        'bg-rose-500'
                      }`} />
                      {t(STATUS_LABEL_KEYS[status])}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Advanced Filters & Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-4 border-t border-border/60">
              <div className="flex flex-wrap items-end gap-3 flex-1">
                {industries.length > 0 && (
                  <Select
                    label={t('dashboard.filters.industry.label')}
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="min-w-[180px]"
                    wrapperClassName="flex-1 sm:flex-none"
                  >
                    <option value="all">{t('dashboard.filters.industry.options.all')}</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </Select>
                )}
                <Select
                  label={t('dashboard.filters.sortBy.label')}
                  value={sortBy}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isSortByValue(value)) setSortBy(value);
                  }}
                  className="min-w-[160px]"
                  wrapperClassName="flex-1 sm:flex-none"
                >
                  <option value="created">{t('dashboard.filters.sortBy.options.created')}</option>
                  <option value="status">{t('dashboard.filters.sortBy.options.status')}</option>
                  <option value="title">{t('dashboard.filters.sortBy.options.title')}</option>
                  <option value="recipient">{t('dashboard.filters.sortBy.options.recipient')}</option>
                  <option value="industry">{t('dashboard.filters.sortBy.options.industry')}</option>
                </Select>
                <Select
                  label={t('dashboard.filters.sortDir.label')}
                  value={sortDir}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isSortDirectionValue(value)) setSortDir(value);
                  }}
                  className="min-w-[140px]"
                  wrapperClassName="flex-1 sm:flex-none"
                >
                  <option value="desc">{t('dashboard.filters.sortDir.options.desc')}</option>
                  <option value="asc">{t('dashboard.filters.sortDir.options.asc')}</option>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                {filtered.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <span className="font-semibold text-fg">
                      {filtered.length.toLocaleString('hu-HU')}
                    </span>
                    <span className="text-fg-muted">{t('dashboard.filters.results')}</span>
                  </div>
                )}
                <ViewSwitcher value={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {/* Active Filters Summary */}
            {(q.trim() || statusFilter !== 'all' || industryFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
                  {t('dashboard.filters.active')}:
                </span>
                {q.trim() && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-fg">
                    {t('dashboard.filters.search.label')}: &quot;{q}&quot;
                    <button
                      type="button"
                      onClick={() => setQ('')}
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
                      onClick={() => setStatusFilter('all')}
                      className="rounded-full hover:bg-border/60 p-0.5 transition"
                      aria-label={t('dashboard.filters.remove')}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {industryFilter !== 'all' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-muted px-3 py-1.5 text-xs font-medium text-fg">
                    {t('dashboard.filters.industry.label')}: {industryFilter}
                    <button
                      type="button"
                      onClick={() => setIndustryFilter('all')}
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
                  onClick={() => {
                    setQ('');
                    setStatusFilter('all');
                    setIndustryFilter('all');
                  }}
                  className="text-xs"
                >
                  {t('dashboard.filters.clearAll')}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Skeletonok */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Enhanced Empty State */}
        {!loading && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-8 p-16 text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <DocumentTextIcon className="h-12 w-12 text-primary" aria-hidden="true" />
              </div>
              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
                <MagnifyingGlassIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-3 max-w-md">
              <h3 className="text-xl font-bold text-fg">{emptyMessage}</h3>
              {noOffersLoaded ? (
                <p className="text-sm leading-relaxed text-fg-muted">
                  {t('dashboard.emptyStates.noOffersMessage')}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-fg-muted">
                  {t('dashboard.emptyStates.noResultsMessage')}
                </p>
              )}
            </div>
            {noOffersLoaded && (
              <Link
                href="/new"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-ink shadow-lg transition-all hover:brightness-110 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <DocumentTextIcon className="h-5 w-5" />
                {t('dashboard.actions.newOffer')}
              </Link>
            )}
            {!noOffersLoaded && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setStatusFilter('all');
                  setIndustryFilter('all');
                }}
              >
                Szűrők törlése
              </Button>
            )}
          </Card>
        )}

        {/* Lista */}
        {!loading && filtered.length > 0 && (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start" data-offers-section>
                {filtered.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    isUpdating={updatingId === o.id}
                    isDownloading={downloadingId === o.id}
                    isDeleting={deletingId === o.id}
                    onMarkSent={(offer, date) => markSent(offer, date)}
                    onMarkDecision={(offer, decision, date) => markDecision(offer, decision, date)}
                    onRevertToSent={(offer) => revertToSent(offer)}
                    onRevertToDraft={(offer) => revertToDraft(offer)}
                    onDelete={(offer) => setOfferToDelete(offer)}
                    onDownload={(offer) => handleDownloadPdf(offer)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((o) => (
                  <OfferListItem
                    key={o.id}
                    offer={o}
                    isUpdating={updatingId === o.id}
                    isDownloading={downloadingId === o.id}
                    isDeleting={deletingId === o.id}
                    onMarkSent={(offer, date) => markSent(offer, date)}
                    onMarkDecision={(offer, decision, date) => markDecision(offer, decision, date)}
                    onRevertToSent={(offer) => revertToSent(offer)}
                    onRevertToDraft={(offer) => revertToDraft(offer)}
                    onDelete={(offer) => setOfferToDelete(offer)}
                    onDownload={(offer) => handleDownloadPdf(offer)}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              {paginationSummary ? (
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-fg-muted">
                  {paginationSummary}
                </p>
              ) : null}
              <LoadMoreButton
                currentPage={currentPage}
                totalPages={totalPages ?? null}
                hasNext={hasMore}
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
              />
              {!hasMore ? (
                <p className="text-xs text-fg-muted">{t('dashboard.pagination.allLoaded')}</p>
              ) : null}
            </div>
          </>
        )}
      </AppFrame>

      <DeleteConfirmationDialog
        offer={offerToDelete}
        onCancel={handleCancelDelete}
        onConfirm={confirmDeleteOffer}
        isDeleting={Boolean(deletingId)}
      />
    </>
  );
}
