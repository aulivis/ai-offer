'use client';

import { useEffect, useMemo, useState } from 'react';
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

function StatusBadge({ status }: { status: Offer['status'] }) {
  const map: Record<Offer['status'], string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    sent: 'bg-brand-blue-500/10 text-brand-blue-600 dark:text-brand-blue-500',
    accepted: 'bg-brand-emerald-500/10 text-brand-emerald-600 dark:text-brand-emerald-500',
    lost: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular ${map[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Toolbar() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-ink-900">
      {/* A valós mezők lent, itt csak a tartó stílusát adjuk meg */}
    </div>
  );
}

export default function DashboardPage() {
  const sb = supabaseBrowser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Offer['status']>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'status' | 'title' | 'recipient' | 'industry'>('created');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }

      const { data, error } = await sb
        .from('offers')
        .select('id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setOffers((data as any[]) || []);
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
    const patch: any = { status: next };
    const today = date ? new Date(date) : new Date();

    if (next === 'sent') patch.sent_at = today.toISOString();
    if (next === 'accepted') { patch.decision = 'accepted'; patch.decided_at = today.toISOString(); }
    if (next === 'lost') { patch.decision = 'lost'; patch.decided_at = today.toISOString(); }

    await sb.from('offers').update(patch).eq('id', o.id);
    setOffers(prev => prev.map(x => x.id === o.id ? { ...x, ...patch } : x));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Fejléc */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900 dark:text-white">Ajánlataim</h1>
          <p className="text-slate-600 dark:text-slate-300">Keresés, szűrés és státuszkezelés egy helyen.</p>
        </div>
        <a
          href="/new"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-blue-500 to-brand-emerald-500 px-4 py-2 text-white shadow-card hover:shadow-pop"
        >
          + Új ajánlat
        </a>
      </div>

      {/* Keresés / szűrés / rendezés */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-ink-900">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <input
            placeholder="Keresés (ajánlat cím vagy cég)..."
            className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Minden állapot</option>
            <option value="draft">Vázlat</option>
            <option value="sent">Kiküldve</option>
            <option value="accepted">Elfogadva</option>
            <option value="lost">Elutasítva</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="all">Minden iparág</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <div className="ms-auto flex items-center gap-2">
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="created">Dátum</option>
              <option value="status">Állapot</option>
              <option value="title">Ajánlat neve</option>
              <option value="recipient">Címzett</option>
              <option value="industry">Iparág</option>
            </select>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as any)}
            >
              <option value="desc">Csökkenő</option>
              <option value="asc">Növekvő</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista / állapotok */}
      {loading && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-ink-900">
              <div className="mb-3 h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mb-2 h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-8 w-full rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-card dark:border-slate-700 dark:bg-ink-900 dark:text-slate-300">
          Nincs találat. Próbálj másik keresést vagy szűrőt.
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="group rounded-lg border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-pop dark:border-slate-700 dark:bg-ink-900"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-medium text-ink-900 dark:text-slate-100">
                    {o.title || '(névtelen)'}
                  </div>
                  <div className="truncate text-sm text-slate-600 dark:text-slate-300">
                    {(o.recipient?.company_name || '').trim() || '—'}
                  </div>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                {(o.industry || 'Ismeretlen iparág')}
                {o.pdf_url ? (
                  <>
                    {' '}&middot;{' '}
                    <a className="underline decoration-brand-blue-500 hover:text-brand-blue-600" href={o.pdf_url} target="_blank">
                      PDF
                    </a>
                  </>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {o.status !== 'sent' && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Küldve:</span>
                    <input
                      type="date"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      onChange={(e) => updateStatus(o, 'sent', e.target.value)}
                    />
                  </label>
                )}
                {o.status !== 'accepted' && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Elfogadva:</span>
                    <input
                      type="date"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      onChange={(e) => updateStatus(o, 'accepted', e.target.value)}
                    />
                  </label>
                )}
                {o.status !== 'lost' && (
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Elutasítva:</span>
                    <input
                      type="date"
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      onChange={(e) => updateStatus(o, 'lost', e.target.value)}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
