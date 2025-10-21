'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

type Profile = {
  company_name?: string;
  company_address?: string;
  company_tax_id?: string;
  company_phone?: string;
  company_email?: string;
  industries?: string[];
};

type ActivityRow = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};

const ALL_INDUSTRIES_HU = [
  'Marketing', 'Informatika', 'Építőipar', 'Tanácsadás', 'Szolgáltatás',
  'Gyártás', 'Oktatás', 'Egészségügy', 'Pénzügy', 'E-kereskedelem', 'Ingatlan'
];

function validatePhoneHU(v: string) {
  const cleaned = v.replace(/[()\s.-]/g, '');
  return /^\+?\d{9,16}$/.test(cleaned);
}
function validateTaxHU(v: string) {
  // 12345678-1-12
  return /^\d{8}-\d-\d{2}$/.test(v.trim());
}
function validateAddress(v: string) {
  return (v?.trim()?.length || 0) >= 8;
}

export default function SettingsPage() {
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string|null>(null);
  const [profile, setProfile] = useState<Profile>({ industries: [] });

  // aktivitások
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [newAct, setNewAct] = useState({ name:'', unit:'db', price:0, vat:27, industries: [] as string[] });
  const [actSaving, setActSaving] = useState(false);

  // validációs hibák
  const errors = useMemo(() => {
    const e: Record<string,string> = {};
    if (profile.company_phone && !validatePhoneHU(profile.company_phone)) e.phone = 'Magyar formátumú telefonszámot adj meg (pl. +36301234567).';
    if (profile.company_tax_id && !validateTaxHU(profile.company_tax_id)) e.tax = 'Adószám formátum: 12345678-1-12';
    if (profile.company_address && !validateAddress(profile.company_address)) e.address = 'A cím legyen legalább 8 karakter.';
    return e;
  }, [profile]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }
      setEmail(user.email ?? null);

      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile({
        company_name: prof?.company_name ?? '',
        company_address: prof?.company_address ?? '',
        company_tax_id: prof?.company_tax_id ?? '',
        company_phone: prof?.company_phone ?? '',
        company_email: prof?.company_email ?? (user.email ?? ''),
        industries: prof?.industries ?? [],
      });

      const { data: list } = await sb.from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries')
        .eq('user_id', user.id).order('name');
      setActs((list as ActivityRow[]) || []);

      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    try {
      setSaving(true);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      if (Object.keys(errors).length) { alert('Kérjük, javítsd a piros mezőket.'); return; }
      await sb.from('profiles').upsert({ id: user.id, ...profile }, { onConflict: 'id' });
      alert('Mentve!');
    } finally { setSaving(false); }
  }

  async function addActivity() {
    if (!newAct.name.trim()) { alert('Add meg a tevékenység nevét.'); return; }
    try {
      setActSaving(true);
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const ins = await sb.from('activities').insert({
        user_id: user.id,
        name: newAct.name.trim(),
        unit: newAct.unit || 'db',
        default_unit_price: Number(newAct.price) || 0,
        default_vat: Number(newAct.vat) || 27,
        industries: newAct.industries || [],
      }).select();
      setActs(prev => [...prev, ...(ins.data as ActivityRow[] || [])]
        .sort((a,b)=>a.name.localeCompare(b.name)));
      setNewAct({ name:'', unit:'db', price:0, vat:27, industries: profile.industries || [] });
    } finally { setActSaving(false); }
  }

  async function deleteActivity(id: string) {
    await sb.from('activities').delete().eq('id', id);
    setActs(prev => prev.filter(a => a.id !== id));
  }

  if (loading) return <div className="max-w-6xl mx-auto p-6">Betöltés…</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Beállítások</h1>

      {/* Cégadatok */}
      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Cégadatok</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-600">Cégnév</label>
            <input className="mt-1 w-full border rounded p-2"
              value={profile.company_name || ''} onChange={e=>setProfile(p=>({...p, company_name:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Adószám</label>
            <input className={`mt-1 w-full border rounded p-2 ${profile.company_tax_id && !validateTaxHU(profile.company_tax_id) ? 'border-red-500' : ''}`}
              placeholder="12345678-1-12"
              value={profile.company_tax_id || ''} onChange={e=>setProfile(p=>({...p, company_tax_id:e.target.value}))}/>
            {errors.tax && <div className="text-xs text-red-600 mt-1">{errors.tax}</div>}
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-neutral-600">Cím</label>
            <input className={`mt-1 w-full border rounded p-2 ${profile.company_address && !validateAddress(profile.company_address) ? 'border-red-500' : ''}`}
              placeholder="Irányítószám, település, utca, házszám"
              value={profile.company_address || ''} onChange={e=>setProfile(p=>({...p, company_address:e.target.value}))}/>
            {errors.address && <div className="text-xs text-red-600 mt-1">{errors.address}</div>}
          </div>
          <div>
            <label className="text-sm text-neutral-600">Telefon</label>
            <input className={`mt-1 w-full border rounded p-2 ${profile.company_phone && !validatePhoneHU(profile.company_phone) ? 'border-red-500' : ''}`}
              placeholder="+36301234567"
              value={profile.company_phone || ''} onChange={e=>setProfile(p=>({...p, company_phone:e.target.value}))}/>
            {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
          </div>
          <div>
            <label className="text-sm text-neutral-600">E-mail</label>
            <input className="mt-1 w-full border rounded p-2"
              value={profile.company_email || ''} onChange={e=>setProfile(p=>({...p, company_email:e.target.value}))}/>
          </div>
        </div>

        {/* Iparágak (magyarul) + manuális hozzáadás */}
        <div className="pt-2">
          <div className="text-sm text-neutral-600 mb-2">Iparágak (több is választható)</div>

          <div className="flex flex-wrap gap-2 mb-3">
            {ALL_INDUSTRIES_HU.map(ind => {
              const active = profile.industries?.includes(ind);
              return (
                <button key={ind} type="button"
                  onClick={()=>{
                    setProfile(p=>{
                      const set = new Set(p.industries || []);
                      active ? set.delete(ind) : set.add(ind);
                      return { ...p, industries: Array.from(set) };
                    });
                  }}
                  className={`px-2 py-1 rounded border text-sm ${active ? 'bg-black text-white' : 'bg-white'}`}>
                  {ind}
                </button>
              );
            })}
          </div>

          {/* Manuális hozzáadás */}
          <div className="flex gap-2">
            <input
              placeholder="Új iparág hozzáadása (pl. Nonprofit)"
              className="flex-1 border rounded p-2"
              onKeyDown={(e)=>{
                if (e.key === 'Enter') {
                  const val = (e.currentTarget.value || '').trim();
                  if (!val) return;
                  setProfile(p=>{
                    const set = new Set(p.industries || []);
                    set.add(val);
                    return { ...p, industries: Array.from(set) };
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              className="px-3 py-2 rounded border"
              onClick={()=>{
                const inp = document.querySelector<HTMLInputElement>('input[placeholder^="Új iparág"]');
                const val = (inp?.value || '').trim();
                if (!val) return;
                setProfile(p=>{
                  const set = new Set(p.industries || []);
                  set.add(val);
                  return { ...p, industries: Array.from(set) };
                });
                if (inp) inp.value='';
              }}
            >
              Hozzáadás
            </button>
          </div>

          {/* Kiválasztottak */}
          <div className="mt-2 flex flex-wrap gap-2">
            {(profile.industries||[]).map(ind => (
              <span key={ind} className="px-2 py-1 rounded bg-neutral-100 border text-sm">
                {ind}
              </span>
            ))}
            {(profile.industries||[]).length===0 && (
              <span className="text-xs text-neutral-500">Még nincs kiválasztott iparág.</span>
            )}
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving || Object.keys(errors).length>0}
          className="mt-4 px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {saving ? 'Mentés…' : 'Mentés'}
        </button>
      </section>

      {/* Tevékenység-sablonok */}
      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Tevékenység-sablonok</h2>
        <p className="text-sm text-neutral-600">Adj meg előre gyakori tételeket, alap mértékegységgel, díjjal és ÁFÁ-val. Köss iparágakhoz is, hogy könnyebb legyen kiválasztani.</p>

        {/* Új tevékenység űrlap */}
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-sm text-neutral-600">Megnevezés</label>
            <input className="mt-1 w-full border rounded p-2" placeholder="Pl. Webfejlesztés"
              value={newAct.name} onChange={e=>setNewAct(a=>({...a, name:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Mértékegység</label>
            <input className="mt-1 w-full border rounded p-2" placeholder="db / óra / m²"
              value={newAct.unit} onChange={e=>setNewAct(a=>({...a, unit:e.target.value}))}/>
          </div>
          <div>
            <label className="text-sm text-neutral-600">Alap díj (Ft)</label>
            <input type="number" className="mt-1 w-full border rounded p-2" min={0}
              value={newAct.price} onChange={e=>setNewAct(a=>({...a, price:Number(e.target.value)}))}/>
          </div>
          <div>
            <label className="text-sm text-neutral-600">ÁFA %</label>
            <input type="number" className="mt-1 w-full border rounded p-2" min={0}
              value={newAct.vat} onChange={e=>setNewAct(a=>({...a, vat:Number(e.target.value)}))}/>
          </div>
          <div className="md:col-span-5">
            <label className="text-sm text-neutral-600">Iparágak ehhez a tételhez</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_INDUSTRIES_HU.map(ind => {
                const active = newAct.industries.includes(ind);
                return (
                  <button key={ind} type="button"
                    onClick={()=>{
                      setNewAct(a=>{
                        const set = new Set(a.industries);
                        active ? set.delete(ind) : set.add(ind);
                        return { ...a, industries: Array.from(set) };
                      });
                    }}
                    className={`px-2 py-1 rounded border text-sm ${active ? 'bg-black text-white' : 'bg-white'}`}>
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button onClick={addActivity} disabled={actSaving}
          className="px-4 py-2 rounded border bg-white">
          {actSaving ? 'Hozzáadás…' : 'Tevékenység hozzáadása'}
        </button>

        {/* Lista */}
        <div className="mt-4 grid md:grid-cols-2 gap-2">
          {acts.map(a => (
            <div key={a.id} className="border rounded p-3 bg-neutral-50">
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-neutral-700">
                Egység: {a.unit} • Díj: {Number(a.default_unit_price||0).toLocaleString('hu-HU')} Ft • ÁFA: {a.default_vat}%
              </div>
              <div className="text-xs text-neutral-500">Iparágak: {(a.industries||[]).join(', ') || '—'}</div>
              <button onClick={()=>deleteActivity(a.id)} className="mt-2 text-red-600 text-sm">Törlés</button>
            </div>
          ))}
          {acts.length === 0 && <div className="text-sm text-neutral-500">Még nincs sablon.</div>}
        </div>
      </section>
    </div>
  );
}
