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

  const numberFormatter = useMemo(() => new Intl.NumberFormat('hu-HU'), []);
  const formatCurrency = (value: number) => `${numberFormatter.format(value)} Ft`;

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
        <table className="w-full border border-slate-200 text-sm text-slate-600">
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500">
            <tr>
              <th className="min-w-[14rem] px-4 py-3 text-left font-medium">
                {t('editablePriceTable.columns.item')}
              </th>
              <th className="min-w-[6rem] px-4 py-3 text-right font-medium">
                {t('editablePriceTable.columns.quantity')}
              </th>
              <th className="min-w-[7rem] px-4 py-3 text-left font-medium">
                {t('editablePriceTable.columns.unit')}
              </th>
              <th className="min-w-[8rem] px-4 py-3 text-right font-medium">
                {t('editablePriceTable.columns.unitPrice')}
              </th>
              <th className="min-w-[6rem] px-4 py-3 text-right font-medium">
                {t('editablePriceTable.columns.vat')}
              </th>
              <th className="min-w-[9rem] px-4 py-3 text-right font-medium">
                {t('editablePriceTable.columns.netTotal')}
              </th>
              <th className="w-16 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const lineNet = (Number(r.qty) || 0) * (Number(r.unitPrice) || 0);
              return (
                <tr key={r.id} className="border-b border-slate-200/80 bg-white even:bg-slate-50/60 last:border-b-0">
                  <td className="px-4 py-3 align-top">
                    <Input
                      placeholder={t('editablePriceTable.placeholders.name')}
                      value={r.name}
                      onChange={(e) => update(idx, 'name', e.target.value)}
                      title={r.name}
                      className="truncate py-2 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={r.qty}
                      onChange={(e) => update(idx, 'qty', e.target.value)}
                      className="py-2 text-right text-sm tabular-nums"
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
                      className="py-2 text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={r.vat}
                      onChange={(e) => update(idx, 'vat', e.target.value)}
                      className="py-2 text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                    {formatCurrency(lineNet)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      onClick={() => removeRow(r.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                      aria-label={t('editablePriceTable.actions.removeRow')}
                    >
                      {t('editablePriceTable.actions.removeRow')}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-700">
            <tr className="border-t-2 border-slate-300">
              <td className="px-4 py-3 text-right font-semibold" colSpan={5}>
                {t('editablePriceTable.totals.net')}
              </td>
              <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums text-base">
                {formatCurrency(totals.net)}
              </td>
              <td className="px-4 py-3" />
            </tr>
            <tr className="border-t border-slate-200">
              <td className="px-4 py-2 text-right font-semibold" colSpan={5}>
                {t('editablePriceTable.totals.vat')}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-slate-800 tabular-nums">
                {formatCurrency(totals.vat)}
              </td>
              <td className="px-4 py-2" />
            </tr>
            <tr className="border-t-2 border-slate-400 bg-slate-200/50">
              <td className="px-4 py-3 text-right font-bold text-base" colSpan={5}>
                {t('editablePriceTable.totals.gross')}
              </td>
              <td className="px-4 py-3 text-right font-bold text-lg text-slate-900 tabular-nums">
                {formatCurrency(totals.gross)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          onClick={addRow}
          className="w-full rounded-full border border-border px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation min-h-[44px] sm:w-auto"
        >
          {t('editablePriceTable.actions.addRow')}
        </Button>
      </div>
    </Card>
  );
}
