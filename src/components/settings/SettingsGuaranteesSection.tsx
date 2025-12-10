'use client';

import { useEffect, useState } from 'react';
import { t } from '@/copy';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import type { ActivityRow, GuaranteeRow } from './types';
import { ShieldCheckIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

type SettingsGuaranteesSectionProps = {
  activities: ActivityRow[];
  guarantees: GuaranteeRow[];
  addLoading?: boolean;
  busyGuaranteeId?: string | null;
  onAddGuarantee: (text: string) => Promise<void> | void;
  onUpdateGuarantee: (id: string, text: string) => Promise<void> | void;
  onDeleteGuarantee: (id: string) => Promise<void> | void;
  onToggleAttachment: (
    guaranteeId: string,
    activityId: string,
    shouldAttach: boolean,
  ) => Promise<void> | void;
};

export function SettingsGuaranteesSection({
  activities,
  guarantees,
  addLoading = false,
  busyGuaranteeId = null,
  onAddGuarantee,
  onUpdateGuarantee,
  onDeleteGuarantee,
  onToggleAttachment,
}: SettingsGuaranteesSectionProps) {
  const [newGuarantee, setNewGuarantee] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    // Only initialize drafts for new guarantees, preserve existing drafts for guarantees being edited
    setDrafts((prevDrafts) => {
      const nextDrafts: Record<string, string> = { ...prevDrafts };
      guarantees.forEach((guarantee) => {
        // Only set draft if it doesn't exist or if the guarantee text has changed externally
        // (e.g., after a successful save from another tab/device)
        if (!(guarantee.id in nextDrafts) || prevDrafts[guarantee.id] === guarantee.text) {
          nextDrafts[guarantee.id] = guarantee.text;
        }
      });
      // Remove drafts for guarantees that no longer exist
      Object.keys(nextDrafts).forEach((id) => {
        if (!guarantees.some((g) => g.id === id)) {
          delete nextDrafts[id];
        }
      });
      return nextDrafts;
    });
  }, [guarantees]);

  const handleAdd = () => {
    const trimmed = newGuarantee.trim();
    if (!trimmed) {
      return;
    }
    Promise.resolve(onAddGuarantee(trimmed)).finally(() => {
      setNewGuarantee('');
    });
  };

  return (
    <div id="guarantees" className="space-y-8 w-full scroll-mt-24">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-turquoise-100 to-primary/10 shadow-sm">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent"></div>
            <ShieldCheckIcon className="relative z-10 h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-fg mb-1">
              {t('settings.guarantees.title')}
            </h2>
            <p className="text-sm md:text-base text-fg-muted">
              {t('settings.guarantees.subtitle')}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label={t('settings.guarantees.addLabel')}
                placeholder={t('settings.guarantees.addPlaceholder')}
                value={newGuarantee}
                onChange={(event) => setNewGuarantee(event.target.value)}
                disabled={addLoading}
              />
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={addLoading || newGuarantee.trim().length === 0}
              loading={addLoading}
              className="sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              {t('settings.guarantees.addButton')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-fg-muted">{t('settings.guarantees.helper')}</p>
        </div>

        {guarantees.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-white/70 p-10 text-center">
            <ShieldCheckIcon className="mx-auto h-10 w-10 text-fg-muted" />
            <p className="mt-3 text-sm font-medium text-fg">{t('settings.guarantees.empty')}</p>
            <p className="mt-1 text-xs text-fg-muted">{t('settings.guarantees.emptyHelper')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {guarantees.map((guarantee) => {
              const draftValue = drafts[guarantee.id] ?? guarantee.text;
              const isBusy = busyGuaranteeId === guarantee.id;
              return (
                <div
                  key={guarantee.id}
                  className="space-y-4 rounded-2xl border border-border bg-white/90 p-5 shadow-sm"
                >
                  <Textarea
                    label={t('settings.guarantees.textLabel')}
                    rows={3}
                    value={draftValue}
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [guarantee.id]: event.target.value }))
                    }
                    disabled={isBusy}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isBusy || draftValue.trim() === guarantee.text.trim()}
                      loading={isBusy}
                      onClick={() => onUpdateGuarantee(guarantee.id, draftValue.trim())}
                    >
                      {t('settings.guarantees.saveButton')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-danger hover:text-danger/90"
                      disabled={isBusy}
                      onClick={() => onDeleteGuarantee(guarantee.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                      {t('settings.guarantees.deleteButton')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                      {t('settings.guarantees.attachLabel')}
                    </p>
                    {activities.length === 0 ? (
                      <p className="text-xs text-fg-muted">
                        {t('settings.guarantees.attachDisabled')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {activities.map((activity) => {
                          const attached = guarantee.activity_ids.includes(activity.id);
                          return (
                            <button
                              key={activity.id}
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                onToggleAttachment(guarantee.id, activity.id, !attached)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                attached
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-border bg-bg-muted text-fg hover:border-primary/40 hover:bg-bg-muted'
                              }`}
                            >
                              {attached ? '✓' : '+'} {activity.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-fg-muted">
                      {t('settings.guarantees.attachHelper')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
