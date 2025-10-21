'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';
import AppFrame from '@/components/AppFrame';

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

const inputFieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
const cardClass = 'rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm';

export default function SettingsPage() {
  const sb = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({ industries: [] });

  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [newAct, setNewAct] = useState({ name: '', unit: 'db', price: 0, vat: 27, industries: [] as string[] });
  const [actSaving, setActSaving] = useState(false);
  const [newIndustry, setNewIndustry] = useState('');

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
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
      const industries = prof?.industries ?? [];
      setProfile({
        company_name: prof?.company_name ?? '',
        company_address: prof?.company_address ?? '',
        company_tax_id: prof?.company_tax_id ?? '',
        company_phone: prof?.company_phone ?? '',
        company_email: prof?.company_email ?? (user.email ?? ''),
        industries,
      });
      setNewAct(prev => ({ ...prev, industries }));

      const { data: list } = await sb.from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries')
        .eq('user_id', user.id).order('name');
      setActs((list as ActivityRow[]) || []);

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .sort((a, b) => a.name.localeCompare(b.name)));
      setNewAct({ name: '', unit: 'db', price: 0, vat: 27, industries: profile.industries || [] });
    } finally { setActSaving(false); }
  }

  async function deleteActivity(id: string) {
    await sb.from('activities').delete().eq('id', id);
    setActs(prev => prev.filter(a => a.id !== id));
  }

  function toggleIndustry(target: string) {
    setProfile(p => {
      const set = new Set(p.industries || []);
      if (set.has(target)) {
        set.delete(target);
      } else {
        set.add(target);
      }
      return { ...p, industries: Array.from(set) };
    });
  }

  function toggleNewActIndustry(target: string) {
    setNewAct(a => {
      const set = new Set(a.industries);
      if (set.has(target)) {
        set.delete(target);
      } else {
        set.add(target);
      }
      return { ...a, industries: Array.from(set) };
    });
  }

  function handleManualIndustry(value: string) {
    const val = value.trim();
    if (!val) return;
    setProfile(p => {
      const set = new Set(p.industries || []);
      set.add(val);
      return { ...p, industries: Array.from(set) };
    });
    setNewIndustry('');
  }

  if (loading) {
    return (
      <AppFrame
        title="Beállítások"
        description="Add meg a cégadatokat és hozd létre a gyakran használt tételek sablonjait."
      >
        <div className={`${cardClass} text-sm text-slate-500`}>Betöltés…</div>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      title="Beállítások"
      description="Az itt megadott információk automatikusan megjelennek az ajánlatokban és a generált PDF-ekben."
      actions={email ? <span className="text-sm text-slate-400">Belépve: <span className="font-medium text-slate-600">{email}</span></span> : null}
    >
      <div className="space-y-8">
        <section className={`${cardClass} space-y-6`}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Cégadatok</h2>
            <p className="mt-1 text-sm text-slate-500">Töltsd ki a számlázási és kapcsolatfelvételi adatokat.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Cégnév</span>
              <input
                className={inputFieldClass}
                value={profile.company_name || ''}
                onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Adószám</span>
              <input
                className={`${inputFieldClass} ${profile.company_tax_id && !validateTaxHU(profile.company_tax_id) ? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100' : ''}`}
                placeholder="12345678-1-12"
                value={profile.company_tax_id || ''}
                onChange={e => setProfile(p => ({ ...p, company_tax_id: e.target.value }))}
              />
              {errors.tax && <span className="text-xs text-rose-500">{errors.tax}</span>}
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Cím</span>
              <input
                className={`${inputFieldClass} ${profile.company_address && !validateAddress(profile.company_address) ? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100' : ''}`}
                placeholder="Irányítószám, település, utca, házszám"
                value={profile.company_address || ''}
                onChange={e => setProfile(p => ({ ...p, company_address: e.target.value }))}
              />
              {errors.address && <span className="text-xs text-rose-500">{errors.address}</span>}
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefon</span>
              <input
                className={`${inputFieldClass} ${profile.company_phone && !validatePhoneHU(profile.company_phone) ? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100' : ''}`}
                placeholder="+36301234567"
                value={profile.company_phone || ''}
                onChange={e => setProfile(p => ({ ...p, company_phone: e.target.value }))}
              />
              {errors.phone && <span className="text-xs text-rose-500">{errors.phone}</span>}
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">E-mail</span>
              <input
                className={inputFieldClass}
                value={profile.company_email || ''}
                onChange={e => setProfile(p => ({ ...p, company_email: e.target.value }))}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Iparágak (több is választható)</span>
              <p className="text-xs text-slate-400">Az itt megadott iparágak az ajánlatvarázslóban is megjelennek.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_INDUSTRIES_HU.map(ind => {
                const active = profile.industries?.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}
                  >
                    {ind}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                placeholder="Új iparág hozzáadása (pl. Nonprofit)"
                className={inputFieldClass}
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualIndustry(newIndustry);
                  }
                }}
              />
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                onClick={() => handleManualIndustry(newIndustry)}
              >
                Hozzáadás
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(profile.industries || []).map(ind => (
                <span key={ind} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {ind}
                </span>
              ))}
              {(profile.industries || []).length === 0 && (
                <span className="text-xs text-slate-400">Még nincs kiválasztott iparág.</span>
              )}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving || Object.keys(errors).length > 0}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Mentés…' : 'Mentés'}
          </button>
        </section>

        <section className={`${cardClass} space-y-6`}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tevékenység-sablonok</h2>
            <p className="mt-1 text-sm text-slate-500">Adj meg előre gyakori tételeket mértékegységgel, díjjal és kapcsolódó iparágakkal.</p>
          </div>

          <div className="grid items-end gap-4 lg:grid-cols-5">
            <label className="grid gap-2 lg:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Megnevezés</span>
              <input
                className={inputFieldClass}
                placeholder="Pl. Webfejlesztés"
                value={newAct.name}
                onChange={e => setNewAct(a => ({ ...a, name: e.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Mértékegység</span>
              <input
                className={inputFieldClass}
                placeholder="db / óra / m²"
                value={newAct.unit}
                onChange={e => setNewAct(a => ({ ...a, unit: e.target.value }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Alap díj (Ft)</span>
              <input
                type="number"
                className={inputFieldClass}
                min={0}
                value={newAct.price}
                onChange={e => setNewAct(a => ({ ...a, price: Number(e.target.value) }))}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">ÁFA %</span>
              <input
                type="number"
                className={inputFieldClass}
                min={0}
                value={newAct.vat}
                onChange={e => setNewAct(a => ({ ...a, vat: Number(e.target.value) }))}
              />
            </label>
            <div className="lg:col-span-5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Iparágak ehhez a tételhez</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_INDUSTRIES_HU.map(ind => {
                  const active = newAct.industries.includes(ind);
                  return (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => toggleNewActIndustry(ind)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}
                    >
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={addActivity}
            disabled={actSaving}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actSaving ? 'Hozzáadás…' : 'Tevékenység hozzáadása'}
          </button>

          <div className="grid gap-3 md:grid-cols-2">
            {acts.map(a => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{a.name}</h3>
                    <p className="text-xs text-slate-500">Egység: {a.unit} • Díj: {Number(a.default_unit_price || 0).toLocaleString('hu-HU')} Ft • ÁFA: {a.default_vat}%</p>
                  </div>
                  <button
                    onClick={() => deleteActivity(a.id)}
                    className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                  >
                    Törlés
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">Iparágak: {(a.industries || []).join(', ') || '—'}</p>
              </div>
            ))}
            {acts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                Még nincs sablon. Adj hozzá legalább egy gyakran használt tételt.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppFrame>
  );
}
