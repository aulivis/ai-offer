'use client';

import { t } from '@/copy';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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

type Activity = {
  id: string;
  name: string;
  unit: string;
};

type Props = {
  rows: PriceRow[];
  onChange: (rows: PriceRow[]) => void;
  activities?: Activity[];
  onSaveActivity?: (row: PriceRow) => Promise<void>;
  savingActivityId?: string | null;
};

export default function EditablePriceTable({ 
  rows, 
  onChange, 
  activities = [],
  onSaveActivity,
  savingActivityId = null 
}: Props) {
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
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Mobile-optimized table with horizontal scroll indicator */}
      <div className="relative overflow-x-auto">
        {/* Scroll indicator for mobile */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" aria-hidden="true" />
        <table 
          className="w-full text-sm text-slate-600"
          role="table"
          aria-label={t('editablePriceTable.ariaLabel') || 'Pricing table'}
        >
          <thead className="border-b border-slate-200/80 bg-slate-50/80 text-slate-500">
            <tr>
              <th className="sticky left-0 z-10 min-w-[12rem] bg-slate-50/80 px-3 py-3 text-left font-medium sm:min-w-[14rem] sm:px-4">
                {t('editablePriceTable.columns.item')}
              </th>
              <th className="min-w-[5rem] px-2 py-3 text-right font-medium sm:min-w-[6rem] sm:px-4">
                {t('editablePriceTable.columns.quantity')}
              </th>
              <th className="min-w-[5rem] px-2 py-3 text-left font-medium sm:min-w-[7rem] sm:px-4">
                {t('editablePriceTable.columns.unit')}
              </th>
              <th className="min-w-[7rem] px-2 py-3 text-right font-medium sm:min-w-[8rem] sm:px-4">
                {t('editablePriceTable.columns.unitPrice')}
              </th>
              <th className="min-w-[5rem] px-2 py-3 text-right font-medium sm:min-w-[6rem] sm:px-4">
                {t('editablePriceTable.columns.vat')}
              </th>
              <th className="min-w-[8rem] px-2 py-3 text-right font-medium sm:min-w-[9rem] sm:px-4">
                {t('editablePriceTable.columns.netTotal')}
              </th>
              <th className="w-12 px-2 py-3 sm:w-16 sm:px-4" aria-label={t('editablePriceTable.columns.actions') || 'Actions'} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const lineNet = (Number(r.qty) || 0) * (Number(r.unitPrice) || 0);
              // Check if this row matches an existing activity
              const matchesActivity = activities.some(
                (a) => a.name.trim().toLowerCase() === r.name.trim().toLowerCase() && a.unit === r.unit
              );
              // Show save button if row has a name and doesn't match existing activity
              const canSaveActivity = onSaveActivity && r.name.trim() && !matchesActivity;
              const isSaving = savingActivityId === r.id;
              
              return (
                <tr key={r.id} className="border-b border-slate-200/80 bg-white even:bg-slate-50/60 last:border-b-0">
                  <td className="sticky left-0 z-10 bg-white px-3 py-3 align-top even:bg-slate-50/60 sm:px-4">
                    <Input
                      placeholder={t('editablePriceTable.placeholders.name')}
                      value={r.name}
                      onChange={(e) => update(idx, 'name', e.target.value)}
                      title={r.name}
                      className="truncate py-2 text-sm"
                    />
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.qty}
                      onChange={(e) => update(idx, 'qty', e.target.value)}
                      className="py-2 text-right text-sm tabular-nums"
                      aria-label={`${t('editablePriceTable.columns.quantity')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <Input
                      placeholder={t('editablePriceTable.placeholders.unit')}
                      value={r.unit}
                      onChange={(e) => update(idx, 'unit', e.target.value)}
                      className="py-2 text-sm"
                      aria-label={`${t('editablePriceTable.columns.unit')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.unitPrice}
                      onChange={(e) => update(idx, 'unitPrice', e.target.value)}
                      className="py-2 text-right text-sm tabular-nums"
                      aria-label={`${t('editablePriceTable.columns.unitPrice')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.vat}
                      onChange={(e) => update(idx, 'vat', e.target.value)}
                      className="py-2 text-right text-sm tabular-nums"
                      aria-label={`${t('editablePriceTable.columns.vat')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-2 py-3 text-right font-semibold text-slate-700 tabular-nums sm:px-4">
                    {formatCurrency(lineNet)}
                  </td>
                  <td className="px-2 py-3 sm:px-4">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="inline-flex h-8 w-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-red-300 bg-red-50 text-red-600 transition hover:border-red-400 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${t('editablePriceTable.actions.removeRow')}: ${r.name || `row ${idx + 1}`}`}
                        title={t('editablePriceTable.actions.removeRow')}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {canSaveActivity && (
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => onSaveActivity?.(r)}
                            disabled={isSaving}
                            className="inline-flex h-8 w-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-green-300 bg-green-50 text-green-600 transition hover:border-green-400 hover:bg-green-100 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`${t('editablePriceTable.actions.saveActivity')}: ${r.name}`}
                            title={t('editablePriceTable.actions.saveActivity')}
                          >
                            {isSaving ? (
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                            ) : (
                              <PlusIcon className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-br from-slate-50 to-slate-100/50 text-slate-700">
            <tr className="border-t-2 border-slate-300">
              <td className="sticky left-0 z-10 bg-slate-50/80 px-3 py-3 text-right font-semibold sm:px-4" colSpan={5}>
                {t('editablePriceTable.totals.net')}
              </td>
              <td className="px-2 py-3 text-right font-bold text-slate-900 tabular-nums text-base sm:px-4">
                {formatCurrency(totals.net)}
              </td>
              <td className="px-2 py-3 sm:px-4" />
            </tr>
            <tr className="border-t border-slate-200">
              <td className="sticky left-0 z-10 bg-slate-50/80 px-3 py-2 text-right font-semibold sm:px-4" colSpan={5}>
                {t('editablePriceTable.totals.vat')}
              </td>
              <td className="px-2 py-2 text-right font-semibold text-slate-800 tabular-nums sm:px-4">
                {formatCurrency(totals.vat)}
              </td>
              <td className="px-2 py-2 sm:px-4" />
            </tr>
            <tr className="border-t-2 border-slate-400 bg-slate-200/50">
              <td className="sticky left-0 z-10 bg-slate-200/50 px-3 py-3 text-right font-bold text-base sm:px-4" colSpan={5}>
                {t('editablePriceTable.totals.gross')}
              </td>
              <td className="px-2 py-3 text-right font-bold text-lg text-slate-900 tabular-nums sm:px-4">
                {formatCurrency(totals.gross)}
              </td>
              <td className="px-2 py-3 sm:px-4" />
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
    </div>
  );
}
