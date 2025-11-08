'use client';

import { t } from '@/copy';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import EditablePriceTable, { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useToast } from '@/components/ToastProvider';

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
  onActivitySaved?: () => void;
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
  onActivitySaved,
}: WizardStep2PricingProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);

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

  const handleSaveActivity = async (row: PriceRow) => {
    if (!user || !row.name.trim()) {
      showToast({
        title: t('errors.settings.activityNameRequired'),
        description: t('errors.settings.activityNameRequired'),
        variant: 'error',
      });
      return;
    }

    try {
      setSavingActivityId(row.id);
      const ins = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          name: row.name.trim(),
          unit: row.unit || 'db',
          default_unit_price: Number(row.unitPrice) || 0,
          default_vat: Number(row.vat) || 27,
          industries: [industry],
        })
        .select();

      if (ins.error) {
        throw ins.error;
      }

      showToast({
        title: t('toasts.settings.activitySaved.title') || 'Tevékenység mentve',
        description: t('toasts.settings.activitySaved.description') || 'A tevékenység sikeresen mentve a beállításokba.',
        variant: 'success',
      });

      // Notify parent to reload activities
      onActivitySaved?.();
    } catch (error) {
      console.error('Failed to save activity:', error);
      showToast({
        title: t('errors.settings.saveFailed') || 'Hiba',
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown') || 'Ismeretlen hiba történt.',
        variant: 'error',
      });
    } finally {
      setSavingActivityId(null);
    }
  };

  const handleClientFieldChange = (field: keyof ClientForm, value: string) => {
    onClientChange({ [field]: value });
  };

  const pickClient = (c: Client) => {
    onClientSelect(c);
    onClientDropdownToggle(false);
  };

  return (
    <div className="space-y-6" aria-label={t('wizard.pricing.ariaLabel')}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">
          {t('offers.wizard.steps.pricing')}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {t('offers.wizard.forms.pricing.helper')}
        </p>
      </div>

      {/* Error Summary */}
      {validationError && (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50/90 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-semibold text-rose-900">{validationError}</p>
          </div>
        </div>
      )}

      {/* Quick Insert Activities */}
      {filteredActivities.length > 0 && (
        <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {t('offers.wizard.forms.details.quickInsertTitle')}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {t('offers.wizard.forms.details.quickInsertIndustryLabel')}: <span className="font-semibold">{industry}</span>
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {t('wizard.quota.itemCount', { count: filteredActivities.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredActivities.map((a) => (
              <Button
                key={a.id}
                type="button"
                onClick={() => handleActivityClick(a)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 touch-manipulation min-h-[44px]"
              >
                + {a.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Pricing Table */}
      <Card className="border-none bg-white/95 shadow-lg ring-1 ring-slate-900/5 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            {t('offers.wizard.steps.pricing')}
          </h3>
        </div>
        <EditablePriceTable 
          rows={rows} 
          onChange={onRowsChange}
          activities={activities}
          onSaveActivity={handleSaveActivity}
          savingActivityId={savingActivityId}
        />
      </Card>

      {/* Client Information */}
      <Card className="space-y-4 border-none bg-white/95 p-5 shadow-lg ring-1 ring-slate-900/5 sm:p-6">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {t('offers.wizard.forms.details.sections.client')}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
