'use client';

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

/** PDF storage path extractor (változatlan logika) */
function extractOfferStoragePath(pdfUrl: string): string | null {
  const normalized = pdfUrl.trim();
  if (!normalized) return null;

  const removeLeadingSlash = (value: string) => value.replace(/^\/+/, '');

  const decodeAndNormalize = (value: string): string | null => {
    if (!value) return null;
    try {
      return removeLeadingSlash(decodeURIComponent(value));
    } catch (error) {
      console.warn('Failed to decode offer PDF storage path', error);
      return removeLeadingSlash(value);
    }
  };

  const tryFromUrl = (): string | null => {
    try {
      const url = new URL(normalized);
      const markerVariants = [
        '/object/public/offers/',
        '/object/sign/offers/',
        '/object/offers/',
      ];

      for (const marker of markerVariants) {
        const markerIndex = url.pathname.indexOf(marker);
        if (markerIndex !== -1) {
          const extracted = url.pathname.slice(markerIndex + marker.length);
          if (extracted) return decodeAndNormalize(extracted);
        }
      }

      const segments = url.pathname.split('/');
      const offersIndex = segments.indexOf('offers');
      if (offersIndex !== -1 && offersIndex < segments.length - 1) {
        return decodeAndNormalize(segments.slice(offersIndex + 1).join('/'));
      }
    } catch (error) {
      if (normalized.includes('://')) console.warn('Failed to parse offer PDF storage path', error);
    }
    return null;
  };

  const tryFromEncodedMarker = (): string | null => {
    const encodedMarker = 'offers%2F';
    const markerIndex = normalized.indexOf(encodedMarker);
    if (markerIndex !== -1) {
      return decodeAndNormalize(normalized.slice(markerIndex + encodedMarker.length));
    }
    return null;
  };

  const tryFromPlainPath = (): string | null => {
    if (!normalized.includes('://')) {
      const cleaned = normalized.replace(/^public\/?offers\/?/, '');
      return removeLeadingSlash(cleaned);
    }
    return null;
  };

  return tryFromUrl() ?? tryFromEncodedMarker() ?? tryFromPlainPath();
}

/** Státusz labellek (HU) */
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

/** Penpot-szerű, semantic tokenes státusz badge */
function StatusBadge({ status }: { status: Offer['status'] }) {
  const map: Record<Offer['status'], string> = {
    draft: 'border-border bg-bg text-fg-muted',
    sent: 'border-accent/30 bg-accent/10 text-accent',
    accepted: 'border-success/30 bg-success/10 text-success',
    lost: 'border-danger/30 bg-danger/10 text-danger',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tabular ${map[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Egyszerű metrika kártya semantic tokenekkel */
function MetricCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fg-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-fg">{value}</p>
      {helper ? <p className="mt-2 text-xs text-fg-muted">{helper}</p> : null}
    </Card>
  );
}

/** Idővonal-szerű státusz lépés (semantic + focusbarát) */
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
    <Card
      className={`flex gap-3 px-4 py-3 ${
        highlight ? 'bg-bg' : 'bg-bg/70 shadow-none'
      }`}
    >
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${highlight ? 'bg-primary' : 'bg-fg-muted/40'}`} />
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-fg">{title}</p>
          <span className="text-xs uppercase tracking-[0.25em] text-fg-muted">{dateLabel || '—'}</span>
        </div>
        <p className="text-xs text-fg-muted">{description}</p>
        {children}
      </div>
    </Card>
  );
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
  if (!offer) return null;

  const labelId = `delete-offer-title-${offer.id}`;
  const descriptionId = `delete-offer-description-${offer.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-fg/20 px-4 py-6"
      onClick={() => { if (!isDeleting) onCancel(); }}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        as="div"
        className="w-full max-w-md bg-bg p-6 shadow-pop backdrop-blur"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
            Figyelmeztetés
          </div>
          <h2 id={labelId} className="text-lg font-semibold text-fg">
            Ajánlat törlése
          </h2>
          <p id={descriptionId} className="text-sm leading-6 text-fg-muted">
            Biztosan törlöd a(z) „{offer.title || '(névtelen)'}” ajánlatot? Ez a művelet nem visszavonható, és minden kapcsolódó adat véglegesen el fog veszni.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={() => { if (!isDeleting) onCancel(); }}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:border-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mégse
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:brightness-95"
          >
            {isDeleting ? 'Törlés…' : 'Ajánlat törlése'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Dátum utilok (változatlan logika) */
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

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

    if (error) throw error;

    return {
      items: Array.isArray(data) ? (data as Offer[]) : [],
      count: typeof count === 'number' ? count : null,
    };
  }, [sb]);

  useEffect(() => {
    let active = true;
    if (authStatus !== 'authenticated' || !user) {
      return () => { active = false; };
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
        const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt az ajánlatok betöltésekor.';
        showToast({ title: 'Ajánlatok betöltése sikertelen', description: message, variant: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialPage();
    return () => { active = false; };
  }, [authStatus, fetchPage, showToast, sb, user]);

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
      const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt az ajánlatok betöltésekor.';
      showToast({ title: 'További ajánlatok betöltése sikertelen', description: message, variant: 'error' });
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
      if (error) throw error;
      setOffers((prev) => prev.map((item) => (item.id === offer.id ? { ...item, ...patch } : item)));
    } catch (error) {
      console.error('Offer status update failed', error);
      const message = error instanceof Error ? error.message : 'Nem sikerült frissíteni az ajánlat állapotát. Próbáld újra.';
      showToast({ title: 'Állapot frissítése sikertelen', description: message, variant: 'error' });
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
    if (!offer.sent_at) patch.sent_at = timestamp.toISOString();
    await applyPatch(offer, patch);
  }

  async function revertToSent(offer: Offer) {
    const patch: Partial<Offer> = { status: 'sent', decision: null, decided_at: null };
    if (!offer.sent_at) patch.sent_at = new Date().toISOString();
    await applyPatch(offer, patch);
  }

  async function revertToDraft(offer: Offer) {
    const patch: Partial<Offer> = { status: 'draft', sent_at: null, decided_at: null, decision: null };
    await applyPatch(offer, patch);
  }

  const confirmDeleteOffer = useCallback(async () => {
    if (!offerToDelete) return;

    setDeletingId(offerToDelete.id);
    try {
      const storagePaths = new Set<string>();
      if (offerToDelete.pdf_url) {
        const storagePathFromUrl = extractOfferStoragePath(offerToDelete.pdf_url);
        if (storagePathFromUrl) storagePaths.add(storagePathFromUrl);
      }
      if (userId) storagePaths.add(`${userId}/${offerToDelete.id}.pdf`);

      const { error } = await sb.from('offers').delete().eq('id', offerToDelete.id);
      if (error) throw error;

      const storagePathList = Array.from(storagePaths).filter(Boolean);
      if (storagePathList.length > 0) {
        const { error: storageError } = await sb.storage.from('offers').remove(storagePathList);
        if (storageError) console.error('Failed to delete offer PDF from storage', storageError);
      }

      setOffers((prev) => prev.filter((item) => item.id !== offerToDelete.id));
      setTotalCount((prev) => (typeof prev === 'number' ? Math.max(prev - 1, 0) : prev));
      showToast({ title: 'Ajánlat törölve', description: 'Az ajánlat véglegesen eltávolításra került.', variant: 'success' });
    } catch (error) {
      console.error('Failed to delete offer', error);
      const message = error instanceof Error ? error.message : 'Nem sikerült törölni az ajánlatot. Próbáld újra.';
      showToast({ title: 'Törlés sikertelen', description: message, variant: 'error' });
    } finally {
      setDeletingId(null);
      setOfferToDelete(null);
    }
  }, [offerToDelete, sb, showToast, userId]);

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
      list = list.filter(o =>
        o.title?.toLowerCase().includes(t) ||
        (o.recipient?.company_name || '').toLowerCase().includes(t)
      );
    }

    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (industryFilter !== 'all') list = list.filter(o => o.industry === industryFilter);

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
      const sentAt = offer.sent_at ? new Date(offer.sent_at).getTime() : (offer.created_at ? new Date(offer.created_at).getTime() : NaN);
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
              return { ...item, ...updated, recipient: updated.recipient !== undefined ? updated.recipient : item.recipient };
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
              setTotalCount((prevCount) => (typeof prevCount === 'number' ? Math.max(prevCount - 1, 0) : prevCount));
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, [authStatus, sb, user]);

  /** Derived UI szövegek */
  const acceptanceLabel = stats.acceptanceRate !== null
    ? `${stats.acceptanceRate.toLocaleString('hu-HU', { maximumFractionDigits: 1 })}%`
    : '—';
  const avgDecisionLabel = stats.avgDecisionDays !== null
    ? `${stats.avgDecisionDays.toLocaleString('hu-HU', { maximumFractionDigits: 1 })} nap`
    : '—';
  const totalOffersCount = totalCount ?? stats.total;
  const displayedCount = totalCount !== null ? Math.min(offers.length, totalCount) : offers.length;
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
    <>
      <AppFrame
        title="Ajánlatok"
        description="Keresés, szűrés és státuszkezelés egy helyen — átlátható kártyákkal."
        actions={(
          <Link
            href="/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-ink shadow-sm transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            + Új ajánlat
          </Link>
        )}
      >
        {/* Metrikák */}
        <section className="grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Létrehozott ajánlatok" value={totalOffersCount.toLocaleString('hu-HU')} helper={totalHelper} />
          <MetricCard label="Kiküldött ajánlatok" value={stats.sent.toLocaleString('hu-HU')} helper={`${stats.inReview.toLocaleString('hu-HU')} ajánlat döntésre vár`} />
          <MetricCard label="Elfogadott ajánlatok" value={stats.accepted.toLocaleString('hu-HU')} helper={`Elfogadási arány: ${acceptanceLabel}`} />
          <MetricCard label="Átlagos döntési idő" value={avgDecisionLabel} helper={`${stats.drafts.toLocaleString('hu-HU')} vázlat készül`} />
        </section>

        {/* Szűrők */}
        <Card as="section">
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="flex-1">
              <Input
                label="Keresés"
                placeholder="Ajánlat cím vagy cég…"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="shadow-sm text-sm"
              />
            </div>

            <div className="grid flex-none grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              <Select
                label="Állapot"
                value={statusFilter}
                onChange={e => {
                  const value = e.target.value;
                  if (isStatusFilterValue(value)) setStatusFilter(value);
                }}
                className="shadow-sm text-sm"
              >
                <option value="all">Mind</option>
                <option value="draft">Vázlat</option>
                <option value="sent">Kiküldve</option>
                <option value="accepted">Elfogadva</option>
                <option value="lost">Elutasítva</option>
              </Select>

              <Select
                label="Iparág"
                value={industryFilter}
                onChange={e => setIndustryFilter(e.target.value)}
                className="shadow-sm text-sm"
              >
                <option value="all">Mind</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </Select>

              <Select
                label="Rendezés"
                value={sortBy}
                onChange={e => {
                  const value = e.target.value;
                  if (isSortByValue(value)) setSortBy(value);
                }}
                className="shadow-sm text-sm"
              >
                <option value="created">Dátum</option>
                <option value="status">Állapot</option>
                <option value="title">Ajánlat neve</option>
                <option value="recipient">Címzett</option>
                <option value="industry">Iparág</option>
              </Select>

              <Select
                label="Irány"
                value={sortDir}
                onChange={e => {
                  const value = e.target.value;
                  if (isSortDirectionValue(value)) setSortDir(value);
                }}
                className="shadow-sm text-sm"
              >
                <option value="desc">Csökkenő</option>
                <option value="asc">Növekvő</option>
              </Select>
            </div>
            </div>
        </Card>

        {/* Skeletonok */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <Card className="space-y-4 border-dashed bg-bg/70 p-12 text-center text-fg-muted shadow-none">
            <p>{emptyMessage}</p>
            {hasMore ? (
              <LoadMoreButton appearance="outline" onClick={handleLoadMore} isLoading={isLoadingMore} />
            ) : null}
          </Card>
        )}

        {/* Lista */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((o) => {
                const isUpdating = updatingId === o.id;
                const isDeleting = deletingId === o.id;
                const isBusy = isUpdating || isDeleting;
                const isDecided = o.status === 'accepted' || o.status === 'lost';

                return (
                  <Card
                    key={o.id}
                    className="group flex h-full flex-col bg-bg/80 p-5 transition hover:-translate-y-0.5 hover:shadow-pop"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold text-fg">{o.title || '(névtelen)'}</p>
                        <p className="truncate text-sm text-fg-muted">{(o.recipient?.company_name || '').trim() || '—'}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>

                    <dl className="space-y-2 text-sm text-fg-muted">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="">Létrehozva</dt>
                        <dd className="font-medium text-fg">{formatDate(o.created_at)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="">Iparág</dt>
                        <dd className="font-medium text-fg">{o.industry || 'Ismeretlen'}</dd>
                      </div>
                      {o.pdf_url ? (
                        <div className="flex items-center justify-between gap-4">
                          <dt className="">Export</dt>
                          <dd>
                            <a
                              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-fg transition hover:border-fg hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                          <div className="flex flex-wrap items-center gap-2 text-xs text-fg">
                            <div className="flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5">
                              <span>Dátum módosítása</span>
                              <Input
                                type="date"
                                value={isoDateInput(o.sent_at)}
                                onChange={e => markSent(o, e.target.value)}
                                disabled={isBusy}
                                wrapperClassName="flex items-center gap-2"
                                className="rounded-lg border-border bg-bg px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 text-xs text-fg">
                            <Button
                              onClick={() => markSent(o)}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-ink shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              Jelölés (ma)
                            </Button>
                            <div className="flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5">
                              <span>Dátum választása</span>
                              <Input
                                type="date"
                                onChange={e => {
                                  if (!e.target.value) return;
                                  markSent(o, e.target.value);
                                }}
                                disabled={isBusy}
                                wrapperClassName="flex items-center gap-2"
                                className="rounded-lg border-border bg-bg px-2 py-1 text-xs"
                              />
                            </div>
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
                          <div className="flex flex-wrap items-center gap-2 text-xs text-fg">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                                o.status === 'accepted'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {DECISION_LABELS[o.status]}
                            </span>
                            <div className="flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5">
                              <span>Döntés dátuma</span>
                              <Input
                                type="date"
                                value={isoDateInput(o.decided_at)}
                                onChange={e => markDecision(o, o.status as 'accepted' | 'lost', e.target.value)}
                                disabled={isBusy}
                                wrapperClassName="flex items-center gap-2"
                                className="rounded-lg border-border bg-bg px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 text-xs text-fg">
                            <Button
                              onClick={() => markDecision(o, 'accepted')}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-full border border-success/30 bg-success/10 px-3 py-1.5 font-semibold text-success transition hover:border-success/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Megjelölés: Elfogadva
                            </Button>
                            <Button
                              onClick={() => markDecision(o, 'lost')}
                              disabled={isBusy}
                              className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 font-semibold text-danger transition hover:border-danger/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Megjelölés: Elutasítva
                            </Button>
                          </div>
                        )}
                      </StatusStep>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs text-fg">
                      {o.status !== 'draft' && (
                        <Button
                          onClick={() => revertToDraft(o)}
                          disabled={isBusy}
                          className="inline-flex items-center rounded-full border border-border px-3 py-1.5 font-semibold text-fg transition hover:border-fg hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Vissza vázlatba
                        </Button>
                      )}
                      {isDecided && (
                        <Button
                          onClick={() => revertToSent(o)}
                          disabled={isBusy}
                          className="inline-flex items-center rounded-full border border-border px-3 py-1.5 font-semibold text-fg transition hover:border-fg hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Döntés törlése
                        </Button>
                      )}
                      <Button
                        onClick={() => setOfferToDelete(o)}
                        disabled={isBusy}
                        className="inline-flex items-center rounded-full border border-danger/30 bg-danger/10 px-3 py-1.5 font-semibold text-danger transition hover:border-danger/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? 'Törlés…' : 'Ajánlat törlése'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              {paginationSummary ? (
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-fg-muted">{paginationSummary}</p>
              ) : null}
              {hasMore ? (
                <LoadMoreButton onClick={handleLoadMore} isLoading={isLoadingMore} />
              ) : (
                <p className="text-xs text-fg-muted">Az összes ajánlat megjelenítve.</p>
              )}
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
