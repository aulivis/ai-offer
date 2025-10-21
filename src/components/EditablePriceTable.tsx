'use client';

import { useMemo } from 'react';

export type PriceRow = { name: string; qty: number; unit: string; unitPrice: number; vat: number; };

type Props = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
};

export default function EditablePriceTable({ rows, onChange }: Props) {
  const totals = useMemo(() => {
    const net = rows.reduce((s, r) => s + (Number(r.qty)||0) * (Number(r.unitPrice)||0), 0);
    const vat = rows.reduce((s, r) => s + (Number(r.qty)||0) * (Number(r.unitPrice)||0) * ((Number(r.vat)||0)/100), 0);
    const gross = net + vat;
    return { net, vat, gross };
  }, [rows]);

  const update = (idx: number, key: keyof PriceRow, val: any) => {
    const next = [...rows];
    (next[idx] as any)[key] = key === 'qty' || key === 'unitPrice' || key === 'vat' ? Number(val) : val;
    onChange(next);
  };

  const addRow = () => onChange([...rows, { name: '', qty: 1, unit: 'db', unitPrice: 0, vat: 27 }]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-3">Tétel</th>
              <th className="p-3 w-24">Menny.</th>
              <th className="p-3 w-24">Egység</th>
              <th className="p-3 w-36">Egységár (Ft)</th>
              <th className="p-3 w-24">ÁFA %</th>
              <th className="p-3 w-36">Nettó össz.</th>
              <th className="p-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">
                  <input className="w-full border rounded p-2" placeholder="Megnevezés"
                    value={r.name} onChange={e=>update(idx, 'name', e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" min={0} className="w-full border rounded p-2"
                    value={r.qty} onChange={e=>update(idx, 'qty', e.target.value)} />
                </td>
                <td className="p-2">
                  <input className="w-full border rounded p-2" placeholder="db / óra / m²"
                    value={r.unit} onChange={e=>update(idx, 'unit', e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" min={0} className="w-full border rounded p-2"
                    value={r.unitPrice} onChange={e=>update(idx, 'unitPrice', e.target.value)} />
                </td>
                <td className="p-2">
                  <input type="number" min={0} className="w-full border rounded p-2"
                    value={r.vat} onChange={e=>update(idx, 'vat', e.target.value)} />
                </td>
                <td className="p-2 text-right pr-3">
                  {((r.qty||0)*(r.unitPrice||0)).toLocaleString('hu-HU')}
                </td>
                <td className="p-2 text-right">
                  <button type="button" onClick={()=>removeRow(idx)} className="text-red-600 text-sm">Törlés</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3">
        <button type="button" onClick={addRow} className="px-3 py-1.5 border rounded">
          + Tétel hozzáadása
        </button>
        <div className="text-sm">
          <div><b>Nettó:</b> {totals.net.toLocaleString('hu-HU')} Ft</div>
          <div>ÁFA: {totals.vat.toLocaleString('hu-HU')} Ft</div>
          <div><b>Bruttó:</b> {totals.gross.toLocaleString('hu-HU')} Ft</div>
        </div>
      </div>
    </div>
  );
}
