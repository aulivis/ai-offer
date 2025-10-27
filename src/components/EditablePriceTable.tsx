'use client';

import { t } from '@/copy';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export type PriceRow = { name: string; qty: number; unit: string; unitPrice: number; vat: number };

type Props = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
};

export default function EditablePriceTable({ rows, onChange }: Props) {
  const totals = useMemo(() => {
    const net = rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0), 0);
    const vat = rows.reduce(
      (s, r) =>
        s + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0) * ((Number(r.vat) || 0) / 100),
      0,
    );
    const gross = net + vat;
    return { net, vat, gross };
  }, [rows]);

  const update = (idx: number, key: keyof PriceRow, val: string | number) => {
    const next = [...rows];
    if (key === 'qty' || key === 'unitPrice' || key === 'vat') {
      next[idx][key] = Number(val) as PriceRow[typeof key];
    } else {
      next[idx][key] = String(val) as PriceRow[typeof key];
    }
    onChange(next);
  };

  const addRow = () => onChange([...rows, { name: '', qty: 1, unit: 'db', unitPrice: 0, vat: 27 }]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">{t('editablePriceTable.columns.item')}</th>
              <th className="w-24 px-4 py-3 font-medium">{t('editablePriceTable.columns.quantity')}</th>
              <th className="w-28 px-4 py-3 font-medium">{t('editablePriceTable.columns.unit')}</th>
              <th className="w-36 px-4 py-3 font-medium">{t('editablePriceTable.columns.unitPrice')}</th>
              <th className="w-24 px-4 py-3 font-medium">{t('editablePriceTable.columns.vat')}</th>
              <th className="w-36 px-4 py-3 text-right font-medium">{t('editablePriceTable.columns.netTotal')}</th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-border">
                <td className="px-4 py-3">
                  <Input
                    placeholder={t('editablePriceTable.placeholders.name')}
                    value={r.name}
                    onChange={(e) => update(idx, 'name', e.target.value)}
                    className="py-2 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={0}
                    value={r.qty}
                    onChange={(e) => update(idx, 'qty', e.target.value)}
                    className="py-2 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    placeholder={t('editablePriceTable.placeholders.unit')}
                    value={r.unit}
                    onChange={(e) => update(idx, 'unit', e.target.value)}
                    className="py-2 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={0}
                    value={r.unitPrice}
                    onChange={(e) => update(idx, 'unitPrice', e.target.value)}
                    className="py-2 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={0}
                    value={r.vat}
                    onChange={(e) => update(idx, 'vat', e.target.value)}
                    className="py-2 text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {((r.qty || 0) * (r.unitPrice || 0)).toLocaleString('hu-HU')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-xs font-medium text-rose-500 transition hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t('editablePriceTable.actions.removeRow')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={addRow}
          className="w-full rounded-full border border-border px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-border hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-auto"
        >
          {t('editablePriceTable.actions.addRow')}
        </Button>
        <div className="grid gap-1 text-right text-sm text-slate-500">
          <span>
            <strong className="text-slate-700">{t('editablePriceTable.totals.net')}</strong>{' '}
            {totals.net.toLocaleString('hu-HU')} {t('editablePriceTable.totals.currency')}
          </span>
          <span>
            {t('editablePriceTable.totals.vat')}: {totals.vat.toLocaleString('hu-HU')}{' '}
            {t('editablePriceTable.totals.currency')}
          </span>
          <span>
            <strong className="text-slate-700">{t('editablePriceTable.totals.gross')}</strong>{' '}
            {totals.gross.toLocaleString('hu-HU')} {t('editablePriceTable.totals.currency')}
          </span>
        </div>
      </div>
    </Card>
  );
}
