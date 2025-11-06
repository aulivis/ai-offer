'use client';

import { t } from '@/copy';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import EditablePriceTable, { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';

type Activity = {
  id: string;
  name: string;
  unit: string;
  default_unit_price: number;
  default_vat: number;
  industries: string[];
};

type ClientForm = {
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type Client = {
  id: string;
  company_name: string;
  address?: string;
  tax_id?: string;
  representative?: string;
  phone?: string;
  email?: string;
};

type WizardStep2PricingProps = {
  rows: PriceRow[];
  onRowsChange: (rows: PriceRow[]) => void;
  activities: Activity[];
  industry: string;
  validationError?: string;
  client: ClientForm;
  onClientChange: (client: Partial<ClientForm>) => void;
  clientList: Client[];
  onClientSelect: (client: Client) => void;
  showClientDropdown: boolean;
  onClientDropdownToggle: (show: boolean) => void;
  filteredClients: Client[];
};

export function WizardStep2Pricing({
  rows,
  onRowsChange,
  activities,
  industry,
  validationError,
  client,
  onClientChange,
  clientList,
  onClientSelect,
  showClientDropdown,
  onClientDropdownToggle,
  filteredClients,
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

  const handleClientFieldChange = (field: keyof ClientForm, value: string) => {
    onClientChange({ [field]: value });
  };

  const pickClient = (c: Client) => {
    onClientSelect(c);
    onClientDropdownToggle(false);
  };

  return (
    <div className="space-y-4">
      {/* Quick Insert Activities */}
      {filteredActivities.length > 0 && (
        <Card className="space-y-3 border-none bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t('offers.wizard.forms.details.quickInsertTitle')}
              </h2>
              <p className="text-[11px] text-slate-500">
                {t('offers.wizard.forms.details.quickInsertIndustryLabel')}: {industry}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {filteredActivities.length} tétel
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredActivities.map((a) => (
              <Button
                key={a.id}
                type="button"
                onClick={() => handleActivityClick(a)}
                className="rounded-full border border-border/70 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                + {a.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing Table */}
      <Card className="space-y-3 border-none bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t('offers.wizard.steps.pricing')}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t('offers.wizard.forms.pricing.helper')}
            </p>
          </div>
        </div>
        {validationError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-700">
            {validationError}
          </div>
        )}
        <EditablePriceTable rows={rows} onChange={onRowsChange} />
      </Card>

      {/* Client Information */}
      <Card className="space-y-3 border-none bg-white/95 p-4 shadow-lg ring-1 ring-slate-900/5 sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-700">
              {t('offers.wizard.forms.details.sections.client')}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t('offers.wizard.forms.details.sections.clientHelper')}
            </p>
          </div>
        </div>
        <div className="relative">
          <Input
            label={t('offers.wizard.forms.details.clientLookupLabel')}
            placeholder={t('offers.wizard.forms.details.clientLookupPlaceholder')}
            value={client.company_name}
            onChange={(e) => {
              handleClientFieldChange('company_name', e.target.value);
              onClientDropdownToggle(true);
            }}
            onFocus={() => onClientDropdownToggle(true)}
          />
          {showClientDropdown && filteredClients.length > 0 && (
            <div className="absolute z-10 mt-1.5 max-h-48 w-full overflow-auto rounded-xl border border-border/70 bg-white shadow-xl">
              {filteredClients.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 rounded-none border-none px-3 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onMouseDown={() => pickClient(c)}
                >
                  <span className="font-medium text-slate-700">{c.company_name}</span>
                  {c.email ? <span className="text-[11px] text-slate-500">{c.email}</span> : null}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={t('offers.wizard.forms.details.clientFieldAddress')}
            placeholder={t('offers.wizard.forms.details.clientFieldAddress')}
            value={client.address || ''}
            onChange={(e) => handleClientFieldChange('address', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldTax')}
            placeholder={t('offers.wizard.forms.details.clientFieldTax')}
            value={client.tax_id || ''}
            onChange={(e) => handleClientFieldChange('tax_id', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldRepresentative')}
            placeholder={t('offers.wizard.forms.details.clientFieldRepresentative')}
            value={client.representative || ''}
            onChange={(e) => handleClientFieldChange('representative', e.target.value)}
          />
          <Input
            label={t('offers.wizard.forms.details.clientFieldPhone')}
            placeholder={t('offers.wizard.forms.details.clientFieldPhone')}
            value={client.phone || ''}
            onChange={(e) => handleClientFieldChange('phone', e.target.value)}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('offers.wizard.forms.details.clientFieldEmail')}
              placeholder={t('offers.wizard.forms.details.clientFieldEmail')}
              value={client.email || ''}
              onChange={(e) => handleClientFieldChange('email', e.target.value)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
