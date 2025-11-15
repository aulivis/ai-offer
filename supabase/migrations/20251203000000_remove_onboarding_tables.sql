-- Migration: Remove onboarding tables and related database objects
-- This migration removes all onboarding-related database objects that were created
-- for the onboarding feature which has been removed from the codebase.
--
-- Removed objects:
-- - onboarding_progress table
-- - onboarding_dismissals table
-- - onboarding_profiles table
-- - Related indexes, triggers, functions, and RLS policies
--
-- This migration is idempotent and safe to run multiple times.

-- ============================================================================
-- 1. Drop triggers first (before dropping functions they depend on)
-- ============================================================================

-- Drop trigger on onboarding_profiles table
DROP TRIGGER IF EXISTS set_onboarding_profiles_updated_at ON public.onboarding_profiles;

-- ============================================================================
-- 2. Drop RLS policies (before dropping tables)
-- ============================================================================

-- Drop RLS policies on onboarding_progress
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_progress'
      AND policyname = 'Users can manage own onboarding progress'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own onboarding progress" ON public.onboarding_progress;
    RAISE NOTICE 'Dropped RLS policy: Users can manage own onboarding progress';
  END IF;
END
$$;

-- Drop RLS policies on onboarding_dismissals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_dismissals'
      AND policyname = 'Users can manage own dismissals'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own dismissals" ON public.onboarding_dismissals;
    RAISE NOTICE 'Dropped RLS policy: Users can manage own dismissals';
  END IF;
END
$$;

-- Drop RLS policies on onboarding_profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'onboarding_profiles'
      AND policyname = 'Users can manage own profile'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.onboarding_profiles;
    RAISE NOTICE 'Dropped RLS policy: Users can manage own profile';
  END IF;
END
$$;

-- ============================================================================
-- 3. Drop tables (CASCADE will automatically drop indexes and any remaining dependencies)
-- ============================================================================

-- Drop onboarding_progress table
DROP TABLE IF EXISTS public.onboarding_progress CASCADE;

-- Drop onboarding_dismissals table
DROP TABLE IF EXISTS public.onboarding_dismissals CASCADE;

-- Drop onboarding_profiles table
DROP TABLE IF EXISTS public.onboarding_profiles CASCADE;

-- ============================================================================
-- 4. Drop trigger function (now safe since trigger and table are dropped)
-- ============================================================================

-- Drop trigger function for onboarding_profiles
DROP FUNCTION IF EXISTS public.handle_onboarding_profiles_updated_at() CASCADE;

-- ============================================================================
-- 5. Verification and cleanup
-- ============================================================================

-- Verify all onboarding tables are dropped
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('onboarding_progress', 'onboarding_dismissals', 'onboarding_profiles');
  
  IF table_count > 0 THEN
    RAISE WARNING 'Some onboarding tables still exist: %', table_count;
  ELSE
    RAISE NOTICE 'All onboarding tables successfully removed';
  END IF;
END
$$;

-- Verify all onboarding functions are dropped
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'handle_onboarding_profiles_updated_at';
  
  IF func_count > 0 THEN
    RAISE WARNING 'Onboarding function still exists: handle_onboarding_profiles_updated_at';
  ELSE
    RAISE NOTICE 'All onboarding functions successfully removed';
  END IF;
END
$$;

COMMENT ON SCHEMA public IS 
  'Public schema. Onboarding tables (onboarding_progress, onboarding_dismissals, onboarding_profiles) have been removed.';






