'use client';

import { t } from '@/copy';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useToast } from '@/components/ToastProvider';
import { LoadMoreButton, PAGE_SIZE } from './offersPagination';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useInfiniteScroll } from '@/hooks/useIntersectionObserver';
import { useDashboardOffers } from '@/hooks/useDashboardOffers';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import Link from 'next/link';
import { currentMonthStart } from '@/lib/utils/dateHelpers';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth } from '@/lib/api';
import dynamic from 'next/dynamic';
import { type ViewMode } from '@/components/dashboard/ViewSwitcher';
import { DeleteConfirmationDialog } from '@/components/dashboard/DeleteConfirmationDialog';
import { DashboardMetricsSection } from '@/components/dashboard/DashboardMetricsSection';
import { DashboardFiltersSection } from '@/components/dashboard/DashboardFiltersSection';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { useDashboardOfferActions } from '@/hooks/useDashboardOfferActions';

// Lazy load heavy dashboard components for route-based code splitting
const OfferListItem = dynamic(
  () => import('@/components/dashboard/OfferListItem').then((mod) => mod.OfferListItem),
  {
    loading: () => <div className="h-24 animate-pulse rounded-lg bg-bg-muted" />,
  },
);
const OffersCardGrid = dynamic(
  () => import('@/components/dashboard/OffersCardGrid').then((mod) => mod.OffersCardGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl bg-bg-muted" />
      </div>
    ),
  },
);
const KeyboardShortcutsModal = dynamic(
  () => import('@/components/ui/KeyboardShortcutsModal').then((mod) => mod.KeyboardShortcutsModal),
  {
    ssr: false,
  },
);
import type { Offer, OfferFilter } from '@/app/dashboard/types';
import { OfferCardSkeleton } from '@/components/ui/Skeleton';
import QuestionMarkCircleIcon from '@heroicons/react/24/outline/QuestionMarkCircleIcon';
import { NotificationBar } from '@/components/dashboard/NotificationBar';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { createClientLogger } from '@/lib/clientLogger';
import { sanitizeInput } from '@/lib/sanitize';
import { DASHBOARD_CONFIG } from '@/constants/dashboard';

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

type UsageQuotaSnapshot = {
  plan: SubscriptionPlan;
  limit: number | null;
  used: number;
  pending: number;
  devicePending: number | null;
  periodStart: string | null;
};

function getDeviceIdFromCookie(name = 'propono_device_id'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // Validate cookie name to prevent injection
  if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return null;
  }

  const rawCookie = document.cookie;
  if (!rawCookie || typeof rawCookie !== 'string') {
    return null;
  }

  const parts = rawCookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) continue;

    const cookieName = trimmed.slice(0, equalIndex).trim();
    if (cookieName !== name) continue;

    const value = trimmed.slice(equalIndex + 1).trim();
    if (!value) {
      return null;
    }

    try {
      const decoded = decodeURIComponent(value);
      // Basic validation: should be a valid UUID or similar identifier
      if (decoded.length > 0 && decoded.length < 200) {
        return decoded;
      }
    } catch {
      // If decode fails, return raw value if it looks safe
      if (value.length > 0 && value.length < 200 && /^[a-zA-Z0-9_-]+$/.test(value)) {
        return value;
      }
    }
  }

  return null;
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

export default function DashboardPage() {
  const { showToast } = useToast();
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'DashboardPage' }),
    [user?.id],
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // Use custom hook for offer actions
  const {
    updatingId,
    downloadingId,
    regeneratingId,
    markDecision,
    markSent,
    revertToSent,
    revertToDraft,
    handleDownloadPdf,
    handleRegeneratePdf,
  } = useDashboardOfferActions({
    setOffers,
    userId: user?.id,
  });
  const [quotaSnapshot, setQuotaSnapshot] = useState<UsageQuotaSnapshot | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);
  const [latestNotification, setLatestNotification] = useState<{
    id: string;
    offerId: string;
    type: 'response' | 'view' | 'share_created';
    title: string;
    message: string;
    metadata: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
  } | null>(null);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [sanitizedQ, setSanitizedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [offerFilter, setOfferFilter] = useState<OfferFilter>(
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
  const [teamMemberFilter, setTeamMemberFilter] = useState<string[]>([]);
  const [kpiScope, setKpiScope] = useState<'personal' | 'team'>(
    (() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard-kpi-scope');
        if (saved === 'personal' || saved === 'team') {
          return saved;
        }
      }
      return 'personal';
    })(),
  );
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ user_id: string; email: string | null }>>(
    [],
  );
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
      return (saved === 'compact' || saved === 'detailed' ? saved : 'detailed') as
        | 'detailed'
        | 'compact';
    }
    return 'detailed';
  });
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Keyboard shortcut handler: ? to show shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show keyboard shortcuts modal with Shift+? or just ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        // Only trigger if not typing in an input field
        const target = e.target as HTMLElement;
        if (
          target.tagName !== 'INPUT' &&
          target.tagName !== 'TEXTAREA' &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setShowKeyboardShortcuts(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced localStorage writes to reduce I/O
  const localStorageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeToLocalStorage = useCallback(
    (key: string, value: string) => {
      if (typeof window === 'undefined') return;

      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
      }

      localStorageTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          // localStorage might be full or disabled
          logger.warn('Failed to write to localStorage', { key, error });
        }
        localStorageTimeoutRef.current = null;
      }, DASHBOARD_CONFIG.LOCAL_STORAGE_DEBOUNCE_MS);
    },
    [logger],
  );

  useEffect(() => {
    writeToLocalStorage('dashboard-view-mode', viewMode);
    return () => {
      if (localStorageTimeoutRef.current) {
        clearTimeout(localStorageTimeoutRef.current);
      }
    };
  }, [viewMode, writeToLocalStorage]);

  useEffect(() => {
    writeToLocalStorage('dashboard-metrics-view-mode', metricsViewMode);
  }, [metricsViewMode, writeToLocalStorage]);

  useEffect(() => {
    writeToLocalStorage('dashboard-offer-filter', offerFilter);
  }, [offerFilter, writeToLocalStorage]);

  useEffect(() => {
    writeToLocalStorage('dashboard-kpi-scope', kpiScope);
  }, [kpiScope, writeToLocalStorage]);

  // Sanitize search query
  useEffect(() => {
    const sanitized = sanitizeInput(q);
    setSanitizedQ(sanitized);
  }, [q]);

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

  // Load team memberships
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setTeamIds([]);
      setTeamMembers([]);
      return;
    }

    const loadTeams = async () => {
      try {
        const { getUserTeams } = await import('@/lib/services/teams');
        const ids = await getUserTeams(sb, user.id);
        setTeamIds(ids);

        // Load all team members
        if (ids.length > 0) {
          const allMembers = new Map<string, { user_id: string; email: string | null }>();
          await Promise.all(
            ids.map(async (teamId) => {
              try {
                const { getTeamMembers } = await import('@/lib/services/teams');
                const members = await getTeamMembers(sb, teamId);
                members.forEach((m) => {
                  if (!allMembers.has(m.user_id)) {
                    allMembers.set(m.user_id, {
                      user_id: m.user_id,
                      email: (m.user as { email?: string })?.email || null,
                    });
                  }
                });
              } catch (error) {
                logger.error('Failed to load team members', error, { teamId });
              }
            }),
          );
          setTeamMembers(Array.from(allMembers.values()));
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        logger.error('Failed to load teams', error);
        setTeamIds([]);
        setTeamMembers([]);
      }
    };

    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user, sb]);

  // Use the custom hook for offers fetching
  const {
    offers,
    loading,
    totalCount,
    isLoadingMore,
    hasMore,
    pageIndex,
    setOffers,
    setTotalCount,
    handleLoadMore,
  } = useDashboardOffers({
    offerFilter,
    teamMemberFilter,
    teamIds,
  });

  // Track URL search params to detect refresh requests
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check if there's a refresh parameter in the URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('refresh')) {
        // Remove the refresh parameter from URL without reload
        params.delete('refresh');
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        // Trigger quota refresh
        setRefreshKey((prev) => prev + 1);
      }
    }
  }, []);

  // Load quota function - use unified quota service
  const loadQuota = useCallback(async () => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsQuotaLoading(false);
      return;
    }

    setIsQuotaLoading(true);
    try {
      const deviceId = getDeviceIdFromCookie();
      const { getQuotaData } = await import('@/lib/services/quota');
      const quotaData = await getQuotaData(sb, deviceId, null);

      // Map to dashboard format
      const normalizedDevicePending = deviceId
        ? (quotaData.pendingDevice ?? 0)
        : quotaData.pendingDevice;

      setQuotaSnapshot({
        plan: quotaData.plan as SubscriptionPlan,
        limit: quotaData.limit,
        used: quotaData.confirmed,
        pending: quotaData.pendingUser,
        devicePending: normalizedDevicePending,
        periodStart: quotaData.periodStart,
      });
    } catch (error) {
      logger.error('Failed to load usage quota', error);
      setQuotaSnapshot(null);
    } finally {
      setIsQuotaLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, sb, user]);

  // Use ref to store latest loadQuota callback
  const loadQuotaRef = useRef(loadQuota);
  useEffect(() => {
    loadQuotaRef.current = loadQuota;
  }, [loadQuota]);

  // Load quota on mount and when refresh key changes
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      setQuotaSnapshot(null);
      setIsQuotaLoading(false);
      return;
    }

    loadQuotaRef.current();
    // Only depend on authStatus, user.id, and refreshKey, not the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id, refreshKey]);

  // Set up real-time subscriptions for quota updates
  // Use refs and debouncing to prevent excessive refreshes
  const quotaRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    const { iso: expectedPeriod } = currentMonthStart();

    // Debounce quota refreshes to prevent excessive calls
    const debouncedLoadQuota = () => {
      if (quotaRefreshTimeoutRef.current) {
        clearTimeout(quotaRefreshTimeoutRef.current);
      }
      quotaRefreshTimeoutRef.current = setTimeout(() => {
        loadQuotaRef.current();
      }, DASHBOARD_CONFIG.QUOTA_REFRESH_DEBOUNCE_MS);
    };

    // Subscribe to usage_counters changes
    const usageChannel = sb
      .channel(`dashboard-quota-usage-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Type guard for payload
          if (!payload?.new || typeof payload.new !== 'object') return;

          const updated = payload.new as { period_start?: string };
          // Refresh quota on any usage counter update (period check handled by get_quota_snapshot)
          // Only log in development to reduce noise
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: Usage counter updated via realtime, refreshing quota', {
              period: updated.period_start,
            });
          }
          debouncedLoadQuota();
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_counters',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Type guard for payload
          if (!payload?.new || typeof payload.new !== 'object') return;

          const inserted = payload.new as { period_start?: string };
          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: Usage counter inserted via realtime, refreshing quota', {
              period: inserted.period_start,
            });
          }
          debouncedLoadQuota();
        },
      )
      .subscribe();

    // Subscribe to pdf_jobs changes
    const jobsChannel = sb
      .channel(`dashboard-quota-jobs-${user.id}-${expectedPeriod}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_jobs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Type guard for payload
          const jobData = payload.new || payload.old;
          if (!jobData || typeof jobData !== 'object') return;

          const job = jobData as {
            id?: string;
            status?: string;
            created_at?: string;
          };
          if (!job?.created_at) return;

          // Debounce rapid changes - refresh quota after job status changes
          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Dashboard: PDF job changed via realtime, refreshing quota', {
              event: payload.eventType,
              jobId: job.id,
              status: job.status,
            });
          }
          debouncedLoadQuota();
        },
      )
      .subscribe();

    return () => {
      if (quotaRefreshTimeoutRef.current) {
        clearTimeout(quotaRefreshTimeoutRef.current);
        quotaRefreshTimeoutRef.current = null;
      }
      sb.removeChannel(usageChannel);
      sb.removeChannel(jobsChannel);
    };
  }, [authStatus, user, sb, loadQuotaRef, logger]);

  // Auto-load more when scroll reaches bottom (progressive loading with intersection observer)
  const loadMoreRef = useInfiniteScroll(handleLoadMore, hasMore, isLoadingMore, {
    rootMargin: `${DASHBOARD_CONFIG.INFINITE_SCROLL_ROOT_MARGIN_PX}px`,
  });

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
      logger.error('Failed to delete offer', error, { offerId: offerToDelete.id });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /** Szűrés + rendezés (optimized) */
  const filtered = useMemo(() => {
    // Use sanitized query for filtering
    const searchTerm = sanitizedQ.trim().toLowerCase();

    // Early return if no offers
    if (offers.length === 0) {
      return [];
    }

    let list = offers;

    if (searchTerm) {
      list = list.filter(
        (o) =>
          o.title?.toLowerCase().includes(searchTerm) ||
          (o.recipient?.company_name || '').toLowerCase().includes(searchTerm),
      );
    }

    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);

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
        case 'created':
        default:
          return (
            dir * (new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
          );
      }
    });

    return list;
  }, [offers, sanitizedQ, statusFilter, sortBy, sortDir]);

  // Use the custom hook for metrics calculation
  const stats = useDashboardMetrics(
    user?.id
      ? {
          offers,
          kpiScope,
          userId: user.id,
        }
      : {
          offers,
          kpiScope,
        },
  );

  // Memoize status filter counts to avoid recalculating on every render
  const statusFilterCounts = useMemo(() => {
    const baseFiltered = offers.filter((o) => {
      const matchesSearch =
        !sanitizedQ.trim() ||
        o.title?.toLowerCase().includes(sanitizedQ.toLowerCase()) ||
        (o.recipient?.company_name || '').toLowerCase().includes(sanitizedQ.toLowerCase());
      return matchesSearch;
    });

    const counts: Record<string, number> = {};
    for (const status of STATUS_FILTER_OPTIONS) {
      counts[status] =
        status === 'all'
          ? baseFiltered.length
          : baseFiltered.filter((o) => o.status === status).length;
    }
    return counts;
  }, [offers, sanitizedQ]);

  /** Realtime frissítések (with race condition protection) */
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return;

    let isActive = true;

    const channel = sb
      .channel(`offers-updates-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'offers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (!isActive) return;

          // Type guard for payload
          if (!payload?.new || typeof payload.new !== 'object') return;

          const updated = payload.new as Partial<Offer> & { id?: string };
          if (!updated || typeof updated.id !== 'string') return;

          // Only log in development for debugging
          if (process.env.NODE_ENV !== 'production') {
            logger.info('Offer updated via realtime subscription', {
              offerId: updated.id,
              updatedFields: Object.keys(updated),
              pdfUrl: updated.pdf_url,
              oldPdfUrl: payload.old ? (payload.old as { pdf_url?: string | null }).pdf_url : null,
            });

            // Log PDF URL updates specifically
            if (
              updated.pdf_url &&
              payload.old &&
              (payload.old as { pdf_url?: string | null }).pdf_url !== updated.pdf_url
            ) {
              logger.info('Offer PDF URL updated via realtime', {
                offerId: updated.id,
                oldPdfUrl: (payload.old as { pdf_url?: string | null }).pdf_url,
                newPdfUrl: updated.pdf_url,
              });
            }
          }

          if (!isActive) return;

          setOffers((prev) => {
            if (!isActive) return prev;

            let didChange = false;
            const next = prev.map((item) => {
              if (item.id !== updated.id) return item;
              didChange = true;

              // Safe recipient handling with validation
              let recipientValue = item.recipient ?? null;
              if (updated.recipient !== undefined) {
                if (Array.isArray(updated.recipient)) {
                  recipientValue = updated.recipient[0] ?? null;
                } else if (updated.recipient && typeof updated.recipient === 'object') {
                  recipientValue = updated.recipient as typeof recipientValue;
                } else {
                  recipientValue = null;
                }
              }

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
          if (!isActive) return;

          // Type guard for payload
          if (!payload?.new || typeof payload.new !== 'object') return;

          const inserted = payload.new as Partial<Offer> & { id?: string };
          if (!inserted || typeof inserted.id !== 'string') return;

          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
            logger.info('New offer inserted via realtime', {
              offerId: inserted.id,
              pdfUrl: inserted.pdf_url,
              title: inserted.title,
              fullPayload: payload,
            });
          }

          if (!isActive) return;

          // Add new offer to the beginning of the list if it's not already there
          setOffers((prev) => {
            if (!isActive) return prev;

            const exists = prev.some((item) => item.id === inserted.id);
            if (exists) return prev;

            // Safe recipient handling
            let recipientValue = null;
            if (inserted.recipient !== undefined) {
              if (Array.isArray(inserted.recipient)) {
                recipientValue = inserted.recipient[0] ?? null;
              } else if (inserted.recipient && typeof inserted.recipient === 'object') {
                recipientValue = inserted.recipient as typeof recipientValue;
              }
            }

            const newOffer: Offer = {
              id: String(inserted.id),
              title: typeof inserted.title === 'string' ? inserted.title : '',
              status: (inserted.status ?? 'draft') as Offer['status'],
              created_at: inserted.created_at ?? null,
              decided_at: inserted.decided_at ?? null,
              decision: (inserted.decision ?? null) as Offer['decision'],
              pdf_url: inserted.pdf_url ?? null,
              recipient_id: inserted.recipient_id ?? null,
              recipient: recipientValue,
            };

            // Add to beginning
            return [newOffer, ...prev];
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'offers', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (!isActive) return;

          // Type guard for payload
          if (!payload?.old || typeof payload.old !== 'object') return;

          const removed = payload.old as { id?: string } | null;
          if (!removed || typeof removed.id !== 'string') return;

          setOffers((prev) => {
            if (!isActive) return prev;
            return prev.filter((item) => item.id !== removed.id);
          });
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      sb.removeChannel(channel);
    };
  }, [authStatus, sb, user, logger, setOffers]);

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
  const createdComparison =
    stats.createdLastMonth > 0
      ? {
          label: 'Előző hónap',
          value: stats.createdLastMonth.toLocaleString('hu-HU'),
          trend:
            stats.createdThisMonth > stats.createdLastMonth
              ? ('up' as const)
              : stats.createdThisMonth < stats.createdLastMonth
                ? ('down' as const)
                : ('neutral' as const),
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

  // Load latest unread notification and set up realtime subscription
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) return;

    // Load latest unread notification
    const loadLatestNotification = async () => {
      try {
        const response = await fetchWithSupabaseAuth(
          '/api/notifications?limit=1&unreadOnly=true',
          {},
        );
        if (response.ok) {
          const data = await response.json();
          if (data.notifications && data.notifications.length > 0) {
            setLatestNotification(data.notifications[0]);
          }
        }
      } catch (error) {
        logger.error('Failed to load notifications', error);
      }
    };

    loadLatestNotification();

    // Set up realtime subscription for notifications
    const notificationChannel = sb
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offer_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as typeof latestNotification;
          if (newNotification && !newNotification.isRead) {
            setLatestNotification(newNotification);
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offer_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as typeof latestNotification;
          setLatestNotification((current) => {
            if (current && updated && updated.id === current.id && updated.isRead) {
              return null;
            }
            return current;
          });
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(notificationChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user, sb]);

  const handleDismissNotification = (notificationId: string) => {
    if (latestNotification?.id === notificationId) {
      setLatestNotification(null);
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await fetchWithSupabaseAuth(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (latestNotification?.id === notificationId) {
        setLatestNotification(null);
      }
    } catch (error) {
      logger.error('Failed to mark notification as read', error, { notificationId });
    }
  };

  const hasNoOffers = !loading && totalOffersCount === 0;

  return (
    <PageErrorBoundary>
      <div
        className={`min-h-screen ${
          hasNoOffers
            ? 'bg-gradient-to-br from-teal-50 via-white to-blue-50'
            : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50'
        } ${latestNotification && !latestNotification.isRead ? 'pt-16' : ''}`}
      >
        {latestNotification && !latestNotification.isRead && (
          <div className="fixed top-0 left-0 right-0 z-50">
            <NotificationBar
              notification={latestNotification}
              onDismiss={handleDismissNotification}
              onMarkAsRead={handleMarkNotificationAsRead}
            />
          </div>
        )}
        <AppFrame
          title={t('dashboard.title')}
          description="Kezeld az összes ajánlatodat egy helyen. Keresés, szűrés és státusz követés egyszerűen."
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setShowKeyboardShortcuts(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg-muted transition hover:border-fg hover:bg-bg/80 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">?</span>
              </button>
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
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-ink shadow-lg transition hover:brightness-110 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('dashboard.actions.newOffer')}
              </Link>
            </div>
          }
        >
          {/* Progressive Disclosure: Empty State for New Users */}
          {hasNoOffers ? (
            <EmptyState />
          ) : (
            <Fragment>
              {/* Enhanced KPI Dashboard with Visual Funnel */}
              <PageErrorBoundary>
                <DashboardMetricsSection
                  loading={loading}
                  isQuotaLoading={isQuotaLoading}
                  totalOffersCount={totalOffersCount}
                  stats={stats}
                  metricsViewMode={metricsViewMode}
                  kpiScope={kpiScope}
                  teamIds={teamIds}
                  quotaValue={quotaValue}
                  quotaSnapshot={quotaSnapshot}
                  acceptanceLabel={acceptanceLabel}
                  winRateLabel={winRateLabel}
                  avgDecisionLabel={avgDecisionLabel}
                  totalHelper={totalHelper}
                  createdComparison={createdComparison}
                  onMetricsViewModeChange={setMetricsViewMode}
                  onKpiScopeChange={setKpiScope}
                  onMetricClick={handleMetricClick}
                />
              </PageErrorBoundary>

              {/* Enhanced Search & Filters */}
              <div className="pt-6">
                <DashboardFiltersSection
                  searchQuery={q}
                  sanitizedQuery={sanitizedQ}
                  statusFilter={statusFilter}
                  offerFilter={offerFilter}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  viewMode={viewMode}
                  teamIds={teamIds}
                  teamMembers={teamMembers}
                  teamMemberFilter={teamMemberFilter}
                  statusFilterCounts={statusFilterCounts}
                  filteredCount={filtered.length}
                  onSearchChange={setQ}
                  onStatusFilterChange={setStatusFilter}
                  onOfferFilterChange={setOfferFilter}
                  onTeamMemberFilterChange={setTeamMemberFilter}
                  onSortByChange={setSortBy}
                  onSortDirChange={setSortDir}
                  onViewModeChange={setViewMode}
                  onClearFilters={() => {
                    setQ('');
                    setStatusFilter('all');
                  }}
                  isSortByValue={isSortByValue}
                  isSortDirectionValue={isSortDirectionValue}
                />
              </div>

              {/* Skeleton Loaders - Mobile optimized */}
              {loading && (
                <div
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                  aria-busy="true"
                  aria-live="polite"
                  role="status"
                  aria-label="Loading offers..."
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <OfferCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Enhanced Empty State - Improved accessibility and mobile design */}
              {!loading && filtered.length === 0 && (
                <DashboardEmptyState
                  isEmpty={noOffersLoaded}
                  message={emptyMessage}
                  onClearFilters={
                    !noOffersLoaded
                      ? () => {
                          setQ('');
                          setStatusFilter('all');
                        }
                      : undefined
                  }
                />
              )}

              {/* Offers List - Mobile optimized with accessibility and roving tabindex */}
              {!loading && filtered.length > 0 && (
                <div>
                  {viewMode === 'card' ? (
                    <OffersCardGrid
                      offers={filtered}
                      updatingId={updatingId}
                      downloadingId={downloadingId}
                      deletingId={deletingId}
                      regeneratingId={regeneratingId}
                      onMarkSent={markSent}
                      onMarkDecision={markDecision}
                      onRevertToSent={revertToSent}
                      onRevertToDraft={revertToDraft}
                      onDelete={setOfferToDelete}
                      onDownload={handleDownloadPdf}
                      onRegeneratePdf={handleRegeneratePdf}
                    />
                  ) : (
                    <div
                      className="flex flex-col gap-3"
                      role="region"
                      aria-label={t('dashboard.offersList.label') || 'Offers list'}
                      aria-busy={updatingId !== null || deletingId !== null}
                    >
                      {filtered.map((o) => (
                        <OfferListItem
                          key={o.id}
                          offer={o}
                          isUpdating={updatingId === o.id}
                          isDownloading={downloadingId === o.id}
                          isDeleting={deletingId === o.id}
                          onMarkDecision={(offer, decision, date) =>
                            markDecision(offer, decision, date)
                          }
                          onRevertToSent={(offer) => revertToSent(offer)}
                          onRevertToDraft={(offer) => revertToDraft(offer)}
                          onDelete={(offer) => setOfferToDelete(offer)}
                          onDownload={(offer) => handleDownloadPdf(offer)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Progressive Loading - Enhanced with intersection observer for auto-loading */}
                  <div
                    ref={loadMoreRef}
                    className="mt-6 flex flex-col items-center gap-3 text-center"
                  >
                    {paginationSummary ? (
                      <p
                        className="text-xs font-medium uppercase tracking-[0.3em] text-fg-muted"
                        role="status"
                        aria-live="polite"
                      >
                        {paginationSummary}
                      </p>
                    ) : null}

                    {/* Load More Button - Also serves as intersection observer target for auto-loading */}
                    {hasMore && (
                      <div className="w-full">
                        <LoadMoreButton
                          currentPage={currentPage}
                          totalPages={totalPages ?? null}
                          hasNext={hasMore}
                          onClick={handleLoadMore}
                          isLoading={isLoadingMore}
                        />
                      </div>
                    )}

                    {!hasMore && offers.length > 0 && (
                      <p className="text-xs text-fg-muted" role="status" aria-live="polite">
                        {t('dashboard.pagination.allLoaded')}
                      </p>
                    )}

                    {/* Loading indicator for progressive loading */}
                    {isLoadingMore && (
                      <div
                        className="flex items-center gap-2 text-sm text-fg-muted"
                        aria-busy="true"
                        aria-live="polite"
                      >
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>{t('dashboard.pagination.loading') || 'Loading more offers...'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Fragment>
          )}
        </AppFrame>

        <DeleteConfirmationDialog
          offer={offerToDelete}
          onCancel={handleCancelDelete}
          onConfirm={confirmDeleteOffer}
          isDeleting={Boolean(deletingId)}
          {...(offerToDelete?.title ? { itemName: offerToDelete.title } : {})}
        />
        <KeyboardShortcutsModal
          open={showKeyboardShortcuts}
          onClose={() => setShowKeyboardShortcuts(false)}
          shortcuts={[
            {
              category: 'Navigation',
              keys: ['?'],
              description: 'Show keyboard shortcuts',
            },
            {
              category: 'Dashboard',
              keys: ['/', 'F'],
              description: 'Focus search / filter',
            },
            {
              category: 'Dashboard',
              keys: ['Arrow Keys'],
              description: 'Navigate between filter chips',
            },
            {
              category: 'Dashboard',
              keys: ['Home', 'End'],
              description: 'Jump to first / last filter',
            },
            {
              category: 'General',
              keys: ['Esc'],
              description: 'Close modal / Cancel action',
            },
          ]}
        />
      </div>
    </PageErrorBoundary>
  );
}
