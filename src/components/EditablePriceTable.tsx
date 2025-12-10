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
  savingActivityId = null,
}: Props) {
  // Defensive check: ensure rows is always an array
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  const totals = useMemo(() => {
    const net = safeRows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0), 0);
    const vat = safeRows.reduce(
      (s, r) =>
        s + (Number(r.qty) || 0) * (Number(r.unitPrice) || 0) * ((Number(r.vat) || 0) / 100),
      0,
    );
    const gross = net + vat;
    return { net, vat, gross };
  }, [safeRows]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('hu-HU'), []);
  const formatCurrency = (value: number) => `${numberFormatter.format(value)} Ft`;

  const update = (idx: number, key: keyof PriceRow, val: string | number) => {
    // Defensive check: ensure rows is always an array
    const currentRows = Array.isArray(rows) ? rows : [];
    if (idx < 0 || idx >= currentRows.length) {
      return;
    }
    const next = [...currentRows];
    const value = isNumericKey(key)
      ? (Number(val) as PriceRow[typeof key])
      : (String(val) as PriceRow[typeof key]);
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };

  const addRow = () => {
    const currentRows = Array.isArray(rows) ? rows : [];
    onChange([...currentRows, createPriceRow()]);
  };
  const removeRow = (rowId: string) => {
    const currentRows = Array.isArray(rows) ? rows : [];
    onChange(currentRows.filter((row) => row.id !== rowId));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Mobile-optimized table with horizontal scroll indicator */}
      <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Scroll indicators for mobile - both sides */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-bg to-transparent md:hidden z-20"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent md:hidden z-20"
          aria-hidden="true"
        />
        {/* Mobile scroll hint */}
        <div className="md:hidden absolute bottom-2 right-2 z-10 bg-bg/90 backdrop-blur-sm px-2 py-1 rounded text-caption text-fg-muted border border-border/50">
          ← Görgess →
        </div>
        <table
          className="w-full text-body-small text-fg-muted min-w-[640px]"
          role="table"
          aria-label={t('editablePriceTable.ariaLabel') || 'Pricing table'}
        >
          <thead className="border-b border-border/80 bg-bg-muted/80 text-fg-muted">
            <tr>
              <th className="sticky left-0 z-10 min-w-[10rem] bg-bg-muted/95 backdrop-blur-sm px-2 py-2.5 text-left font-medium sm:min-w-[12rem] sm:px-3 md:min-w-[14rem] md:px-4">
                {t('editablePriceTable.columns.item')}
              </th>
              <th className="min-w-[4rem] px-1.5 py-2.5 text-right font-medium text-caption sm:min-w-[5rem] sm:px-2 sm:text-body-small md:min-w-[6rem] md:px-4">
                {t('editablePriceTable.columns.quantity')}
              </th>
              <th className="min-w-[4rem] px-1.5 py-2.5 text-left font-medium text-caption sm:min-w-[5rem] sm:px-2 sm:text-body-small md:min-w-[7rem] md:px-4">
                {t('editablePriceTable.columns.unit')}
              </th>
              <th className="min-w-[6rem] px-1.5 py-2.5 text-right font-medium text-caption sm:min-w-[7rem] sm:px-2 sm:text-body-small md:min-w-[8rem] md:px-4">
                {t('editablePriceTable.columns.unitPrice')}
              </th>
              <th className="min-w-[4rem] px-1.5 py-2.5 text-right font-medium text-caption sm:min-w-[5rem] sm:px-2 sm:text-body-small md:min-w-[6rem] md:px-4">
                {t('editablePriceTable.columns.vat')}
              </th>
              <th className="min-w-[7rem] px-1.5 py-2.5 text-right font-medium text-caption sm:min-w-[8rem] sm:px-2 sm:text-body-small md:min-w-[9rem] md:px-4">
                {t('editablePriceTable.columns.netTotal')}
              </th>
              <th
                className="w-10 px-1.5 py-2.5 sm:w-12 sm:px-2 md:w-16 md:px-4"
                aria-label={t('editablePriceTable.columns.actions') || 'Actions'}
              />
            </tr>
          </thead>
          <tbody>
            {safeRows.map((r, idx) => {
              const lineNet = (Number(r.qty) || 0) * (Number(r.unitPrice) || 0);
              // Check if this row matches an existing activity
              const matchesActivity = activities.some(
                (a) =>
                  a.name.trim().toLowerCase() === r.name.trim().toLowerCase() && a.unit === r.unit,
              );
              // Show save button if row has a name and doesn't match existing activity
              const canSaveActivity = onSaveActivity && r.name.trim() && !matchesActivity;
              const isSaving = savingActivityId === r.id;

              return (
                <tr
                  key={r.id}
                  className="border-b border-border/80 bg-bg-muted even:bg-bg/60 last:border-b-0"
                >
                  <td className="sticky left-0 z-10 bg-bg-muted/95 backdrop-blur-sm px-2 py-2.5 align-top even:bg-bg/60 sm:px-3 md:px-4">
                    <Input
                      placeholder={t('editablePriceTable.placeholders.name')}
                      value={r.name}
                      onChange={(e) => update(idx, 'name', e.target.value)}
                      title={r.name}
                      className="truncate py-1.5 text-caption sm:py-2 sm:text-body-small"
                    />
                  </td>
                  <td className="px-1.5 py-2.5 sm:px-2 md:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.qty}
                      onChange={(e) => update(idx, 'qty', e.target.value)}
                      className="py-1.5 text-right text-caption tabular-nums sm:py-2 sm:text-body-small"
                      aria-label={`${t('editablePriceTable.columns.quantity')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-1.5 py-2.5 sm:px-2 md:px-4">
                    <Input
                      placeholder={t('editablePriceTable.placeholders.unit')}
                      value={r.unit}
                      onChange={(e) => update(idx, 'unit', e.target.value)}
                      className="py-1.5 text-caption sm:py-2 sm:text-body-small"
                      aria-label={`${t('editablePriceTable.columns.unit')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-1.5 py-2.5 sm:px-2 md:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.unitPrice}
                      onChange={(e) => update(idx, 'unitPrice', e.target.value)}
                      className="py-1.5 text-right text-caption tabular-nums sm:py-2 sm:text-body-small"
                      aria-label={`${t('editablePriceTable.columns.unitPrice')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-1.5 py-2.5 sm:px-2 md:px-4">
                    <Input
                      type="number"
                      min={0}
                      value={r.vat}
                      onChange={(e) => update(idx, 'vat', e.target.value)}
                      className="py-1.5 text-right text-caption tabular-nums sm:py-2 sm:text-body-small"
                      aria-label={`${t('editablePriceTable.columns.vat')} for ${r.name || `row ${idx + 1}`}`}
                    />
                  </td>
                  <td className="px-1.5 py-2.5 text-right font-semibold text-fg tabular-nums text-caption sm:px-2 sm:text-body-small md:px-4 md:text-body">
                    {formatCurrency(lineNet)}
                  </td>
                  <td className="px-1.5 py-2.5 sm:px-2 md:px-4">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2">
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="inline-flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger transition hover:border-danger/50 hover:bg-danger/20 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        aria-label={`${t('editablePriceTable.actions.removeRow')}: ${r.name || `row ${idx + 1}`}`}
                        title={t('editablePriceTable.actions.removeRow')}
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                      </button>
                      {canSaveActivity && (
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => onSaveActivity?.(r)}
                            disabled={isSaving}
                            className="inline-flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-success/30 bg-success/10 text-success transition hover:border-success/50 hover:bg-success/20 hover:text-success focus:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            aria-label={`${t('editablePriceTable.actions.saveActivity')}: ${r.name}`}
                            title={t('editablePriceTable.actions.saveActivity')}
                          >
                            {isSaving ? (
                              <span
                                className="inline-block h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                                aria-hidden="true"
                              />
                            ) : (
                              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
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
          <tfoot className="bg-gradient-to-br from-bg-muted to-bg-muted/50 text-fg">
            <tr className="border-t-2 border-border">
              <td
                className="sticky left-0 z-10 bg-bg-muted/95 backdrop-blur-sm px-2 py-2.5 text-right font-semibold text-caption sm:px-3 sm:text-body-small md:px-4 md:text-body"
                colSpan={5}
              >
                {t('editablePriceTable.totals.net')}
              </td>
              <td className="px-1.5 py-2.5 text-right font-bold text-fg tabular-nums text-caption sm:px-2 sm:text-body-small md:px-4 md:text-body">
                {formatCurrency(totals.net)}
              </td>
              <td className="px-1.5 py-2.5 sm:px-2 md:px-4" />
            </tr>
            <tr className="border-t border-border">
              <td
                className="sticky left-0 z-10 bg-bg-muted/95 backdrop-blur-sm px-2 py-2 text-right font-semibold text-caption sm:px-3 sm:text-body-small md:px-4 md:text-body"
                colSpan={5}
              >
                {t('editablePriceTable.totals.vat')}
              </td>
              <td className="px-1.5 py-2 text-right font-semibold text-fg tabular-nums text-caption sm:px-2 sm:text-body-small md:px-4 md:text-body">
                {formatCurrency(totals.vat)}
              </td>
              <td className="px-1.5 py-2 sm:px-2 md:px-4" />
            </tr>
            <tr className="border-t-2 border-border bg-bg-muted/50">
              <td
                className="sticky left-0 z-10 bg-bg-muted/50 px-2 py-2.5 text-right font-bold text-body-small sm:px-3 sm:text-body md:px-4"
                colSpan={5}
              >
                {t('editablePriceTable.totals.gross')}
              </td>
              <td className="px-1.5 py-2.5 text-right font-bold text-body text-fg tabular-nums sm:px-2 sm:text-body-large md:px-4 md:text-h5">
                {formatCurrency(totals.gross)}
              </td>
              <td className="px-1.5 py-2.5 sm:px-2 md:px-4" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-border bg-bg-muted/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          onClick={addRow}
          className="w-full rounded-full border border-border px-5 py-3 text-body-small font-semibold text-fg-muted transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation min-h-[44px] sm:w-auto"
        >
          {t('editablePriceTable.actions.addRow')}
        </Button>
      </div>
    </div>
  );
}
