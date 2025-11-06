'use client';

import { t } from '@/copy';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import EditablePriceTable, { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';

type Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};

type WizardStep2PricingProps = {
  rows: PriceRow[];
  onRowsChange: (rows: PriceRow[]) => void;
  activities: Activity[];
  industry: string;
  validationError?: string;
};

export function WizardStep2Pricing({
  rows,
  onRowsChange,
  activities,
  industry,
  validationError,
}: WizardStep2PricingProps) {
  const filteredActivities = useMemo(() => {
    return activities.filter(
      (a) => (a.industries || []).length === 0 || a.industries.includes(industry),
    );
  }, [activities, industry]);

  const handleActivityClick = (activity: Activity) => {
    onRowsChange([
      createPriceRow({
        name: activity.name,
        qty: 1,
        unit: activity.unit || 'db',
        unitPrice: Number(activity.default_unit_price || 0),
        vat: Number(activity.default_vat || 27),
      }),
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Quick Insert Activities */}
      {filteredActivities.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {t('offers.wizard.forms.details.quickInsertTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('offers.wizard.forms.details.quickInsertIndustryLabel')}: {industry}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {filteredActivities.length} tétel
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredActivities.map((a) => (
              <Button
                key={a.id}
                type="button"
                onClick={() => handleActivityClick(a)}
                className="rounded-full border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                + {a.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t('offers.wizard.steps.pricing')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('offers.wizard.forms.pricing.helper')}
            </p>
          </div>
        </div>
        {validationError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-sm text-rose-700">
            {validationError}
          </div>
        )}
        <EditablePriceTable rows={rows} onChange={onRowsChange} />
      </div>
    </div>
  );
}

