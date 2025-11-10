-- Migration: Enable RLS on activities table
-- This migration enables Row Level Security on the activities table to ensure
-- users can only access their own activities at the database level.
-- 
-- Security: Previously, activities table had RLS disabled, relying only on
-- application-level filtering. This migration adds database-level security.

-- Enable RLS on activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Users can select their own activities'
  ) THEN
    CREATE POLICY "Users can select their own activities"
      ON public.activities
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can insert their own activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Users can insert their own activities'
  ) THEN
    CREATE POLICY "Users can insert their own activities"
      ON public.activities
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can update their own activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Users can update their own activities'
  ) THEN
    CREATE POLICY "Users can update their own activities"
      ON public.activities
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can delete their own activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activities'
      AND policyname = 'Users can delete their own activities'
  ) THEN
    CREATE POLICY "Users can delete their own activities"
      ON public.activities
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ensure service role has full access (needed for background jobs)
GRANT ALL ON TABLE public.activities TO service_role;

-- Add comment
COMMENT ON TABLE public.activities IS 'User activities with RLS enabled. Users can only access their own activities.';



