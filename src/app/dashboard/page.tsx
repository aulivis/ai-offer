'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

type Offer = {
  id: string;
  title: string;
  industry: string;
  status: 'draft'|'sent'|'accepted'|'lost';
  created_at: string | null;
  sent_at: string | null;
  decided_at: string | null;
  decision: 'accepted'|'lost'|null;
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

export default function DashboardPage() {
  const sb = supabaseBrowser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // keresés/szűrés/rendezés
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all'|Offer['status']>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created'|'status'|'title'|'recipient'|'industry'>('created');
  const [sortDir, setSortDir] = useState<'desc'|'asc'>('desc');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href='/login'; return; }

      const { data } = await sb
        .from('offers')
        .select('id,title,industry,status,created_at,sent_at,decided_at,decision,pdf_url,recipient_id, recipient:recipient_id ( company_name )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOffers((data as any[]) || []);
      setLoading(false);
    })();
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
    list.sort((a,b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'status': return dir * a.status.localeCompare(b.status);
        case 'title': return dir * (a.title||'').localeCompare(b.title||'');
        case 'recipient': return dir * ((a.recipient?.company_name||'').localeCompare(b.recipient?.company_name||''));
        case 'industry': return dir * (a.industry||'').localeCompare(b.industry||'');
        case 'created':
        default:
          return dir * ((new Date(a.created_at||0)).getTime() - (new Date(b.created_at||0)).getTime());
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ajánlataim</h1>
        <a href="/new" className="px-3 py-2 rounded bg-black text-white">+ Új ajánlat</a>
      </div>

      {/* Keresés / szűrés / rendezés */}
      <div className="rounded-xl border bg-white p-3 flex flex-wrap gap-3 items-center">
        <input placeholder="Keresés (név vagy cég)..."
          className="border rounded p-2 flex-1 min-w-[220px]"
          value={q} onChange={(e)=>setQ(e.target.value)} />
        <select className="border rounded p-2"
          value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)}>
          <option value="all">Minden állapot</option>
          <option value="draft">Vázlat</option>
          <option value="sent">Kiküldve</option>
          <option value="accepted">Elfogadva</option>
          <option value="lost">Elutasítva</option>
        </select>
        <select className="border rounded p-2"
          value={industryFilter} onChange={e=>setIndustryFilter(e.target.value)}>
          <option value="all">Minden iparág</option>
          {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
        <select className="border rounded p-2" value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
          <option value="created">Dátum</option>
          <option value="status">Állapot</option>
          <option value="title">Ajánlat neve</option>
          <option value="recipient">Címzett</option>
          <option value="industry">Iparág</option>
        </select>
        <select className="border rounded p-2" value={sortDir} onChange={e=>setSortDir(e.target.value as any)}>
          <option value="desc">Csökkenő</option>
          <option value="asc">Növekvő</option>
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading && <div>Betöltés…</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-neutral-500">Nincs találat.</div>
        )}
        {filtered.map(o => (
          <div key={o.id} className="rounded-xl border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-lg font-medium">
                {o.title || '(névtelen)'}
                {o.recipient?.company_name ? <span className="text-sm text-neutral-500"> — {o.recipient.company_name}</span> : null}
              </div>
              <div className="text-sm text-neutral-600">
                {o.industry} • {STATUS_LABELS[o.status]}
                {o.pdf_url ? <> • <a className="underline" href={o.pdf_url} target="_blank">PDF</a></> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* státuszváltók + dátum */}
              {o.status !== 'sent' && (
                <label className="flex items-center gap-2 text-sm">
                  Küldve:
                  <input type="date" className="border rounded p-1"
                    onChange={(e)=>updateStatus(o,'sent', e.target.value)} />
                </label>
              )}
              {o.status !== 'accepted' && (
                <label className="flex items-center gap-2 text-sm">
                  Elfogadva:
                  <input type="date" className="border rounded p-1"
                    onChange={(e)=>updateStatus(o,'accepted', e.target.value)} />
                </label>
              )}
              {o.status !== 'lost' && (
                <label className="flex items-center gap-2 text-sm">
                  Elutasítva:
                  <input type="date" className="border rounded p-1"
                    onChange={(e)=>updateStatus(o,'lost', e.target.value)} />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
