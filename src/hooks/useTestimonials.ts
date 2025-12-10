'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { clientLogger } from '@/lib/clientLogger';

export type Testimonial = {
  id: string;
  user_id: string;
  activity_id?: string | null;
  text: string;
  created_at: string;
  updated_at: string;
};

export function useTestimonials() {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTestimonials = useCallback(async () => {
    if (!user) {
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
        clientLogger.error('Failed to load testimonials', error);
        setTestimonials([]);
      } else {
        setTestimonials((data as Testimonial[]) || []);
      }
    } catch (error) {
      clientLogger.error('Failed to load testimonials', error);
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
