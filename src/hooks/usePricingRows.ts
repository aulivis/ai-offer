import { useMemo } from 'react';
import type { PriceRow } from '@/components/EditablePriceTable';
import { priceTableHtml } from '@/app/lib/pricing';

type PricingTotals = {
  net: number;
  vat: number;
  gross: number;
};

export function usePricingRows(pricingRows: PriceRow[]): {
  totals: PricingTotals;
  pricePreviewHtml: string;
} {
  const totals = useMemo(() => {
    const net = pricingRows.reduce((sum, row) => sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0), 0);
    const vat = pricingRows.reduce(
      (sum, row) => sum + (Number(row.qty) || 0) * (Number(row.unitPrice) || 0) * ((Number(row.vat) || 0) / 100),
      0,
    );
    return { net, vat, gross: net + vat };
  }, [pricingRows]);

  const pricePreviewHtml = useMemo(() => priceTableHtml(pricingRows), [pricingRows]);

  return { totals, pricePreviewHtml };
}
