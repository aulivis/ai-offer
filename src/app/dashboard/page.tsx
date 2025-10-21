'use client';

import { useEffect, useMemo, useState } from 'react';
import AppFrame from '@/components/AppFrame';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

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

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  const sb = supabaseBrowser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortByOption>('created');
  const [sortDir, setSortDir] = useState<SortDirectionOption>('desc');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }

      const { data, error } = await sb
        .from('offers')
        .select('id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) {
        setOffers(Array.isArray(data) ? (data as Offer[]) : []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const industries = useMemo(() => {
    const s = new Set<string>();
    offers.forEach(o => { if (o.industry) s.add(o.industry); });
    return Array.from(s).sort();
  }, [offers]);

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

  async function updateStatus(o: Offer, next: Offer['status'], date?: string) {
    const patch: Partial<Offer> = { status: next };
    const today = date ? new Date(date) : new Date();

    if (next === 'sent') patch.sent_at = today.toISOString();
    if (next === 'accepted') { patch.decision = 'accepted'; patch.decided_at = today.toISOString(); }
    if (next === 'lost') { patch.decision = 'lost'; patch.decided_at = today.toISOString(); }

    await sb.from('offers').update(patch).eq('id', o.id);
    setOffers(prev => prev.map(x => x.id === o.id ? { ...x, ...patch } : x));
  }

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
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center text-slate-500">
          Nincs találat. Próbálj másik keresést vagy szűrőt.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
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

              <div className="mt-6 space-y-2 text-sm text-slate-500">
                {o.status !== 'sent' && (
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-600">Küldve</span>
                    <input
                      type="date"
                      className="w-36 rounded-xl border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:border-slate-300 focus:outline-none"
                      onChange={(e) => updateStatus(o, 'sent', e.target.value)}
                    />
                  </label>
                )}
                {o.status !== 'accepted' && (
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-600">Elfogadva</span>
                    <input
                      type="date"
                      className="w-36 rounded-xl border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:border-slate-300 focus:outline-none"
                      onChange={(e) => updateStatus(o, 'accepted', e.target.value)}
                    />
                  </label>
                )}
                {o.status !== 'lost' && (
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span className="font-medium text-slate-600">Elutasítva</span>
                    <input
                      type="date"
                      className="w-36 rounded-xl border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:border-slate-300 focus:outline-none"
                      onChange={(e) => updateStatus(o, 'lost', e.target.value)}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppFrame>
  );
}
