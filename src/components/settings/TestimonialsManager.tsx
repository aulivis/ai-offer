'use client';

import { useState } from 'react';
import { t } from '@/copy';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { PlusIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import type { Testimonial, ActivityRow } from './types';

type TestimonialsManagerProps = {
  testimonials: Testimonial[];
  activities: ActivityRow[];
  enabled: boolean;
  onTestimonialsChange: () => void;
};

const MAX_TESTIMONIALS = 10;

export function TestimonialsManager({
  testimonials,
  activities,
  enabled,
  onTestimonialsChange,
}: TestimonialsManagerProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const [newTestimonial, setNewTestimonial] = useState({ text: '', activityId: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  const handleAdd = async () => {
    if (!newTestimonial.text.trim()) {
      showToast({
        title: t('settings.testimonials.textRequired'),
        variant: 'error',
      });
      return;
    }

    if (testimonials.length >= MAX_TESTIMONIALS) {
      showToast({
        title: t('settings.testimonials.maxReached'),
        description: t('settings.testimonials.maxReachedDescription', { max: MAX_TESTIMONIALS }),
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('testimonials').insert({
        user_id: user?.id,
        text: newTestimonial.text.trim(),
        activity_id: newTestimonial.activityId || null,
      });

      if (error) {
        if (error.message.includes('Maximum 10 testimonials')) {
          showToast({
            title: t('settings.testimonials.maxReached'),
            description: t('settings.testimonials.maxReachedDescription', { max: MAX_TESTIMONIALS }),
            variant: 'error',
          });
        } else {
          throw error;
        }
        return;
      }

      setNewTestimonial({ text: '', activityId: '' });
      onTestimonialsChange();
      showToast({
        title: t('settings.testimonials.addSuccess'),
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: t('settings.testimonials.addFailed'),
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);

      if (error) {
        throw error;
      }

      onTestimonialsChange();
      showToast({
        title: t('settings.testimonials.deleteSuccess'),
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: t('settings.testimonials.deleteFailed'),
        variant: 'error',
      });
    } finally {
      setDeleting(null);
    }
  };

  const getActivityName = (activityId: string | null | undefined) => {
    if (!activityId) return t('settings.testimonials.noActivity');
    const activity = activities.find((a) => a.id === activityId);
    return activity?.name || t('settings.testimonials.unknownActivity');
  };

  return (
    <div className="space-y-6">
      {/* Add New Testimonial */}
      {testimonials.length < MAX_TESTIMONIALS && (
        <div className="rounded-xl border border-border/60 bg-slate-50/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            {t('settings.testimonials.addNew')}
          </h3>
          <div className="space-y-4">
            <Textarea
              label={t('settings.testimonials.textLabel')}
              placeholder={t('settings.testimonials.textPlaceholder')}
              value={newTestimonial.text}
              onChange={(e) => setNewTestimonial((prev) => ({ ...prev, text: e.target.value }))}
              rows={4}
            />
            <Select
              label={t('settings.testimonials.activityLabel')}
              value={newTestimonial.activityId}
              onChange={(e) => setNewTestimonial((prev) => ({ ...prev, activityId: e.target.value }))}
            >
              <option value="">{t('settings.testimonials.noActivity')}</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </Select>
            <Button onClick={handleAdd} disabled={saving} loading={saving} variant="secondary">
              <PlusIcon className="h-4 w-4" />
              {saving ? t('settings.testimonials.saving') : t('settings.testimonials.add')}
            </Button>
          </div>
        </div>
      )}

      {/* Testimonials List */}
      {testimonials.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('settings.testimonials.listTitle', { count: testimonials.length, max: MAX_TESTIMONIALS })}
            </h3>
          </div>
          <div className="grid gap-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="group relative rounded-lg border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-slate-700">{testimonial.text}</p>
                    {testimonial.activity_id && (
                      <p className="text-xs text-slate-500">
                        {t('settings.testimonials.linkedTo')}: {getActivityName(testimonial.activity_id)}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(testimonial.id)}
                    disabled={deleting === testimonial.id}
                    className="flex-shrink-0 rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border bg-slate-50/50 p-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            {t('settings.testimonials.empty')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('settings.testimonials.emptyHelper')}</p>
        </div>
      )}
    </div>
  );
}



