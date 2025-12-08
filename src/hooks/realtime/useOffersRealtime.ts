/**
 * Realtime subscription hooks for offers
 *
 * Provides real-time updates for offers list and individual offer changes
 * using Supabase Realtime subscriptions.
 */

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useSupabase } from '@/components/SupabaseProvider';
import type { Offer } from '@/app/dashboard/types';

interface UseOffersRealtimeOptions {
  userId?: string;
  teamIds?: string[];
  enabled?: boolean;
  onOfferInserted?: (offer: Offer) => void;
  onOfferUpdated?: (offer: Offer) => void;
  onOfferDeleted?: (offerId: string) => void;
}

/**
 * Hook to subscribe to real-time offer updates
 *
 * @example
 * ```tsx
 * useOffersRealtime({
 *   userId: user.id,
 *   teamIds: ['team-1'],
 *   onOfferUpdated: (offer) => {
 *     // Update local state or invalidate React Query cache
 *     queryClient.setQueryData(['offers'], (old) => {
 *       // Update offer in cache
 *     });
 *   },
 * });
 * ```
 */
export function useOffersRealtime({
  userId,
  teamIds = [],
  enabled = true,
  onOfferInserted,
  onOfferUpdated,
  onOfferDeleted,
}: UseOffersRealtimeOptions) {
  const supabase = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    // Build filter for offers this user can see
    // User can see: offers where user_id = userId OR team_id IN teamIds
    const filter =
      teamIds.length > 0
        ? `user_id=eq.${userId},or(team_id=in.(${teamIds.join(',')}))`
        : `user_id=eq.${userId}`;

    const channel = supabase
      .channel(`offers:${userId}:${teamIds.join(',')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter,
        },
        (payload) => {
          const newOffer = payload.new as Offer;
          onOfferInserted?.(newOffer);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter,
        },
        (payload) => {
          const updatedOffer = payload.new as Offer;
          onOfferUpdated?.(updatedOffer);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'offers',
          filter,
        },
        (payload) => {
          const deletedId = payload.old?.id as string;
          if (deletedId) {
            onOfferDeleted?.(deletedId);
          }
        },
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, userId, teamIds, enabled, onOfferInserted, onOfferUpdated, onOfferDeleted]);

  return { isSubscribed };
}

/**
 * Hook to subscribe to real-time updates for a specific offer
 * Useful for offer detail pages or modals
 */
export function useOfferRealtime(
  offerId: string | null,
  enabled = true,
  onUpdate?: (offer: Offer) => void,
) {
  const supabase = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled || !offerId) {
      return;
    }

    const channel = supabase
      .channel(`offer:${offerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `id=eq.${offerId}`,
        },
        (payload) => {
          const updatedOffer = payload.new as Offer;
          onUpdate?.(updatedOffer);
        },
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, offerId, enabled, onUpdate]);

  return { isSubscribed };
}

/**
 * Hook to subscribe to real-time PDF job status updates
 * Updates offer's pdf_url when PDF generation completes
 */
export function usePdfJobRealtime(
  offerId: string | null,
  enabled = true,
  onPdfReady?: (pdfUrl: string) => void,
) {
  const supabase = useSupabase();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled || !offerId) {
      return;
    }

    const channel = supabase
      .channel(`pdf-jobs:offer:${offerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pdf_jobs',
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          const job = payload.new as { status: string; pdf_url: string | null };
          if (job.status === 'completed' && job.pdf_url && onPdfReady) {
            onPdfReady(job.pdf_url);
          }
        },
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [supabase, offerId, enabled, onPdfReady]);

  return { isSubscribed };
}


