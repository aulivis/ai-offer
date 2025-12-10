'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/hooks/useToast';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createClientLogger } from '@/lib/clientLogger';
import { t } from '@/copy';
import type { ActivityRow } from '@/components/settings/types';

type SupabaseErrorLike = {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function createSupabaseError(error: SupabaseErrorLike | null | undefined): Error {
  if (error) {
    const parts = [error.message, error.details, error.hint]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter((part) => part.length > 0);
    if (parts.length > 0) {
      return new Error(parts.join(' '));
    }
  }
  return new Error(t('errors.settings.saveUnknown'));
}

export type NewActivity = {
  name: string;
  unit: string;
  price: number;
  vat: number;
};

export function useActivities() {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useActivities' }),
    [user?.id],
  );

  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [newActivity, setNewActivity] = useState<NewActivity>({
    name: '',
    unit: 'db',
    price: 0,
    vat: 27,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id,name,unit,default_unit_price,default_vat,reference_images')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        logger.error('Failed to load activities', error);
        return;
      }

      setActivities((data as ActivityRow[]) || []);
    } catch (error) {
      logger.error('Failed to load activities', error);
    }
  }, [user, supabase, logger]);

  const addActivity = useCallback(async () => {
    if (!newActivity.name.trim()) {
      showToast({
        title: t('errors.settings.activityNameRequired'),
        description: t('errors.settings.activityNameRequired'),
        variant: 'error',
      });
      return;
    }

    const activityToAdd = {
      name: newActivity.name.trim(),
      unit: newActivity.unit || 'db',
      default_unit_price: Number(newActivity.price) || 0,
      default_vat: Number(newActivity.vat) || 27,
    };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticActivity: ActivityRow = {
      id: tempId,
      ...activityToAdd,
      reference_images: null,
    };
    setActivities((prev) =>
      [...prev, optimisticActivity].sort((a, b) => a.name.localeCompare(b.name)),
    );
    const previousActivities = activities;
    setNewActivity({ name: '', unit: 'db', price: 0, vat: 27 });

    try {
      setSaving(true);
      if (!user) {
        setActivities(previousActivities);
        return;
      }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          ...activityToAdd,
        })
        .select();

      if (error) {
        throw createSupabaseError(error);
      }

      // Replace optimistic update with real data
      setActivities((prev) =>
        prev
          .filter((a) => a.id !== tempId)
          .concat((data as ActivityRow[]) || [])
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      showToast({
        title: t('toasts.settings.saveSuccess'),
        description: '',
        variant: 'success',
      });
    } catch (error) {
      // Revert optimistic update on error
      setActivities(previousActivities);
      setNewActivity(activityToAdd);
      logger.error('Failed to add activity', error, { activityName: activityToAdd.name });
      showToast({
        title: t('errors.settings.saveFailed', { message: activityToAdd.name }),
        description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [newActivity, user, supabase, showToast, logger, activities]);

  const deleteActivity = useCallback(
    async (id: string) => {
      // Optimistic update
      setActivities((prev) => prev.filter((a) => a.id !== id));
      const previousActivities = activities;

      try {
        setDeletingId(id);
        const { error } = await supabase.from('activities').delete().eq('id', id);

        if (error) {
          throw createSupabaseError(error);
        }

        showToast({
          title: t('toasts.settings.deleteSuccess'),
          description: '',
          variant: 'success',
        });
      } catch (error) {
        // Revert optimistic update on error
        setActivities(previousActivities);
        logger.error('Failed to delete activity', error, { activityId: id });
        showToast({
          title: t('errors.settings.deleteFailed'),
          description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
          variant: 'error',
        });
      } finally {
        setDeletingId(null);
      }
    },
    [supabase, showToast, logger, activities],
  );

  const updateActivityImages = useCallback(
    async (activityId: string, imagePaths: string[]) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('activities')
          .update({ reference_images: imagePaths })
          .eq('id', activityId)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, reference_images: imagePaths } : a)),
        );
      } catch (error) {
        logger.error('Failed to save reference images', error, { activityId });
        throw error;
      }
    },
    [user, supabase, logger],
  );

  return {
    activities,
    newActivity,
    setNewActivity,
    saving,
    deletingId,
    addActivity,
    deleteActivity,
    updateActivityImages,
    loadActivities,
  };
}
