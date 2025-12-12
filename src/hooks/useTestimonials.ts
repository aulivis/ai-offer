'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { clientLogger } from '@/lib/clientLogger';
import { ensureSession } from '@/lib/supabaseClient';

export type Testimonial = {
  id: string;
  user_id: string;
  activity_id?: string | null;
  text: string;
  star_rating?: number | null;
  star_style?: 'filled' | 'outlined' | 'solid' | null;
  created_at: string;
  updated_at: string;
};

export function useTestimonials() {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTestimonials = useCallback(async () => {
    // If auth is still loading or user is not available, clear testimonials gracefully
    if (!user) {
      setTestimonials([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Ensure the Supabase session is initialized before querying to avoid auth errors
    try {
      await ensureSession(user.id);
    } catch (error) {
      clientLogger.error('Failed to ensure Supabase session before loading testimonials', error, {
        userId: user.id,
      });
      // Don't throw - gracefully handle the error by setting empty testimonials
      setTestimonials([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        clientLogger.error('Failed to load testimonials', error, {
          userId: user.id,
          errorCode: error.code,
          errorMessage: error.message,
        });
        // Don't throw - gracefully handle the error by setting empty testimonials
        setTestimonials([]);
      } else {
        setTestimonials((data as Testimonial[]) || []);
      }
    } catch (error) {
      clientLogger.error('Failed to load testimonials - unexpected error', error, {
        userId: user.id,
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - gracefully handle the error by setting empty testimonials
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  return {
    testimonials,
    loading,
    reloadTestimonials: loadTestimonials,
  };
}
