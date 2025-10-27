'use client';

import { t } from '@/copy';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export type PriceRow = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  vat: number;
};

const numericKeys: Array<keyof Pick<PriceRow, 'qty' | 'unitPrice' | 'vat'>> = [
  'qty',
  'unitPrice',
  'vat',
];

const isNumericKey = (key: keyof PriceRow): key is (typeof numericKeys)[number] =>
  numericKeys.includes(key as (typeof numericKeys)[number]);

const generateRowId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function createPriceRow(
  overrides: Partial<Omit<PriceRow, 'id'>> & { id?: string } = {},
): PriceRow {
  const { id, ...rest } = overrides;
  return {
    id: id ?? generateRowId(),
    name: '',
    qty: 1,
    unit: 'db',
    unitPrice: 0,
    vat: 27,
    ...rest,
  };
}

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
    const value = isNumericKey(key)
      ? (Number(val) as PriceRow[typeof key])
      : (String(val) as PriceRow[typeof key]);
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };

  const addRow = () => onChange([...rows, createPriceRow()]);
  const removeRow = (rowId: string) => onChange(rows.filter((row) => row.id !== rowId));

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">
                {t('editablePriceTable.columns.item')}
              </th>
              <th className="w-24 px-4 py-3 font-medium">
                {t('editablePriceTable.columns.quantity')}
              </th>
              <th className="w-28 px-4 py-3 font-medium">
                {t('editablePriceTable.columns.unit')}
              </th>
              <th className="w-36 px-4 py-3 font-medium">
                {t('editablePriceTable.columns.unitPrice')}
              </th>
              <th className="w-24 px-4 py-3 font-medium">
                {t('editablePriceTable.columns.vat')}
              </th>
              <th className="w-36 px-4 py-3 text-right font-medium">
                {t('editablePriceTable.columns.netTotal')}
              </th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className="border-t border-border">
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
                    onClick={() => removeRow(r.id)}
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
