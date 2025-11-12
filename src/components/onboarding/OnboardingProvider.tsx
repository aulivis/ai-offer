'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export type OnboardingProfile = {
  role: 'freelancer' | 'agency' | 'enterprise' | null;
  industry: string | null;
  goals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
};

type OnboardingState = {
  completedSteps: Set<string>;
  dismissedElements: Set<string>;
  profile: OnboardingProfile | null;
  isLoading: boolean;
};

type OnboardingContextValue = {
  state: OnboardingState;
  completeStep: (stepId: string, metadata?: Record<string, unknown>) => Promise<void>;
  dismissElement: (elementId: string) => Promise<void>;
  shouldShowElement: (elementId: string) => boolean;
  hasCompletedStep: (stepId: string) => boolean;
  updateProfile: (profile: Partial<OnboardingProfile>) => Promise<void>;
  refresh: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const supabase = useSupabase();
  const { user } = useRequireAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [dismissedElements, setDismissedElements] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOnboardingData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Load completed steps
      const { data: progressData, error: progressError } = await supabase
        .from('onboarding_progress')
        .select('step_id')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Load dismissed elements
      const { data: dismissalsData, error: dismissalsError } = await supabase
        .from('onboarding_dismissals')
        .select('element_id')
        .eq('user_id', user.id);

      if (dismissalsError) throw dismissalsError;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw profileError;
      }

      setCompletedSteps(new Set(progressData?.map((p) => p.step_id) ?? []));
      setDismissedElements(new Set(dismissalsData?.map((d) => d.element_id) ?? []));
      setProfile(
        profileData
          ? {
              role: profileData.role as OnboardingProfile['role'],
              industry: profileData.industry,
              goals: profileData.goals ?? [],
              experienceLevel: profileData.experience_level as OnboardingProfile['experienceLevel'],
            }
          : null,
      );
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadOnboardingData();
  }, [loadOnboardingData]);

  const completeStep = useCallback(
    async (stepId: string, metadata?: Record<string, unknown>) => {
      if (!user) return;

      try {
        const { error } = await supabase.from('onboarding_progress').upsert(
          {
            user_id: user.id,
            step_id: stepId,
            metadata: metadata ?? {},
          },
          { onConflict: 'user_id,step_id' },
        );

        if (error) throw error;

        setCompletedSteps((prev) => new Set(prev).add(stepId));
      } catch (error) {
        console.error('Failed to complete onboarding step:', error);
      }
    },
    [user, supabase],
  );

  const dismissElement = useCallback(
    async (elementId: string) => {
      if (!user) return;

      try {
        const { error } = await supabase.from('onboarding_dismissals').upsert(
          {
            user_id: user.id,
            element_id: elementId,
          },
          { onConflict: 'user_id,element_id' },
        );

        if (error) throw error;

        setDismissedElements((prev) => new Set(prev).add(elementId));
      } catch (error) {
        console.error('Failed to dismiss onboarding element:', error);
      }
    },
    [user, supabase],
  );

  const shouldShowElement = useCallback(
    (elementId: string) => {
      return !dismissedElements.has(elementId);
    },
    [dismissedElements],
  );

  const hasCompletedStep = useCallback(
    (stepId: string) => {
      return completedSteps.has(stepId);
    },
    [completedSteps],
  );

  const updateProfile = useCallback(
    async (updates: Partial<OnboardingProfile>) => {
      if (!user) return;

      try {
        const { error } = await supabase.from('onboarding_profiles').upsert(
          {
            user_id: user.id,
            role: updates.role ?? null,
            industry: updates.industry ?? null,
            goals: updates.goals ?? [],
            experience_level: updates.experienceLevel ?? null,
          },
          { onConflict: 'user_id' },
        );

        if (error) throw error;

        setProfile((prev) => ({
          role: prev?.role ?? null,
          industry: prev?.industry ?? null,
          goals: prev?.goals ?? [],
          experienceLevel: prev?.experienceLevel ?? null,
          ...updates,
        }));
      } catch (error) {
        console.error('Failed to update onboarding profile:', error);
      }
    },
    [user, supabase],
  );

  const refresh = useCallback(async () => {
    await loadOnboardingData();
  }, [loadOnboardingData]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state: {
        completedSteps,
        dismissedElements,
        profile,
        isLoading,
      },
      completeStep,
      dismissElement,
      shouldShowElement,
      hasCompletedStep,
      updateProfile,
      refresh,
    }),
    [
      completedSteps,
      dismissedElements,
      profile,
      isLoading,
      completeStep,
      dismissElement,
      shouldShowElement,
      hasCompletedStep,
      updateProfile,
      refresh,
    ],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
