'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import StepIndicator from '@/components/StepIndicator';
import EditablePriceTable, { PriceRow } from '@/components/EditablePriceTable';
import { supabaseBrowser } from '@/app/lib/supabaseBrowser';

type Step1Form = {
  industry: string;
  title: string;
  description: string;
  deadline: string;
  language: 'hu'|'en';
  brandVoice: 'friendly'|'formal';
  style: 'compact'|'detailed';
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Activity = { id:string; name:string; unit:string; default_unit_price:number; default_vat:number; industries:string[] };
type Client = { id:string; company_name:string; address?:string; tax_id?:string; representative?:string; phone?:string; email?:string };

type OfferSections = {
  introduction: string;
  project_summary: string;
  scope: string[];
  deliverables: string[];
  schedule: string[];
  assumptions: string[];
  next_steps: string[];
  closing: string;
};

function isOfferSections(value: unknown): value is OfferSections {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;

  const isNonEmptyString = (key: keyof OfferSections) => {
    const val = obj[key as string];
    return typeof val === 'string' && val.trim().length > 0;
  };

  const isStringArray = (key: keyof OfferSections) => {
    const val = obj[key as string];
    return (
      Array.isArray(val) &&
      val.length > 0 &&
      val.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  };

  return (
    isNonEmptyString('introduction') &&
    isNonEmptyString('project_summary') &&
    isNonEmptyString('closing') &&
    ['scope', 'deliverables', 'schedule', 'assumptions', 'next_steps'].every((key) =>
      isStringArray(key as keyof OfferSections)
    )
  );
}

export default function NewOfferWizard() {
  const sb = supabaseBrowser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [availableIndustries, setAvailableIndustries] = useState<string[]>(['Marketing','Informatika','Építőipar','Tanácsadás','Szolgáltatás']);

  // 1) alapok
  const [form, setForm] = useState<Step1Form>({
    industry: 'Marketing',
    title: '',
    description: '',
    deadline: '',
    language: 'hu',
    brandVoice: 'friendly',
    style: 'detailed',
  });

  // 1/b) címzett (opcionális) + autocomplete
  const [client, setClient] = useState<ClientForm>({ company_name: '' });
  const [clientList, setClientList] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string|undefined>(undefined);
  const [showClientDrop, setShowClientDrop] = useState(false);

  // 2) tevékenységek / árlista
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rows, setRows] = useState<PriceRow[]>([
    { name: 'Konzultáció', qty: 1, unit: 'óra', unitPrice: 15000, vat: 27 }
  ]);

  // preview
  const [previewHtml, setPreviewHtml] = useState<string>('<p>Írd be fent a projekt részleteit, és megjelenik az előnézet.</p>');
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout|null>(null);
  const previewAbortRef = useRef<AbortController|null>(null);

  // edit on step 3
  const [editedHtml, setEditedHtml] = useState<string>('');

  // auth + preload
  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { location.href = '/login'; return; }
      const { data: prof } = await sb.from('profiles').select('industries').eq('id', user.id).maybeSingle();
      if (prof?.industries?.length) {
        setAvailableIndustries(prof.industries);
        setForm(f=>({ ...f, industry: prof.industries[0] }));
      }

      const { data: acts } = await sb.from('activities')
        .select('id,name,unit,default_unit_price,default_vat,industries')
        .eq('user_id', user.id).order('name');
      setActivities(acts || []);

      const { data: cl } = await sb.from('clients').select('id,company_name,address,tax_id,representative,phone,email')
        .eq('user_id', user.id).order('company_name');
      setClientList(cl || []);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
      }
    };
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter(a =>
      (a.industries||[]).length === 0 ||
      a.industries.includes(form.industry)
    );
  }, [activities, form.industry]);

  // === Autocomplete (cég) ===
  const filteredClients = useMemo(() => {
    const q = (client.company_name || '').toLowerCase();
    if (!q) return clientList.slice(0,8);
    return clientList.filter(c => c.company_name.toLowerCase().includes(q)).slice(0,8);
  }, [client.company_name, clientList]);

  function pickClient(c: Client) {
    setClientId(c.id);
    setClient({
      company_name: c.company_name,
      address: c.address || '',
      tax_id: c.tax_id || '',
      representative: c.representative || '',
      phone: c.phone || '',
      email: c.email || '',
    });
    setShowClientDrop(false);
  }

  // === Preview hívó ===
  async function callPreview() {
    if (!form.title && !form.description) {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
        previewAbortRef.current = null;
      }
      setPreviewLoading(false);
      return;
    }

    let controller: AbortController | null = null;
    try {
      if (previewAbortRef.current) {
        previewAbortRef.current.abort();
      }

      setPreviewLoading(true);

      const { data: session } = await sb.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      controller = new AbortController();
      previewAbortRef.current = controller;

      const resp = await fetch('/api/ai-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          industry: form.industry,
          title: form.title,
          description: form.description,
          deadline: form.deadline,
          language: form.language,
          brandVoice: form.brandVoice,
          style: form.style,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        let message = `Hiba az előnézet betöltésekor (${resp.status})`;
        try {
          const data = await resp.json();
          if (data?.error) message = data.error;
        } catch {
          /* ignore JSON parse errors */
        }
        console.error(message);
        return;
      }

      if (!resp.body) {
        setPreviewHtml('<p>(nincs előnézet)</p>');
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let latestHtml = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          const rawEvent = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          if (!rawEvent || !rawEvent.startsWith('data:')) continue;
          const jsonPart = rawEvent.replace(/^data:\s*/, '');
          if (!jsonPart) continue;

          try {
            const payload = JSON.parse(jsonPart) as { type?: string; html?: string; message?: string };
            if (payload.type === 'delta' || payload.type === 'done') {
              if (typeof payload.html === 'string') {
                latestHtml = payload.html;
                setPreviewHtml(payload.html || '<p>(nincs előnézet)</p>');
                if (payload.type === 'done') {
                  setEditedHtml((prev) => prev || (payload.html || ''));
                }
              }
            } else if (payload.type === 'error') {
              console.error('AI stream hiba:', payload.message);
            }
          } catch (err: unknown) {
            console.error('Nem sikerült feldolgozni az AI előnézet adatát', err, jsonPart);
          }
        }
      }

      if (!latestHtml) {
        setPreviewHtml('<p>(nincs előnézet)</p>');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (typeof error === 'object' && error && 'name' in error && (error as { name?: string }).name === 'AbortError') return;
      console.error('Előnézet hiba:', error);
    } finally {
      const shouldClear = !controller || previewAbortRef.current === controller;
      if (previewAbortRef.current === controller) {
        previewAbortRef.current = null;
      }
      if (shouldClear) {
        setPreviewLoading(false);
      }
    }
  }
  const onBlurTrigger = () => callPreview();
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { callPreview(); }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description, form.deadline, form.language, form.brandVoice, form.industry, form.style]);

  const totals = useMemo(() => {
    const net = rows.reduce((s, r) => s + (Number(r.qty)||0) * (Number(r.unitPrice)||0), 0);
    const vat = rows.reduce((s, r) => s + (Number(r.qty)||0) * (Number(r.unitPrice)||0) * ((Number(r.vat)||0)/100), 0);
    return { net, vat, gross: net + vat };
  }, [rows]);

  async function ensureClient(): Promise<string|undefined> {
    const name = (client.company_name || '').trim();
    if (!name) return undefined;
    // meglévő?
    if (clientId) return clientId;

    const { data: { user } } = await sb.auth.getUser();
    if (!user) return undefined;

    // próbáljuk meglévő alapján
    const { data: match } = await sb.from('clients')
      .select('id').eq('user_id', user.id).ilike('company_name', name).maybeSingle();
    if (match?.id) return match.id;

    // új felvitel
    const ins = await sb.from('clients').insert({
      user_id: user.id,
      company_name: name,
      address: client.address || null,
      tax_id: client.tax_id || null,
      representative: client.representative || null,
      phone: client.phone || null,
      email: client.email || null
    }).select('id').single();

    return ins.data?.id;
  }

  async function generate() {
    try {
      setLoading(true);
      const { data: session } = await sb.auth.getSession();
      const token = session.session?.access_token;
      if (!token) { alert('Nem vagy bejelentkezve.'); location.href = '/login'; return; }

      const cid = await ensureClient();

      const resp = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title, industry: form.industry, description: form.description, deadline: form.deadline,
          language: form.language, brandVoice: form.brandVoice, style: form.style,
          prices: rows, aiOverrideHtml: editedHtml || previewHtml,
          clientId: cid
        })
      });

      const raw = await resp.text();
      let payload: unknown = null;
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch (err: unknown) {
          console.error('Nem sikerült értelmezni az AI válaszát', err, raw);
        }
      }

      const payloadObj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
      const okFlag = payloadObj && typeof payloadObj.ok === 'boolean' ? (payloadObj.ok as boolean) : undefined;
      const errorMessage = payloadObj && typeof payloadObj.error === 'string' ? (payloadObj.error as string) : undefined;
      const sectionsData = payloadObj ? (payloadObj.sections as unknown) : null;

      if (!resp.ok || okFlag === false) {
        const msg = errorMessage || `Hiba a generálásnál (${resp.status})`;
        alert(msg);
        return;
      }

      if (sectionsData) {
        if (!isOfferSections(sectionsData)) {
          alert('A struktúrált AI válasz hiányos, próbáld újra a generálást.');
          return;
        }
      }

      location.href = '/dashboard';
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <StepIndicator step={step} total={3} labels={['Projekt részletek', 'Tételek', 'Előnézet & PDF']} />

      {step === 1 && (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Iparág stb. (mint korábban) */}
            <div>
              <label className="text-sm text-neutral-700">Iparág</label>
              <select className="mt-1 border rounded p-2 w-full"
                value={form.industry}
                onChange={e=>setForm(f=>({...f, industry:e.target.value}))}
                onBlur={onBlurTrigger}>
                {availableIndustries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm text-neutral-700">Ajánlat címe</label>
              <input className="mt-1 border rounded p-2 w-full" placeholder="Pl. Weboldal fejlesztés"
                value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))} onBlur={onBlurTrigger}/>
            </div>

            <div>
              <label className="text-sm text-neutral-700">Rövid projektleírás</label>
              <textarea className="mt-1 border rounded p-2 w-full h-28"
                value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} onBlur={onBlurTrigger}/>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-sm text-neutral-700">Határidő</label>
                <input className="mt-1 border rounded p-2 w-full" value={form.deadline}
                  onChange={e=>setForm(f=>({...f, deadline:e.target.value}))} onBlur={onBlurTrigger}/>
              </div>
              <div><label className="text-sm text-neutral-700">Nyelv</label>
                  <select className="mt-1 border rounded p-2 w-full" value={form.language}
                    onChange={e=>setForm(f=>({...f, language:e.target.value as Step1Form['language']}))} onBlur={onBlurTrigger}>
                  <option value="hu">Magyar</option><option value="en">English</option>
                </select>
              </div>
              <div><label className="text-sm text-neutral-700">Hangnem</label>
                  <select className="mt-1 border rounded p-2 w-full" value={form.brandVoice}
                    onChange={e=>setForm(f=>({...f, brandVoice:e.target.value as Step1Form['brandVoice']}))} onBlur={onBlurTrigger}>
                  <option value="friendly">Barátságos</option><option value="formal">Formális</option>
                </select>
              </div>
            </div>

            {/* Stílus */}
            <div className="pt-1">
              <div className="text-sm text-neutral-700 mb-1">Ajánlat stílusa</div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="style" checked={form.style==='compact'}
                    onChange={()=>setForm(f=>({...f, style:'compact'}))}/> Kompakt
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="style" checked={form.style==='detailed'}
                    onChange={()=>setForm(f=>({...f, style:'detailed'}))}/> Részletes
                </label>
              </div>
            </div>

            {/* Címzett (opcionális) */}
            <div className="rounded-xl border p-3 bg-white">
              <div className="font-medium mb-2">Címzett (opcionális)</div>
              <div className="relative">
                <input className="border rounded p-2 w-full" placeholder="Cégnév"
                  value={client.company_name}
                  onChange={(e)=>{ setClientId(undefined); setClient(c=>({...c, company_name:e.target.value})); setShowClientDrop(true); }}
                  onFocus={()=>setShowClientDrop(true)} />
                {showClientDrop && filteredClients.length>0 && (
                  <div className="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-auto">
                    {filteredClients.map(c=>(
                      <div key={c.id} className="px-3 py-2 hover:bg-neutral-50 cursor-pointer"
                        onMouseDown={()=>pickClient(c)}>
                        {c.company_name} {c.email ? <span className="text-xs text-neutral-500">– {c.email}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-2 mt-2">
                <input className="border rounded p-2" placeholder="Cím"
                  value={client.address || ''} onChange={e=>setClient(c=>({...c, address:e.target.value}))}/>
                <input className="border rounded p-2" placeholder="Adószám"
                  value={client.tax_id || ''} onChange={e=>setClient(c=>({...c, tax_id:e.target.value}))}/>
                <input className="border rounded p-2" placeholder="Képviselő neve"
                  value={client.representative || ''} onChange={e=>setClient(c=>({...c, representative:e.target.value}))}/>
                <input className="border rounded p-2" placeholder="Telefon"
                  value={client.phone || ''} onChange={e=>setClient(c=>({...c, phone:e.target.value}))}/>
                <input className="border rounded p-2 md:col-span-2" placeholder="E-mail"
                  value={client.email || ''} onChange={e=>setClient(c=>({...c, email:e.target.value}))}/>
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                Ha megadod, elmentjük az ügyfelet és később automatikusan felkínáljuk.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl bg-white p-4 border">
            <div className="text-sm text-neutral-600">AI előnézet (formázott)</div>
            <div className="mt-2 min-h-48 border rounded p-3 propono-doc">
              {previewLoading ? <div className="text-neutral-500">AI írja az ajánlatodat…</div>
                : <div dangerouslySetInnerHTML={{ __html: previewHtml }} />}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Az előnézet onBlur-kor és gépelés után 0,8 mp csendet követően frissül. <b>A szöveg a 3. lépésben szerkeszthető lesz.</b>
            </p>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          {/* iparág szerinti gyors tételek */}
          {filteredActivities.length > 0 && (
            <div className="rounded-xl border bg-white p-3">
              <div className="text-sm text-neutral-700 mb-2">Gyors tétel beszúrása (iparág: {form.industry})</div>
              <div className="flex flex-wrap gap-2">
                {filteredActivities.map(a => (
                  <button key={a.id} type="button"
                    onClick={()=>setRows(r => [{ name:a.name, qty:1, unit:a.unit||'db', unitPrice:Number(a.default_unit_price||0), vat:Number(a.default_vat||27) }, ...r])}
                    className="px-2 py-1 rounded border text-sm bg-white hover:bg-neutral-50">+ {a.name}</button>
                ))}
              </div>
            </div>
          )}

          <EditablePriceTable rows={rows} onChange={setRows} />
          <div className="text-right text-sm text-neutral-700">
            <div>Nettó: {totals.net.toLocaleString('hu-HU')} Ft</div>
            <div>ÁFA: {totals.vat.toLocaleString('hu-HU')} Ft</div>
            <div><b>Bruttó: {totals.gross.toLocaleString('hu-HU')} Ft</b></div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white p-4 border">
            <div className="text-sm text-neutral-600">AI-szöveg szerkesztése (ez kerül a PDF-be)</div>
            <div className="mt-2 min-h-48 border rounded p-3 propono-doc"
              contentEditable suppressContentEditableWarning
              onInput={(e)=>setEditedHtml((e.target as HTMLDivElement).innerHTML)}
              dangerouslySetInnerHTML={{ __html: editedHtml || previewHtml }} />
            <p className="text-xs text-neutral-500 mt-2">Félkövér, címsorok, listák megmaradnak.</p>
          </div>

          <div className="rounded-2xl bg-white p-4 border space-y-3">
            <div className="font-medium">Összegzés</div>
            <div className="text-sm text-neutral-700">
              <div><b>Cím:</b> {form.title || '—'}</div>
              <div><b>Iparág:</b> {form.industry}</div>
              <div><b>Címzett:</b> {client.company_name || '—'}</div>
              <div><b>Stílus:</b> {form.style === 'compact' ? 'Kompakt' : 'Részletes'}</div>
              <div className="mt-2"><b>Bruttó összesen:</b> {totals.gross.toLocaleString('hu-HU')} Ft</div>
            </div>
            <button onClick={generate} disabled={loading} className="w-full bg-black text-white rounded p-2">
              {loading ? 'Generálás…' : 'PDF generálása és mentés'}
            </button>
          </div>
        </section>
      )}

      {/* navigáció */}
      <div className="flex items-center justify-between">
        <button onClick={()=>setStep(s=>Math.max(1, s-1))} disabled={step===1} className="px-4 py-2 border rounded disabled:opacity-50">Vissza</button>
        <div>{step<3 && <button onClick={()=>setStep(s=>Math.min(3, s+1))} className="px-4 py-2 bg-black text-white rounded">Tovább</button>}</div>
      </div>
    </div>
  );
}
