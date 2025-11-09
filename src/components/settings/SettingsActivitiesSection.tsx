'use client';

import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader } from '@/components/ui/Card';
import { CubeIcon, CheckCircleIcon, PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { ActivityRow } from './types';
import { ALL_INDUSTRIES_HU } from './types';
import { ActivityImageManager } from './ActivityImageManager';

type NewActivity = {
  name: string;
  unit: string;
  price: number;
  vat: number;
  industries: string[];
};

type SettingsActivitiesSectionProps = {
  activities: ActivityRow[];
  newActivity: NewActivity;
  saving: boolean;
  plan: 'free' | 'standard' | 'pro';
  onNewActivityChange: (updater: (prev: NewActivity) => NewActivity) => void;
  onToggleNewActivityIndustry: (industry: string) => void;
  onAddActivity: () => void;
  onDeleteActivity: (id: string) => void;
  onActivityImagesChange: (activityId: string, imagePaths: string[]) => Promise<void>;
  onOpenPlanUpgradeDialog: (options: { description: string }) => void;
};

export function SettingsActivitiesSection({
  activities,
  newActivity,
  saving,
  plan,
  onNewActivityChange,
  onToggleNewActivityIndustry,
  onAddActivity,
  onDeleteActivity,
  onActivityImagesChange,
  onOpenPlanUpgradeDialog,
}: SettingsActivitiesSectionProps) {
  const isPro = plan === 'pro';
  return (
    <Card
      id="activities"
      as="section"
      className="scroll-mt-24"
      header={
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CubeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('settings.activities.title')}</h2>
              <p className="text-sm text-slate-500">{t('settings.activities.subtitle')}</p>
            </div>
          </div>
        </CardHeader>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-slate-50/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            {t('settings.activities.addNewHeading')}
          </h3>
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Input
                label={t('settings.activities.fields.name')}
                placeholder={t('settings.activities.placeholders.name')}
                value={newActivity.name}
                onChange={(e) => onNewActivityChange((a) => ({ ...a, name: e.target.value }))}
              />
            </div>
            <Input
              label={t('settings.activities.fields.unit')}
              placeholder={t('settings.activities.placeholders.unit')}
              value={newActivity.unit}
              onChange={(e) => onNewActivityChange((a) => ({ ...a, unit: e.target.value }))}
            />
            <Input
              label={t('settings.activities.fields.price')}
              type="number"
              min={0}
              value={newActivity.price}
              onChange={(e) => onNewActivityChange((a) => ({ ...a, price: Number(e.target.value) }))}
            />
            <Input
              label={t('settings.activities.fields.vat')}
              type="number"
              min={0}
              max={100}
              value={newActivity.vat}
              onChange={(e) => onNewActivityChange((a) => ({ ...a, vat: Number(e.target.value) }))}
            />
          </div>
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('settings.activities.industries.heading')}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_INDUSTRIES_HU.map((ind) => {
                const active = newActivity.industries.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => onToggleNewActivityIndustry(ind)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-border bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-50'
                    }`}
                  >
                    {active && <CheckCircleIcon className="h-3 w-3" />}
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={onAddActivity} disabled={saving} loading={saving} variant="secondary">
              <PlusIcon className="h-4 w-4" />
              {saving ? t('settings.activities.saving') : t('settings.activities.add')}
            </Button>
          </div>
        </div>

        {activities.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activities.map((a) => (
              <div
                key={a.id}
                className="group relative rounded-xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900">{a.name}</h3>
                    <p className="text-xs text-slate-600">
                      {t('settings.activities.summary', {
                        unit: a.unit,
                        price: Number(a.default_unit_price || 0).toLocaleString('hu-HU'),
                        vat: a.default_vat,
                      })}
                    </p>
                    {(a.industries || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(a.industries || []).slice(0, 3).map((ind) => (
                          <span
                            key={ind}
                            className="inline-flex items-center rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {ind}
                          </span>
                        ))}
                        {(a.industries || []).length > 3 && (
                          <span className="inline-flex items-center rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            +{(a.industries || []).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(a.id)}
                    className="flex-shrink-0 rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    aria-label={t('settings.activities.deleteAriaLabel', { name: a.name })}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <ActivityImageManager
                  activityId={a.id}
                  imagePaths={(a.reference_images as string[] | null) || []}
                  enabled={isPro}
                  plan={plan}
                  onImagesChange={async (paths) => {
                    await onActivityImagesChange(a.id, paths);
                  }}
                  onOpenPlanUpgradeDialog={onOpenPlanUpgradeDialog}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-12 text-center">
            <CubeIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-600">{t('settings.activities.empty')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('settings.activities.emptyHelper')}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

