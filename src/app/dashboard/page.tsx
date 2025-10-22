'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { useToast } from '@/components/ToastProvider';
import { LoadMoreButton, PAGE_SIZE, mergeOfferPages } from './offersPagination';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';

type Offer = {
  id: string;
  title: string;
  industry: string;
  status: 'draft' | 'sent' | 'accepted' | 'lost';
  created_at: string | null;
  sent_at: string | null;
  decided_at: string | null;
  decision: 'accepted' | 'lost' | null;
  pdf_url: string | null;
  recipient_id: string | null;
  recipient?: { company_name: string | null } | null;
};


const STATUS_LABELS: Record<Offer['status'], string> = {
  draft: 'Vázlat',
  sent: 'Kiküldve',
  accepted: 'Elfogadva',
  lost: 'Elutasítva',
};

const DECISION_LABELS: Record<'accepted' | 'lost', string> = {
  accepted: 'Elfogadva',
  lost: 'Elutasítva',
};

const STATUS_FILTER_OPTIONS = ['all', 'draft', 'sent', 'accepted', 'lost'] as const;
type StatusFilterOption = typeof STATUS_FILTER_OPTIONS[number];
const SORT_BY_OPTIONS = ['created', 'status', 'title', 'recipient', 'industry'] as const;
type SortByOption = typeof SORT_BY_OPTIONS[number];
const SORT_DIRECTION_OPTIONS = ['desc', 'asc'] as const;
type SortDirectionOption = typeof SORT_DIRECTION_OPTIONS[number];

function isStatusFilterValue(value: string): value is StatusFilterOption {
  return (STATUS_FILTER_OPTIONS as readonly string[]).includes(value);
}

function isSortByValue(value: string): value is SortByOption {
  return (SORT_BY_OPTIONS as readonly string[]).includes(value);
}

function isSortDirectionValue(value: string): value is SortDirectionOption {
  return (SORT_DIRECTION_OPTIONS as readonly string[]).includes(value);
}

function StatusBadge({ status }: { status: Offer['status'] }) {
  const map: Record<Offer['status'], string> = {
    draft: 'border-slate-200 bg-slate-50 text-slate-600',
    sent: 'border-sky-200 bg-sky-50 text-sky-700',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    lost: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tabular ${map[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function StatusStep({
  title,
  description,
  dateLabel,
  highlight = false,
  children,
}: {
  title: string;
  description: string;
  dateLabel: string;
  highlight?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border px-4 py-3 ${
        highlight ? 'border-slate-900/15 bg-white/90 shadow-sm' : 'border-slate-200/60 bg-white/60'
      }`}
    >
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${highlight ? 'bg-slate-900' : 'bg-slate-300'}`} />
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <span className="text-xs uppercase tracking-wide text-slate-400">{dateLabel || '—'}</span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
        {children}
      </div>
    </div>
  );
}

function isoDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const sb = useSupabase();
  const { status: authStatus, user } = useRequireAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByOption>('created');
  const [sortDir, setSortDir] = useState<SortDirectionOption>('desc');

  const fetchPage = useCallback(async (
    user: string,
    pageNumber: number,
  ): Promise<{ items: Offer[]; count: number | null }> => {
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

    if (error) {
      throw error;
    }

    return {
      items: Array.isArray(data) ? (data as Offer[]) : [],
      count: typeof count === 'number' ? count : null,
    };
  }, [sb]);

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
        if (!active) {
          return;
        }
        setOffers(items);
        setPageIndex(0);
        setTotalCount(count);
      } catch (error) {
        console.error('Failed to load offers', error);
        const message = error instanceof Error
          ? error.message
          : 'Ismeretlen hiba történt az ajánlatok betöltésekor.';
        showToast({
          title: 'Ajánlatok betöltése sikertelen',
          description: message,
          variant: 'error',
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialPage();

    return () => {
      active = false;
    };
  }, [authStatus, fetchPage, showToast, sb, user]);

  const hasMore = totalCount !== null ? offers.length < totalCount : false;

  const handleLoadMore = useCallback(async () => {
    if (!userId || isLoadingMore || !hasMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const nextPage = pageIndex + 1;
      const { items, count } = await fetchPage(userId, nextPage);
      setOffers((prev) => mergeOfferPages(prev, items));
      if (count !== null) {
        setTotalCount(count);
      }
      setPageIndex(nextPage);
    } catch (error) {
      console.error('Failed to load offers', error);
      const message = error instanceof Error
        ? error.message
        : 'Ismeretlen hiba történt az ajánlatok betöltésekor.';
      showToast({
        title: 'További ajánlatok betöltése sikertelen',
        description: message,
        variant: 'error',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoadingMore, pageIndex, showToast, userId]);

  const industries = useMemo(() => {
    const s = new Set<string>();
    offers.forEach(o => { if (o.industry) s.add(o.industry); });
    return Array.from(s).sort();
  }, [offers]);

  async function applyPatch(offer: Offer, patch: Partial<Offer>) {
    setUpdatingId(offer.id);
    try {
      const { error } = await sb.from('offers').update(patch).eq('id', offer.id);
      if (error) {
        throw error;
      }
      setOffers((prev) => prev.map((item) => (item.id === offer.id ? { ...item, ...patch } : item)));
    } catch (error) {
      console.error('Offer status update failed', error);
      const message = error instanceof Error
        ? error.message
        : 'Nem sikerült frissíteni az ajánlat állapotát. Próbáld újra.';
      showToast({
        title: 'Állapot frissítése sikertelen',
        description: message,
        variant: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  }

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
    if (!offer.sent_at) {
      patch.sent_at = timestamp.toISOString();
    }
    await applyPatch(offer, patch);
  }

  async function revertToSent(offer: Offer) {
    const patch: Partial<Offer> = {
      status: 'sent',
      decision: null,
      decided_at: null,
    };
    if (!offer.sent_at) {
      patch.sent_at = new Date().toISOString();
    }
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

  const filtered = useMemo(() => {
    let list = offers.slice();

    // kereső: cím vagy cég
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(o =>
        o.title?.toLowerCase().includes(t) ||
        (o.recipient?.company_name || '').toLowerCase().includes(t)
      );
    }

    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (industryFilter !== 'all') list = list.filter(o => o.industry === industryFilter);

    // rendezés
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'status': return dir * a.status.localeCompare(b.status);
        case 'title': return dir * (a.title || '').localeCompare(b.title || '');
        case 'recipient': return dir * ((a.recipient?.company_name || '').localeCompare(b.recipient?.company_name || ''));
        case 'industry': return dir * (a.industry || '').localeCompare(b.industry || '');
        case 'created':
        default:
          return dir * ((new Date(a.created_at || 0)).getTime() - (new Date(b.created_at || 0)).getTime());
      }
    });

    return list;
  }, [offers, q, statusFilter, industryFilter, sortBy, sortDir]);

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
      const sentAt = offer.sent_at ? new Date(offer.sent_at).getTime() : (offer.created_at ? new Date(offer.created_at).getTime() : NaN);
      if (!Number.isFinite(decided) || !Number.isFinite(sentAt)) return;
      const diffDays = (decided - sentAt) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0) {
        decisionDurations.push(diffDays);
      }
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

  const acceptanceLabel = stats.acceptanceRate !== null
    ? `${stats.acceptanceRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
    : '—';
  const avgDecisionLabel = stats.avgDecisionDays !== null
    ? `${stats.avgDecisionDays.toLocaleString('hu-HU', { maximumFractionDigits: 1 })} nap`
    : '—';
  const totalOffersCount = totalCount ?? stats.total;
  const displayedCount = totalCount !== null
    ? Math.min(offers.length, totalCount)
    : offers.length;
  const monthlyHelper = `Ebben a hónapban ${stats.createdThisMonth.toLocaleString('hu-HU')} új ajánlat`;
  const totalHelper = totalCount !== null
    ? `Megjelenítve ${displayedCount.toLocaleString('hu-HU')} / ${totalCount.toLocaleString('hu-HU')} ajánlat • ${monthlyHelper}`
    : monthlyHelper;
  const paginationSummary = totalCount !== null
    ? `Megjelenítve ${displayedCount.toLocaleString('hu-HU')} / ${totalCount.toLocaleString('hu-HU')} ajánlat`
    : null;
  const noOffersLoaded = !loading && offers.length === 0;
  const emptyMessage = noOffersLoaded
    ? 'Még nem hoztál létre ajánlatokat. Kezdd egy újjal a „+ Új ajánlat” gombbal.'
    : 'Nincs találat. Próbálj másik keresést vagy szűrőt.';

  return (
    <AppFrame
      title="Ajánlatok"
      description="Keresés, szűrés és státuszkezelés átlátható kártyákon."
      actions={(
        <a
          href="/new"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          + Új ajánlat
        </a>
      )}
    >
      <section className="grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Létrehozott ajánlatok"
          value={totalOffersCount.toLocaleString('hu-HU')}
          helper={totalHelper}
        />
        <MetricCard
          label="Kiküldött ajánlatok"
          value={stats.sent.toLocaleString('hu-HU')}
          helper={`${stats.inReview.toLocaleString('hu-HU')} ajánlat döntésre vár`}
        />
        <MetricCard
          label="Elfogadott ajánlatok"
          value={stats.accepted.toLocaleString('hu-HU')}
          helper={`Elfogadási arány: ${acceptanceLabel}`}
        />
        <MetricCard
          label="Átlagos döntési idő"
          value={avgDecisionLabel}
          helper={`${stats.drafts.toLocaleString('hu-HU')} vázlat készül`}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Keresés</label>
            <input
              placeholder="Ajánlat cím vagy cég…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="grid flex-none grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Állapot</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isStatusFilterValue(value)) {
                    setStatusFilter(value);
                  }
                }}
              >
                <option value="all">Mind</option>
                <option value="draft">Vázlat</option>
                <option value="sent">Kiküldve</option>
                <option value="accepted">Elfogadva</option>
                <option value="lost">Elutasítva</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Iparág</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="all">Mind</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Rendezés</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
                value={sortBy}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isSortByValue(value)) {
                    setSortBy(value);
                  }
                }}
              >
                <option value="created">Dátum</option>
                <option value="status">Állapot</option>
                <option value="title">Ajánlat neve</option>
                <option value="recipient">Címzett</option>
                <option value="industry">Iparág</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Irány</label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm"
                value={sortDir}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isSortDirectionValue(value)) {
                    setSortDir(value);
                  }
                }}
              >
                <option value="desc">Csökkenő</option>
                <option value="asc">Növekvő</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm">
              <div className="mb-4 h-4 w-3/5 rounded-full bg-slate-200" />
              <div className="mb-6 h-3 w-2/5 rounded-full bg-slate-100" />
              <div className="h-10 rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="space-y-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-500">
          <p>{emptyMessage}</p>
          {hasMore ? (
            <LoadMoreButton
              appearance="outline"
              onClick={handleLoadMore}
              isLoading={isLoadingMore}
            />
          ) : null}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => {
            const isUpdating = updatingId === o.id;
            const isDecided = o.status === 'accepted' || o.status === 'lost';
            return (
              <div
                key={o.id}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-base font-semibold text-slate-900">{o.title || '(névtelen)'}</p>
                    <p className="truncate text-sm text-slate-500">{(o.recipient?.company_name || '').trim() || '—'}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <dl className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Létrehozva</dt>
                    <dd className="font-medium text-slate-700">{formatDate(o.created_at)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-400">Iparág</dt>
                    <dd className="font-medium text-slate-700">{o.industry || 'Ismeretlen'}</dd>
                  </div>
                  {o.pdf_url ? (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-400">Export</dt>
                      <dd>
                        <a
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                          href={o.pdf_url}
                          target="_blank"
                        >
                          PDF megnyitása
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-6 space-y-3">
                  <StatusStep
                    title="Kiküldve az ügyfélnek"
                    description="Add meg, mikor küldted el az ajánlatot."
                    dateLabel={formatDate(o.sent_at)}
                    highlight={o.status !== 'draft'}
                  >
                    {o.sent_at ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                          <span>Dátum módosítása</span>
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-slate-300 focus:outline-none"
                            value={isoDateInput(o.sent_at)}
                            onChange={(e) => markSent(o, e.target.value)}
                            disabled={isUpdating}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <button
                          onClick={() => markSent(o)}
                          disabled={isUpdating}
                          className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          Jelölés (ma)
                        </button>
                        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                          <span>Dátum választása</span>
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-slate-300 focus:outline-none"
                            onChange={(e) => {
                              if (!e.target.value) return;
                              markSent(o, e.target.value);
                            }}
                            disabled={isUpdating}
                          />
                        </label>
                      </div>
                    )}
                  </StatusStep>

                  <StatusStep
                    title="Ügyfél döntése"
                    description="Jegyezd fel, hogy elfogadták vagy elutasították az ajánlatot."
                    dateLabel={isDecided ? formatDate(o.decided_at) : '—'}
                    highlight={isDecided}
                  >
                    {isDecided ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                            o.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {DECISION_LABELS[o.status]}
                        </span>
                        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                          <span>Döntés dátuma</span>
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-slate-300 focus:outline-none"
                            value={isoDateInput(o.decided_at)}
                            onChange={(e) => markDecision(o, o.status as 'accepted' | 'lost', e.target.value)}
                            disabled={isUpdating}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <button
                          onClick={() => markDecision(o, 'accepted')}
                          disabled={isUpdating}
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Megjelölés: Elfogadva
                        </button>
                        <button
                          onClick={() => markDecision(o, 'lost')}
                          disabled={isUpdating}
                          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Megjelölés: Elutasítva
                        </button>
                      </div>
                    )}
                  </StatusStep>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                  {o.status !== 'draft' && (
                    <button
                      onClick={() => revertToDraft(o)}
                      disabled={isUpdating}
                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Vissza vázlatba
                    </button>
                  )}
                  {isDecided && (
                    <button
                      onClick={() => revertToSent(o)}
                      disabled={isUpdating}
                      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Döntés törlése
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            {paginationSummary ? (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{paginationSummary}</p>
            ) : null}
            {hasMore ? (
              <LoadMoreButton
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
              />
            ) : (
              <p className="text-xs text-slate-400">Az összes ajánlat megjelenítve.</p>
            )}
          </div>
        </>
      )}
    </AppFrame>
  );
}
