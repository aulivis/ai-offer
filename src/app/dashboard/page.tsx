'use client';

import { t } from '@/copy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useToast } from '@/components/ToastProvider';
import { LoadMoreButton, PAGE_SIZE, mergeOfferPages } from './offersPagination';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useInfiniteScroll } from '@/hooks/useIntersectionObserver';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { currentMonthStart } from '@/lib/utils/dateHelpers';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth } from '@/lib/api';
import dynamic from 'next/dynamic';
import { ViewSwitcher, type ViewMode } from '@/components/dashboard/ViewSwitcher';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DeleteConfirmationDialog } from '@/components/dashboard/DeleteConfirmationDialog';

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
import { STATUS_LABEL_KEYS } from '@/app/dashboard/types';
import DocumentTextIcon from '@heroicons/react/24/outline/DocumentTextIcon';
import { OfferCardSkeleton, MetricSkeleton } from '@/components/ui/Skeleton';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import DocumentCheckIcon from '@heroicons/react/24/outline/DocumentCheckIcon';
import PaperAirplaneIcon from '@heroicons/react/24/outline/PaperAirplaneIcon';
import ClockIcon from '@heroicons/react/24/outline/ClockIcon';
import MagnifyingGlassIcon from '@heroicons/react/24/outline/MagnifyingGlassIcon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import XCircleIcon from '@heroicons/react/24/outline/XCircleIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import ArrowsPointingOutIcon from '@heroicons/react/24/outline/ArrowsPointingOutIcon';
import ArrowsPointingInIcon from '@heroicons/react/24/outline/ArrowsPointingInIcon';
import QuestionMarkCircleIcon from '@heroicons/react/24/outline/QuestionMarkCircleIcon';
import { NotificationBar } from '@/components/dashboard/NotificationBar';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { createClientLogger } from '@/lib/clientLogger';

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

export default function DashboardPage() {
  const { showToast } = useToast();
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'DashboardPage' }),
    [user?.id],
  );

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-offer-filter', offerFilter);
    }
  }, [offerFilter]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-kpi-scope', kpiScope);
    }
  }, [kpiScope]);

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

  const fetchPage = useCallback(
    async (
      user: string,
      pageNumber: number,
      filter: OfferFilter = 'all',
      memberIds: string[] = [],
      teamIdsParam: string[] = [],
    ): Promise<{ items: Offer[]; count: number | null }> => {
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
        logger.error('Failed to ensure Supabase session', error, { userId: user });
        // If session initialization fails, provide user-friendly error
        const errorMessage =
          error instanceof Error ? error.message : 'Session initialization failed';

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
      await new Promise((resolve) => setTimeout(resolve, 100));
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();
      const sessionMatches = session?.user?.id === user;

      // Only log session check in development
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Dashboard auth session check', {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionError: sessionError?.message,
          matchesUserId: sessionMatches,
        });
      }

      // If session doesn't match after ensureSession, this is unexpected
      // ensureSession should have thrown an error already, but check anyway
      if (!sessionMatches) {
        logger.error('Session verification failed after ensureSession', undefined, {
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

      // Build query based on filter
      let query = sb
        .from('offers')
        .select(
          'id,title,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id,user_id,created_by,updated_by,team_id,recipient:recipient_id ( company_name )',
          { count: 'exact' },
        );

      try {
        if (filter === 'my') {
          query = query.eq('user_id', user);
        } else if (filter === 'team') {
          if (teamIdsParam.length === 0) {
            return { items: [], count: 0 };
          }
          query = query.not('team_id', 'is', null).in('team_id', teamIdsParam);
        } else if (filter === 'all') {
          if (teamIdsParam.length > 0) {
            query = query.or(`user_id.eq.${user},team_id.in.(${teamIdsParam.join(',')})`);
          } else {
            query = query.eq('user_id', user);
          }
        } else if (filter === 'member' && memberIds.length > 0) {
          query = query.in('created_by', memberIds);
        } else {
          query = query.eq('user_id', user);
        }
      } catch (queryBuildError) {
        logger.error('Failed to build query', queryBuildError, {
          userId: user,
          filter,
          teamIdsParam,
          memberIds,
        });
        console.error('[Dashboard] Query build error:', queryBuildError, {
          userId: user,
          filter,
          teamIdsParam,
          memberIds,
        });
        throw new Error(
          `Failed to build query: ${queryBuildError instanceof Error ? queryBuildError.message : String(queryBuildError)}`,
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        // Extract detailed error information for logging
        const errorInfo: Record<string, unknown> = {
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          errorMessage: error.message,
          userId: user,
          filter,
          pageNumber,
          teamIdsParam,
          memberIds,
        };

        logger.error('Dashboard fetch error', error, errorInfo);
        // Also log to console as fallback
        console.error('[Dashboard] Fetch error:', error, errorInfo);

        // Create a more descriptive error message
        const errorMessage =
          error.message ||
          error.details ||
          error.hint ||
          `Database error: ${error.code || 'unknown'}`;

        const enhancedError = new Error(errorMessage);
        // Preserve original error details
        (enhancedError as { originalError?: unknown }).originalError = error;
        throw enhancedError;
      }

      // Check if data is null/undefined (shouldn't happen, but handle gracefully)
      if (data === null || data === undefined) {
        const nullDataError = new Error('Query returned null data');
        logger.error('Dashboard query returned null data', nullDataError, {
          userId: user,
          filter,
          pageNumber,
          teamIdsParam,
          memberIds,
        });
        console.error('[Dashboard] Query returned null data:', {
          userId: user,
          filter,
          pageNumber,
        });
        throw nullDataError;
      }

      // Only log in development
      if (process.env.NODE_ENV !== 'production') {
        logger.info('Dashboard fetched offers', {
          userId: user,
          pageNumber,
          count,
          itemsCount: Array.isArray(data) ? data.length : 0,
          offersWithPdf: Array.isArray(data)
            ? data.filter((item: { pdf_url?: string | null }) => item.pdf_url).length
            : 0,
          offerIds: Array.isArray(data)
            ? data.map((item: { id?: string }) => item.id).slice(0, 5)
            : [],
          offersWithPdfIds: Array.isArray(data)
            ? data
                .filter((item: { pdf_url?: string | null }) => item.pdf_url)
                .map((item: { id?: string }) => item.id)
            : [],
        });
      }

      const rawItems = Array.isArray(data) ? data : [];
      const items: Offer[] = rawItems.map((entry) => {
        const recipientValue = Array.isArray(entry.recipient)
          ? (entry.recipient[0] ?? null)
          : (entry.recipient ?? null);

        return {
          id: String(entry.id),
          title: typeof entry.title === 'string' ? entry.title : '',
          status: (entry.status ?? 'draft') as Offer['status'],
          created_at: entry.created_at ?? null,
          sent_at: entry.sent_at ?? null,
          decided_at: entry.decided_at ?? null,
          decision: (entry.decision ?? null) as Offer['decision'],
          pdf_url: entry.pdf_url ?? null,
          recipient_id: entry.recipient_id ?? null,
          recipient: recipientValue,
          ...(typeof entry.user_id === 'string' ? { user_id: entry.user_id } : {}),
          ...(typeof entry.created_by === 'string' ? { created_by: entry.created_by } : {}),
          updated_by: typeof entry.updated_by === 'string' ? entry.updated_by : null,
          team_id: typeof entry.team_id === 'string' ? entry.team_id : null,
          // Note: created_by_user and updated_by_user set to null
          // because the foreign key relationships are not configured in the schema
          created_by_user: null,
          updated_by_user: null,
        };
      });

      return {
        items,
        count: typeof count === 'number' ? count : null,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sb, showToast],
  );

  // Use refs to store latest callbacks to avoid unnecessary re-subscriptions
  const fetchPageRef = useRef(fetchPage);
  const showToastRef = useRef(showToast);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
    showToastRef.current = showToast;
  }, [fetchPage, showToast]);

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
        const memberIds = offerFilter === 'member' ? teamMemberFilter : [];
        const { items, count } = await fetchPageRef.current(
          user.id,
          0,
          offerFilter,
          memberIds,
          teamIds,
        );
        if (!active) return;
        setOffers(items);
        setPageIndex(0);
        setTotalCount(count);
      } catch (error) {
        // Extract detailed error information
        let errorMessage = t('toasts.offers.loadFailed.description');
        let errorDetails: Record<string, unknown> = {};

        if (error && typeof error === 'object') {
          // Handle Supabase PostgrestError
          if ('code' in error || 'message' in error || 'details' in error || 'hint' in error) {
            const supabaseError = error as {
              code?: string;
              message?: string;
              details?: string;
              hint?: string;
            };
            errorMessage = supabaseError.message || errorMessage;
            errorDetails = {
              code: supabaseError.code,
              details: supabaseError.details,
              hint: supabaseError.hint,
            };
          }
          // Handle standard Error
          else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
            errorDetails = {
              name: error.name,
              stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            };
          }
          // Handle other error types
          else {
            errorMessage = String(error);
          }
        }

        const logContext = {
          userId: user?.id,
          offerFilter,
          teamIds,
          teamMemberFilter,
          ...errorDetails,
        };

        // Log error with both logger and console as fallback
        logger.error('Failed to load offers', error, logContext);
        // Also log to console as fallback (especially important if logger fails)
        console.error('[Dashboard] Failed to load offers:', {
          error,
          ...logContext,
        });

        showToastRef.current({
          title: t('toasts.offers.loadFailed.title'),
          description: errorMessage,
          variant: 'error',
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialPage();

    // Only refresh on visibility change if we're coming back from a hidden state
    // and enough time has passed (to avoid refreshing on quick tab switches)
    let wasHidden = false;
    let hiddenTimestamp = 0;
    const VISIBILITY_REFRESH_THRESHOLD_MS = 5000; // Only refresh if hidden for >5 seconds

    const handleVisibilityChange = () => {
      if (!active) return;

      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible' && wasHidden) {
        const hiddenDuration = Date.now() - hiddenTimestamp;
        // Only refresh if page was hidden for a significant amount of time
        // This prevents unnecessary refreshes on quick tab switches
        if (hiddenDuration > VISIBILITY_REFRESH_THRESHOLD_MS) {
          loadInitialPage();
        }
        wasHidden = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Depend on filter state to reload offers when filter changes
    // Note: loadInitialPage uses fetchPageRef.current (ref) and showToastRef.current (ref),
    // which are intentionally excluded from dependencies to avoid unnecessary re-subscriptions.
    // The visibility change handler closure captures loadInitialPage, which is acceptable
    // since the event listener is cleaned up on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id, offerFilter, teamMemberFilter, teamIds]);

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
  useEffect(() => {
    if (authStatus !== 'authenticated' || !user) {
      return;
    }

    const { iso: expectedPeriod } = currentMonthStart();

    // Debounce quota refreshes to prevent excessive calls
    let quotaRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedLoadQuota = () => {
      if (quotaRefreshTimeout) {
        clearTimeout(quotaRefreshTimeout);
      }
      quotaRefreshTimeout = setTimeout(() => {
        loadQuotaRef.current();
      }, 500);
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
          const job = (payload.new || payload.old) as {
            id?: string;
            status?: string;
            created_at?: string;
          } | null;
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
      if (quotaRefreshTimeout) {
        clearTimeout(quotaRefreshTimeout);
      }
      sb.removeChannel(usageChannel);
      sb.removeChannel(jobsChannel);
    };
    // Only depend on authStatus and user.id, not the callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, user?.id, sb]);

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
      logger.error('Failed to load more offers', error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, hasMore, isLoadingMore, pageIndex, showToast, userId]);

  // Auto-load more when scroll reaches bottom (progressive loading with intersection observer)
  const loadMoreRef = useInfiniteScroll(handleLoadMore, hasMore, isLoadingMore, {
    rootMargin: '200px', // Start loading 200px before reaching bottom
  });

  async function applyPatch(offer: Offer, patch: Partial<Offer>) {
    setUpdatingId(offer.id);
    try {
      const { error } = await sb.from('offers').update(patch).eq('id', offer.id);
      if (error) throw error;
      setOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, ...patch } : item)),
      );
    } catch (error) {
      logger.error('Offer status update failed', error, { offerId: offer.id });
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
        logger.error('Failed to download offer PDF', error, { offerId: offer.id });
        showToast({
          title: t('toasts.offers.downloadFailed.title'),
          description: t('toasts.offers.downloadFailed.description'),
          variant: 'error',
        });
      } finally {
        setDownloadingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showToast],
  );

  const handleRegeneratePdf = useCallback(
    async (offer: Offer) => {
      setRegeneratingId(offer.id);
      try {
        const response = await fetchWithSupabaseAuth(`/api/offers/${offer.id}/regenerate-pdf`, {
          method: 'POST',
          defaultErrorMessage: 'Nem sikerült újragenerálni a PDF-et.',
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Nem sikerült újragenerálni a PDF-et.');
        }

        showToast({
          title: 'PDF újragenerálás elindítva',
          description: 'A PDF hamarosan elérhető lesz.',
          variant: 'success',
        });
      } catch (error) {
        logger.error('Failed to regenerate PDF', error, { offerId: offer.id });
        showToast({
          title: 'Hiba',
          description:
            error instanceof Error ? error.message : 'Nem sikerült újragenerálni a PDF-et.',
          variant: 'error',
        });
      } finally {
        setRegeneratingId(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [offers, q, statusFilter, sortBy, sortDir]);

  /** Metrikák (enhanced with previous period comparison) - filtered by KPI scope */
  const metricsOffers = useMemo(() => {
    if (kpiScope === 'personal' && user) {
      return offers.filter((o) => o.user_id === user.id);
    }
    // Team scope: include all offers user can see
    return offers;
  }, [offers, kpiScope, user]);

  const stats = useMemo(() => {
    const total = metricsOffers.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    // Current period stats
    const createdThisMonth = metricsOffers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= monthStart;
    }).length;

    // Previous period stats
    const createdLastMonth = metricsOffers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= lastMonthStart && created < monthStart;
    }).length;

    const sentStatuses: Offer['status'][] = ['sent', 'accepted', 'lost'];
    const sent = metricsOffers.filter((offer) => sentStatuses.includes(offer.status)).length;
    const accepted = metricsOffers.filter((offer) => offer.status === 'accepted').length;
    const lost = metricsOffers.filter((offer) => offer.status === 'lost').length;
    const inReview = metricsOffers.filter((offer) => offer.status === 'sent').length;
    const drafts = metricsOffers.filter((offer) => offer.status === 'draft').length;

    const acceptanceRate = sent > 0 ? (accepted / sent) * 100 : null;
    const winRate = accepted + lost > 0 ? (accepted / (accepted + lost)) * 100 : null;

    const decisionDurations: number[] = [];
    metricsOffers.forEach((offer) => {
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
  }, [metricsOffers]);

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

          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
            logger.info('New offer inserted via realtime', {
              offerId: inserted.id,
              pdfUrl: inserted.pdf_url,
              title: inserted.title,
              fullPayload: payload,
            });
          }

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
            setTotalCount((prevCount) => (typeof prevCount === 'number' ? prevCount + 1 : null));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, sb, user]);

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
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          <>
            {/* Enhanced KPI Dashboard with Visual Funnel */}
            <div className="space-y-6 pb-8 border-b border-border/40">
              {/* Header with View Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-fg">{t('dashboard.metricsView.title')}</h2>
                  <p className="text-sm text-fg-muted mt-1">
                    {t('dashboard.metricsView.description')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {teamIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-fg-muted">Personal</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newScope = kpiScope === 'team' ? 'personal' : 'team';
                          setKpiScope(newScope);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          kpiScope === 'team' ? 'bg-primary' : 'bg-fg-muted'
                        }`}
                        role="switch"
                        aria-checked={kpiScope === 'team'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            kpiScope === 'team' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-fg-muted">Team</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setMetricsViewMode(metricsViewMode === 'compact' ? 'detailed' : 'compact')
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg hover:bg-bg/80"
                    title={
                      metricsViewMode === 'compact'
                        ? t('dashboard.metricsView.detailedTitle')
                        : t('dashboard.metricsView.compactTitle')
                    }
                  >
                    {metricsViewMode === 'compact' ? (
                      <>
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {t('dashboard.metricsView.detailed')}
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowsPointingInIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {t('dashboard.metricsView.compact')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Conversion Funnel Group - Progressive disclosure based on offer count */}
              <div className="relative" aria-busy={loading || isQuotaLoading} aria-live="polite">
                <div
                  className={`grid gap-3 sm:gap-4 ${
                    totalOffersCount < 5
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : metricsViewMode === 'compact'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8'
                  }`}
                >
                  {loading ? (
                    <>
                      {Array.from({
                        length: totalOffersCount < 5 ? 3 : metricsViewMode === 'compact' ? 7 : 8,
                      }).map((_, i) => (
                        <MetricSkeleton key={i} />
                      ))}
                    </>
                  ) : totalOffersCount < 5 ? (
                    <>
                      {/* Simplified metrics for users with 1-4 offers */}
                      <MetricCard
                        label={t('dashboard.metrics.created.label')}
                        value={totalOffersCount.toLocaleString('hu-HU')}
                        icon={<DocumentTextIcon className="h-7 w-7" aria-hidden="true" />}
                        color="primary"
                        trend={
                          stats.createdThisMonth > 0
                            ? 'up'
                            : stats.createdThisMonth === 0 && stats.createdLastMonth > 0
                              ? 'down'
                              : 'neutral'
                        }
                        {...(stats.createdThisMonth > 0
                          ? { trendValue: `+${stats.createdThisMonth}` }
                          : {})}
                        onClick={() => handleMetricClick('all')}
                      />
                      <MetricCard
                        label={t('dashboard.metrics.sent.label')}
                        value={stats.sent.toLocaleString('hu-HU')}
                        icon={<PaperAirplaneIcon className="h-7 w-7" aria-hidden="true" />}
                        color="info"
                        onClick={() => handleMetricClick('sent')}
                        isEmpty={stats.sent === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noSent')}
                      />
                      <MetricCard
                        label={t('dashboard.metrics.accepted.label')}
                        value={stats.accepted.toLocaleString('hu-HU')}
                        icon={<DocumentCheckIcon className="h-7 w-7" aria-hidden="true" />}
                        color="success"
                        trend={
                          stats.acceptanceRate !== null && stats.acceptanceRate > 50
                            ? 'up'
                            : stats.acceptanceRate !== null && stats.acceptanceRate < 30
                              ? 'down'
                              : 'neutral'
                        }
                        {...(acceptanceLabel !== '—' ? { trendValue: acceptanceLabel } : {})}
                        onClick={() => handleMetricClick('accepted')}
                        isEmpty={stats.accepted === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noAccepted')}
                      />
                    </>
                  ) : (
                    <>
                      {/* Full metrics for power users with 5+ offers */}
                      {/* Quota Card - Featured */}
                      <div className="sm:col-span-2">
                        <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                              <ChartBarIcon className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-semibold opacity-90">
                              {t('dashboard.metrics.quota.label')}
                            </div>
                          </div>
                          <div className="text-4xl font-bold mb-2">{quotaValue}</div>
                          {quotaSnapshot && quotaSnapshot.plan === 'pro' && (
                            <div className="text-sm opacity-80 flex items-center gap-2">
                              <span>Pro csomag előny</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Created Offers - Funnel Start */}
                      <MetricCard
                        label={t('dashboard.metrics.created.label')}
                        value={totalOffersCount.toLocaleString('hu-HU')}
                        {...(metricsViewMode === 'detailed' ? { helper: totalHelper } : {})}
                        icon={<DocumentTextIcon className="h-7 w-7" aria-hidden="true" />}
                        color="primary"
                        trend={
                          stats.createdThisMonth > 0
                            ? 'up'
                            : stats.createdThisMonth === 0 && stats.createdLastMonth > 0
                              ? 'down'
                              : 'neutral'
                        }
                        {...(stats.createdThisMonth > 0
                          ? { trendValue: `+${stats.createdThisMonth}` }
                          : {})}
                        {...(createdComparison ? { comparison: createdComparison } : {})}
                        onClick={() => handleMetricClick('all')}
                        isEmpty={totalOffersCount === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noOffers')}
                      />

                      {/* Active Offers (In Review) */}
                      <MetricCard
                        label={t('dashboard.metrics.inReview.label')}
                        value={stats.inReview.toLocaleString('hu-HU')}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.inReview.helper', {
                                count: stats.inReview.toLocaleString('hu-HU'),
                              }),
                            }
                          : {})}
                        icon={<EyeIcon className="h-7 w-7" aria-hidden="true" />}
                        color="info"
                        onClick={() => handleMetricClick('sent')}
                        isEmpty={stats.inReview === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noInReview')}
                      />

                      {/* Sent Offers */}
                      <MetricCard
                        label={t('dashboard.metrics.sent.label')}
                        value={stats.sent.toLocaleString('hu-HU')}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.sent.helper', {
                                sent: stats.sent.toLocaleString('hu-HU'),
                                pending: stats.inReview.toLocaleString('hu-HU'),
                              }),
                            }
                          : {})}
                        icon={<PaperAirplaneIcon className="h-7 w-7" aria-hidden="true" />}
                        color="info"
                        onClick={() => handleMetricClick('sent')}
                        isEmpty={stats.sent === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noSent')}
                      />

                      {/* Accepted Offers */}
                      <MetricCard
                        label={t('dashboard.metrics.accepted.label')}
                        value={stats.accepted.toLocaleString('hu-HU')}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.accepted.helper', {
                                accepted: stats.accepted.toLocaleString('hu-HU'),
                                rate: acceptanceLabel,
                              }),
                            }
                          : {})}
                        icon={<DocumentCheckIcon className="h-7 w-7" aria-hidden="true" />}
                        color="success"
                        trend={
                          stats.acceptanceRate !== null && stats.acceptanceRate > 50
                            ? 'up'
                            : stats.acceptanceRate !== null && stats.acceptanceRate < 30
                              ? 'down'
                              : 'neutral'
                        }
                        {...(acceptanceLabel !== '—' ? { trendValue: acceptanceLabel } : {})}
                        onClick={() => handleMetricClick('accepted')}
                        isEmpty={stats.accepted === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noAccepted')}
                      />

                      {/* Lost Offers - NEW */}
                      <MetricCard
                        label={t('dashboard.metrics.lost.label')}
                        value={stats.lost.toLocaleString('hu-HU')}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.lost.helper', {
                                count: stats.lost.toLocaleString('hu-HU'),
                              }),
                            }
                          : {})}
                        icon={<XCircleIcon className="h-7 w-7" aria-hidden="true" />}
                        color="danger"
                        onClick={() => handleMetricClick('lost')}
                        isEmpty={stats.lost === 0}
                        emptyMessage={t('dashboard.metrics.emptyMessages.noLost')}
                      />

                      {/* Win Rate - NEW */}
                      <MetricCard
                        label={t('dashboard.metrics.winRate.label')}
                        value={winRateLabel}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.winRate.helper', {
                                rate: winRateLabel !== '—' ? winRateLabel : '—',
                              }),
                            }
                          : {})}
                        icon={<ChartBarIcon className="h-7 w-7" aria-hidden="true" />}
                        color={
                          stats.winRate !== null && stats.winRate > 50
                            ? 'success'
                            : stats.winRate !== null && stats.winRate < 30
                              ? 'danger'
                              : 'warning'
                        }
                        trend={
                          stats.winRate !== null && stats.winRate > 50
                            ? 'up'
                            : stats.winRate !== null && stats.winRate < 30
                              ? 'down'
                              : 'neutral'
                        }
                        {...(winRateLabel !== '—' ? { trendValue: winRateLabel } : {})}
                        isEmpty={stats.winRate === null}
                        emptyMessage={t('dashboard.metrics.emptyMessages.insufficientData')}
                      />

                      {/* Average Decision Time */}
                      <MetricCard
                        label={t('dashboard.metrics.avgDecision.label')}
                        value={avgDecisionLabel}
                        {...(metricsViewMode === 'detailed'
                          ? {
                              helper: t('dashboard.metrics.avgDecision.helper', {
                                days:
                                  stats.avgDecisionDays !== null
                                    ? stats.avgDecisionDays.toLocaleString('hu-HU', {
                                        maximumFractionDigits: 1,
                                      })
                                    : '—',
                                drafts: stats.drafts.toLocaleString('hu-HU'),
                              }),
                            }
                          : {})}
                        icon={<ClockIcon className="h-7 w-7" aria-hidden="true" />}
                        color="warning"
                        isEmpty={stats.avgDecisionDays === null}
                        emptyMessage={t('dashboard.metrics.emptyMessages.insufficientData')}
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
                    placeholder="Keresés ajánlat címe vagy cég neve alapján..."
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

                {/* Quick Filter Chips - Simplified design */}
                <div
                  className="flex flex-wrap items-center gap-3"
                  role="group"
                  aria-label={t('dashboard.filters.status.label')}
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {t('dashboard.filters.status.label')}:
                  </span>
                  {STATUS_FILTER_OPTIONS.map((status) => {
                    // Calculate counts from offers matching current search/industry filters (but not status)
                    const baseFiltered = offers.filter((o) => {
                      const matchesSearch =
                        !q.trim() ||
                        o.title?.toLowerCase().includes(q.toLowerCase()) ||
                        (o.recipient?.company_name || '').toLowerCase().includes(q.toLowerCase());
                      return matchesSearch;
                    });
                    const count =
                      status === 'all'
                        ? baseFiltered.length
                        : baseFiltered.filter((o) => o.status === status).length;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
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
                            setStatusFilter(nextStatus);
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
                            setStatusFilter(STATUS_FILTER_OPTIONS[0]);
                            setTimeout(() => {
                              const buttons = Array.from(
                                e.currentTarget.parentElement?.querySelectorAll('button') || [],
                              );
                              buttons[0]?.focus();
                            }, 0);
                          }
                          if (e.key === 'End') {
                            e.preventDefault();
                            const lastStatus =
                              STATUS_FILTER_OPTIONS[STATUS_FILTER_OPTIONS.length - 1];
                            setStatusFilter(lastStatus);
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
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                          statusFilter === status
                            ? 'bg-teal-500 text-white shadow-sm'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
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
                                  ? 'bg-amber-500'
                                  : status === 'sent'
                                    ? 'bg-blue-500'
                                    : status === 'accepted'
                                      ? 'bg-emerald-500'
                                      : 'bg-rose-500'
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-4 border-t border-border/60">
                  <div className="flex flex-wrap items-end gap-3 flex-1">
                    {teamIds.length > 0 && (
                      <Select
                        label="Ajánlat szűrő"
                        value={offerFilter}
                        onChange={(e) => {
                          const value = e.target.value as OfferFilter;
                          setOfferFilter(value);
                          if (value !== 'member') {
                            setTeamMemberFilter([]);
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
                              setTeamMemberFilter([value]);
                            } else {
                              setTeamMemberFilter([]);
                              setOfferFilter('all');
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
                        if (isSortByValue(value)) setSortBy(value);
                      }}
                      className="min-w-[160px]"
                      wrapperClassName="flex-1 sm:flex-none"
                    >
                      <option value="created">
                        {t('dashboard.filters.sortBy.options.created')}
                      </option>
                      <option value="status">{t('dashboard.filters.sortBy.options.status')}</option>
                      <option value="title">{t('dashboard.filters.sortBy.options.title')}</option>
                      <option value="recipient">
                        {t('dashboard.filters.sortBy.options.recipient')}
                      </option>
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
                {(q.trim() || statusFilter !== 'all') && (
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQ('');
                        setStatusFilter('all');
                      }}
                      className="text-xs"
                    >
                      {t('dashboard.filters.clearAll')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Skeleton Loaders - Mobile optimized */}
            {loading && (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                aria-busy="true"
                aria-live="polite"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <OfferCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Enhanced Empty State - Improved accessibility and mobile design */}
            {!loading && filtered.length === 0 && (
              <Card
                className="flex flex-col items-center justify-center gap-6 md:gap-8 p-12 md:p-16 text-center"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="relative">
                  <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                    <DocumentTextIcon
                      className="h-10 w-10 md:h-12 md:w-12 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm">
                    <MagnifyingGlassIcon
                      className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="space-y-3 max-w-md">
                  <h3 className="text-lg md:text-xl font-bold text-fg">{emptyMessage}</h3>
                  {noOffersLoaded ? (
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
                  {noOffersLoaded && (
                    <Link
                      href="/new"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-primary-ink shadow-lg transition-all hover:brightness-110 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
                    >
                      <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
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
                      }}
                      className="min-w-[140px]"
                    >
                      Szűrők törlése
                    </Button>
                  )}
                </div>
              </Card>
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
                        onMarkSent={(offer, date) => markSent(offer, date)}
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
          </>
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
  );
}
