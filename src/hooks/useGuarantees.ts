'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/components/ToastProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createClientLogger } from '@/lib/clientLogger';
import { t } from '@/copy';
import type { GuaranteeRow } from '@/components/settings/types';

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

function mapGuaranteeRow(row: {
  id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
  activity_guarantees?: Array<{ activity_id: string | null }>;
}): GuaranteeRow {
  return {
    id: row.id,
    text: row.text,
    activity_ids:
      row.activity_guarantees
        ?.map((link) => link.activity_id)
        .filter((value): value is string => typeof value === 'string') ?? [],
    ...(row.created_at ? { created_at: row.created_at } : {}),
    ...(row.updated_at ? { updated_at: row.updated_at } : {}),
  };
}

export function useGuarantees() {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const { showToast } = useToast();
  const logger = useMemo(
    () => createClientLogger({ ...(user?.id && { userId: user.id }), component: 'useGuarantees' }),
    [user?.id],
  );

  const [guarantees, setGuarantees] = useState<GuaranteeRow[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadGuarantees = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('guarantees')
        .select('id, text, created_at, updated_at, activity_guarantees(activity_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to load guarantees', error);
        return;
      }

      setGuarantees(
        (data || []).map((row) => mapGuaranteeRow(row as Parameters<typeof mapGuaranteeRow>[0])),
      );
    } catch (error) {
      logger.error('Failed to load guarantees', error);
    }
  }, [user, supabase, logger]);

  const addGuarantee = useCallback(
    async (text: string) => {
      if (!user) return;
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticGuarantee: GuaranteeRow = {
        id: tempId,
        text: trimmed,
        activity_ids: [],
      };
      setGuarantees((prev) => [...prev, optimisticGuarantee]);
      const previousGuarantees = guarantees;

      try {
        setAddLoading(true);
        const { data, error } = await supabase
          .from('guarantees')
          .insert({ user_id: user.id, text: trimmed })
          .select('id, text, created_at, updated_at, activity_guarantees(activity_id)')
          .single();

        if (error) {
          throw createSupabaseError(error);
        }

        // Replace optimistic update with real data
        const newGuarantee = mapGuaranteeRow(data as Parameters<typeof mapGuaranteeRow>[0]);
        setGuarantees((prev) => prev.filter((g) => g.id !== tempId).concat(newGuarantee));

        showToast({
          title: t('settings.guarantees.saveSuccess'),
          description: '',
          variant: 'success',
        });
      } catch (error) {
        // Revert optimistic update on error
        setGuarantees(previousGuarantees);
        logger.error('Failed to add guarantee', error, { guaranteeText: trimmed });
        showToast({
          title: t('errors.settings.saveFailed', { message: trimmed }),
          description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
          variant: 'error',
        });
      } finally {
        setAddLoading(false);
      }
    },
    [user, supabase, showToast, logger, guarantees],
  );

  const updateGuarantee = useCallback(
    async (id: string, text: string) => {
      if (!user) return;
      const trimmed = text.trim();
      if (!trimmed) {
        showToast({
          title: t('errors.settings.validationRequired'),
          description: t('settings.guarantees.validationMessage'),
          variant: 'error',
        });
        return;
      }

      try {
        setBusyId(id);
        const { error } = await supabase
          .from('guarantees')
          .update({ text: trimmed })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          throw createSupabaseError(error);
        }

        setGuarantees((prev) =>
          prev.map((guarantee) =>
            guarantee.id === id ? { ...guarantee, text: trimmed } : guarantee,
          ),
        );

        showToast({
          title: t('settings.guarantees.saveSuccess'),
          description: '',
          variant: 'success',
        });
      } catch (error) {
        logger.error('Failed to update guarantee', error, { guaranteeId: id, guaranteeText: text });
        showToast({
          title: t('errors.settings.saveFailed', { message: text }),
          description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
          variant: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [user, supabase, showToast, logger],
  );

  const deleteGuarantee = useCallback(
    async (id: string) => {
      if (!user) return;

      // Optimistic update
      setGuarantees((prev) => prev.filter((guarantee) => guarantee.id !== id));
      const previousGuarantees = guarantees;

      try {
        setBusyId(id);
        const { error } = await supabase
          .from('guarantees')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          throw createSupabaseError(error);
        }

        showToast({
          title: t('settings.guarantees.deleteSuccess'),
          description: '',
          variant: 'success',
        });
      } catch (error) {
        // Revert optimistic update on error
        setGuarantees(previousGuarantees);
        logger.error('Failed to delete guarantee', error, { guaranteeId: id });
        showToast({
          title: t('errors.settings.saveFailed', { message: id }),
          description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
          variant: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [user, supabase, showToast, logger, guarantees],
  );

  const toggleAttachment = useCallback(
    async (guaranteeId: string, activityId: string, shouldAttach: boolean) => {
      if (!user) return;

      try {
        setBusyId(guaranteeId);
        if (shouldAttach) {
          const { error } = await supabase
            .from('activity_guarantees')
            .insert({ guarantee_id: guaranteeId, activity_id: activityId, user_id: user.id });

          if (error) {
            throw createSupabaseError(error);
          }
        } else {
          const { error } = await supabase
            .from('activity_guarantees')
            .delete()
            .eq('guarantee_id', guaranteeId)
            .eq('activity_id', activityId)
            .eq('user_id', user.id);

          if (error) {
            throw createSupabaseError(error);
          }
        }

        setGuarantees((prev) =>
          prev.map((guarantee) =>
            guarantee.id === guaranteeId
              ? {
                  ...guarantee,
                  activity_ids: shouldAttach
                    ? Array.from(new Set([...guarantee.activity_ids, activityId]))
                    : guarantee.activity_ids.filter((value) => value !== activityId),
                }
              : guarantee,
          ),
        );
      } catch (error) {
        logger.error('Failed to toggle guarantee attachment', error, {
          guaranteeId,
          activityId,
          shouldAttach,
        });
        showToast({
          title: t('errors.settings.saveFailed', { message: guaranteeId }),
          description: error instanceof Error ? error.message : t('errors.settings.saveUnknown'),
          variant: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [user, supabase, showToast, logger],
  );

  return {
    guarantees,
    addLoading,
    busyId,
    addGuarantee,
    updateGuarantee,
    deleteGuarantee,
    toggleAttachment,
    loadGuarantees,
  };
}
