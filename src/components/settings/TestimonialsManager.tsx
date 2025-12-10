'use client';

import { useState } from 'react';
import { t } from '@/copy';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/hooks/useToast';
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
  plan: 'free' | 'standard' | 'pro';
  onTestimonialsChange: () => void;
};

type StarStyle = 'filled' | 'outlined' | 'solid';

const MAX_TESTIMONIALS = 10;

const STAR_STYLES: { value: StarStyle; label: string }[] = [
  { value: 'filled', label: 'Kitöltött' },
  { value: 'outlined', label: 'Körvonalas' },
  { value: 'solid', label: 'Tömör' },
];

function StarRating({
  rating,
  style,
  size = 16,
}: {
  rating: number;
  style: StarStyle;
  size?: number;
}) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  const sizeClass = size === 16 ? 'h-4 w-4' : 'h-5 w-5';

  if (style === 'filled') {
    return (
      <div className="flex gap-0.5">
        {stars.map((filled, i) => (
          <svg
            key={i}
            className={`${sizeClass} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

  if (style === 'outlined') {
    return (
      <div className="flex gap-0.5">
        {stars.map((filled, i) => (
          <svg
            key={i}
            className={`${sizeClass} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  }

  // solid style - filled stars with darker yellow
  return (
    <div className="flex gap-0.5">
      {stars.map((filled, i) => (
        <svg
          key={i}
          className={`${sizeClass} ${filled ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsManager({
  testimonials,
  activities,
  enabled,
  plan: _plan,
  onTestimonialsChange,
}: TestimonialsManagerProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const [newTestimonial, setNewTestimonial] = useState({
    text: '',
    activityId: '',
    starRating: 5,
    starStyle: 'filled' as StarStyle,
    showStars: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  const handleAdd = async () => {
    if (!newTestimonial.text.trim()) {
      showToast({
        description: t('settings.testimonials.textRequired'),
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
        star_rating: newTestimonial.showStars ? newTestimonial.starRating || null : null,
        star_style: newTestimonial.showStars ? newTestimonial.starStyle || null : null,
      });

      if (error) {
        if (error.message.includes('Maximum 10 testimonials')) {
          showToast({
            title: t('settings.testimonials.maxReached'),
            description: t('settings.testimonials.maxReachedDescription', {
              max: MAX_TESTIMONIALS,
            }),
            variant: 'error',
          });
        } else {
          throw error;
        }
        return;
      }

      setNewTestimonial({
        text: '',
        activityId: '',
        starRating: 5,
        starStyle: 'filled',
        showStars: true,
      });
      onTestimonialsChange();
      showToast({
        description: t('settings.testimonials.addSuccess'),
        variant: 'success',
      });
    } catch {
      showToast({
        description: t('settings.testimonials.addFailed'),
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
        description: t('settings.testimonials.deleteSuccess'),
        variant: 'success',
      });
    } catch {
      showToast({
        description: t('settings.testimonials.deleteFailed'),
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
        <div>
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
              onChange={(e) =>
                setNewTestimonial((prev) => ({ ...prev, activityId: e.target.value }))
              }
            >
              <option value="">{t('settings.testimonials.noActivity')}</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </Select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Csillag értékelés
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewTestimonial((prev) => ({ ...prev, showStars: !prev.showStars }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    newTestimonial.showStars ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      newTestimonial.showStars ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {newTestimonial.showStars && (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Értékelés:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() =>
                              setNewTestimonial((prev) => ({ ...prev, starRating: rating }))
                            }
                            className={`text-lg transition-colors ${
                              newTestimonial.starRating >= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } hover:text-yellow-500`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {newTestimonial.starRating} / 5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-600">Stílus:</span>
                    <div className="flex gap-2">
                      {STAR_STYLES.map((styleOption) => (
                        <button
                          key={styleOption.value}
                          type="button"
                          onClick={() =>
                            setNewTestimonial((prev) => ({ ...prev, starStyle: styleOption.value }))
                          }
                          className={`rounded border px-3 py-1.5 text-xs font-semibold transition-all ${
                            newTestimonial.starStyle === styleOption.value
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-white text-slate-700 hover:border-primary/50'
                          }`}
                        >
                          {styleOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <StarRating
                      rating={newTestimonial.starRating}
                      style={newTestimonial.starStyle}
                    />
                  </div>
                </>
              )}
            </div>
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
              {t('settings.testimonials.listTitle', {
                count: testimonials.length,
                max: MAX_TESTIMONIALS,
              })}
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
                    {testimonial.star_rating && testimonial.star_style && (
                      <div className="mb-2">
                        <StarRating
                          rating={testimonial.star_rating}
                          style={testimonial.star_style}
                          size={16}
                        />
                      </div>
                    )}
                    <p className="text-sm text-slate-700">{testimonial.text}</p>
                    {testimonial.activity_id && (
                      <p className="text-xs text-slate-500">
                        {t('settings.testimonials.linkedTo')}:{' '}
                        {getActivityName(testimonial.activity_id)}
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
