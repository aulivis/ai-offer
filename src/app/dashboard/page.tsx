'use client';

import { t } from '@/copy';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useToast } from '@/components/ToastProvider';
import { LoadMoreButton, PAGE_SIZE, mergeOfferPages } from './offersPagination';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { currentMonthStart } from '@/lib/services/usage';
import type { SubscriptionPlan } from '@/app/lib/offerTemplates';
import { fetchWithSupabaseAuth } from '@/lib/api';
import OfferCard from '@/components/dashboard/OfferCard';
import type { Offer } from '@/app/dashboard/types';
import { STATUS_LABEL_KEYS } from '@/app/dashboard/types';

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

/** Egyszerű metrika kártya semantic tokenekkel */
function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fg-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-fg">{value}</p>
      {helper ? <p className="mt-2 text-xs text-fg-muted">{helper}</p> : null}
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
      const { data, error, count } = await sb
        .from('offers')
        .select(
          'id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )',
          { count: 'exact' },
        )
        .eq('user_id', user)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

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
    return () => {
      active = false;
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

  /** Metrikák (változatlan logika) */
  const stats = useMemo(() => {
    const total = offers.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const createdThisMonth = offers.filter((offer) => {
      if (!offer.created_at) return false;
      const created = new Date(offer.created_at).getTime();
      return Number.isFinite(created) && created >= monthStart;
    }).length;

    const sentStatuses: Offer['status'][] = ['sent', 'accepted', 'lost'];
    const sent = offers.filter((offer) => sentStatuses.includes(offer.status)).length;
    const accepted = offers.filter((offer) => offer.status === 'accepted').length;
    const inReview = offers.filter((offer) => offer.status === 'sent').length;
    const drafts = offers.filter((offer) => offer.status === 'draft').length;

    const acceptanceRate = sent > 0 ? (accepted / sent) * 100 : null;

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
      inReview,
      drafts,
      acceptanceRate,
      avgDecisionDays,
      createdThisMonth,
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
    if (quotaSnapshot.limit === null) {
      return t('dashboard.metrics.quota.unlimitedValue');
    }
    const pendingTotal = Math.max(0, quotaSnapshot.pending);
    const remaining = Math.max(quotaSnapshot.limit - (quotaSnapshot.used + pendingTotal), 0);
    return t('dashboard.metrics.quota.value', {
      remaining: remaining.toLocaleString('hu-HU'),
      limit: quotaSnapshot.limit.toLocaleString('hu-HU'),
    });
  }, [isQuotaLoading, quotaSnapshot]);

  const quotaHelper = useMemo(() => {
    if (isQuotaLoading || !quotaSnapshot) {
      return undefined;
    }
    const confirmedLabel = quotaSnapshot.used.toLocaleString('hu-HU');
    const pendingLabel = quotaSnapshot.pending.toLocaleString('hu-HU');
    let helperText: string;
    if (quotaSnapshot.limit === null) {
      helperText = t('dashboard.metrics.quota.helperUnlimited', {
        confirmed: confirmedLabel,
        pending: pendingLabel,
      });
    } else if (quotaResetLabel) {
      helperText = t('dashboard.metrics.quota.helperLimitedWithReset', {
        confirmed: confirmedLabel,
        pending: pendingLabel,
        resetDate: quotaResetLabel,
      });
    } else {
      helperText = t('dashboard.metrics.quota.helperLimited', {
        confirmed: confirmedLabel,
        pending: pendingLabel,
      });
    }

    const helperContent =
      quotaSnapshot.devicePending !== null ? (
        <span>
          {helperText}{' '}
          <sup
            aria-label="includes device-level pending"
            className="cursor-help text-[0.65rem] text-fg-muted"
            title="includes device-level pending"
          >
            *
          </sup>
        </span>
      ) : (
        helperText
      );

    const pendingNote = t('dashboard.metrics.quota.pendingNote');

    return (
      <span className="flex flex-col gap-1">
        {typeof helperContent === 'string' ? <span>{helperContent}</span> : helperContent}
        <span className="text-[0.65rem] leading-snug text-fg-muted">{pendingNote}</span>
      </span>
    );
  }, [isQuotaLoading, quotaResetLabel, quotaSnapshot]);

  /** Derived UI szövegek */
  const acceptanceLabel =
    stats.acceptanceRate !== null
      ? `${stats.acceptanceRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
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
        {/* Metrikák */}
        <section className="grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t('dashboard.metrics.quota.label')}
            value={quotaValue}
            helper={quotaHelper}
          />
          <MetricCard
            label={t('dashboard.metrics.created.label')}
            value={totalOffersCount.toLocaleString('hu-HU')}
            helper={totalHelper}
          />
          <MetricCard
            label={t('dashboard.metrics.sent.label')}
            value={stats.sent.toLocaleString('hu-HU')}
            helper={t('dashboard.metrics.sent.helper', {
              pending: stats.inReview.toLocaleString('hu-HU'),
            })}
          />
          <MetricCard
            label={t('dashboard.metrics.accepted.label')}
            value={stats.accepted.toLocaleString('hu-HU')}
            helper={t('dashboard.metrics.accepted.helper', { rate: acceptanceLabel })}
          />
          <MetricCard
            label={t('dashboard.metrics.avgDecision.label')}
            value={avgDecisionLabel}
            helper={t('dashboard.metrics.avgDecision.helper', {
              drafts: stats.drafts.toLocaleString('hu-HU'),
            })}
          />
        </section>

        {/* Szűrők */}
        <Card as="section">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="flex-1">
              <Input
                label={t('dashboard.filters.search.label')}
                placeholder={t('dashboard.filters.search.placeholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="shadow-sm text-sm"
              />
            </div>

            <div className="grid flex-none grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              <Select
                label={t('dashboard.filters.status.label')}
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isStatusFilterValue(value)) setStatusFilter(value);
                }}
                className="shadow-sm text-sm"
              >
                <option value="all">{t('dashboard.filters.status.options.all')}</option>
                <option value="draft">{t(STATUS_LABEL_KEYS.draft)}</option>
                <option value="sent">{t(STATUS_LABEL_KEYS.sent)}</option>
                <option value="accepted">{t(STATUS_LABEL_KEYS.accepted)}</option>
                <option value="lost">{t(STATUS_LABEL_KEYS.lost)}</option>
              </Select>

              <Select
                label={t('dashboard.filters.industry.label')}
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="shadow-sm text-sm"
              >
                <option value="all">{t('dashboard.filters.industry.options.all')}</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </Select>

              <Select
                label={t('dashboard.filters.sortBy.label')}
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isSortByValue(value)) setSortBy(value);
                }}
                className="shadow-sm text-sm"
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
                className="shadow-sm text-sm"
              >
                <option value="desc">{t('dashboard.filters.sortDir.options.desc')}</option>
                <option value="asc">{t('dashboard.filters.sortDir.options.asc')}</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Skeletonok */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse p-5">
                <div className="mb-4 h-4 w-3/5 rounded-full bg-bg" />
                <div className="mb-6 h-3 w-2/5 rounded-full bg-bg" />
                <div className="h-10 rounded-2xl bg-bg" />
              </Card>
            ))}
          </div>
        )}

        {/* Üres / nincs találat */}
        {!loading && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <p className="text-sm text-fg-muted">{emptyMessage}</p>
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t('dashboard.actions.newOffer')}
            </Link>
          </Card>
        )}

        {/* Lista */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
