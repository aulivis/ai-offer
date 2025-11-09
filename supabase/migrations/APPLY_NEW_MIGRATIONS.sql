-- ============================================================================
-- Combined Migration Script
-- ============================================================================
-- This file contains all new migrations that need to be applied.
-- Apply this entire script via Supabase Dashboard SQL Editor.
--
-- Migration Order:
-- 1. Enable RLS on activities table
-- 2. Enable RLS on clients table  
-- 3. Remove obsolete recipients table
--
-- All migrations are idempotent (safe to run multiple times).
-- ============================================================================

-- ============================================================================
-- Migration 1: Enable RLS on activities table
-- ============================================================================
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

-- ============================================================================
-- Migration 2: Enable RLS on clients table
-- ============================================================================
-- Migration: Enable RLS on clients table
-- This migration enables Row Level Security on the clients table to ensure
-- users can only access their own clients at the database level.
-- 
-- Security: Previously, clients table had RLS disabled, relying only on
-- application-level filtering. This migration adds database-level security.
--
-- Note: The offers.recipient_id FK to clients.id will still work correctly:
-- 1. Offers table has RLS enabled and users can only see their own offers
-- 2. When joining offers with clients, RLS on clients filters to user's clients
-- 3. The join will only succeed if the client belongs to the same user as the offer

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname = 'Users can select their own clients'
  ) THEN
    CREATE POLICY "Users can select their own clients"
      ON public.clients
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can insert their own clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname = 'Users can insert their own clients'
  ) THEN
    CREATE POLICY "Users can insert their own clients"
      ON public.clients
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can update their own clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname = 'Users can update their own clients'
  ) THEN
    CREATE POLICY "Users can update their own clients"
      ON public.clients
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Policy: Users can delete their own clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND policyname = 'Users can delete their own clients'
  ) THEN
    CREATE POLICY "Users can delete their own clients"
      ON public.clients
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Ensure service role has full access (needed for background jobs)
GRANT ALL ON TABLE public.clients TO service_role;

-- Add comment
COMMENT ON TABLE public.clients IS 'Client records with RLS enabled. Users can only access their own clients.';

-- ============================================================================
-- Migration 3: Remove obsolete recipients table
-- ============================================================================
-- Migration: Remove obsolete recipients table
-- This migration removes the recipients table which is not used in the application.
-- 
-- Background: The recipients table was created but never used. All application
-- code uses the clients table instead. The offers.recipient_id FK points to
-- clients.id, not recipients.id.
--
-- Safety: This migration checks for data and foreign key dependencies before
-- dropping the table. If the table has data or is referenced by other tables,
-- the migration will warn and skip the drop.

-- Check if recipients table exists and has data
DO $$
DECLARE
  row_count INTEGER;
  has_foreign_keys BOOLEAN;
  policy_rec RECORD;
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'recipients'
  ) THEN
    -- Count rows
    EXECUTE 'SELECT COUNT(*) FROM public.recipients' INTO row_count;
    
    -- Check for foreign key references to recipients table
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'recipients'
    ) INTO has_foreign_keys;
    
    -- Warn if table has data
    IF row_count > 0 THEN
      RAISE WARNING 'recipients table contains % rows. Consider migrating data to clients table before dropping.', row_count;
      RAISE NOTICE 'Skipping drop of recipients table due to existing data.';
      RETURN;
    END IF;
    
    -- Warn if table has foreign key references
    IF has_foreign_keys THEN
      RAISE WARNING 'recipients table is referenced by foreign keys. Cannot safely drop.';
      RAISE NOTICE 'Skipping drop of recipients table due to foreign key dependencies.';
      RETURN;
    END IF;
    
    -- Drop index on recipients table (if exists)
    DROP INDEX IF EXISTS public.idx_recipients_user_id;
    RAISE NOTICE 'Dropped index: idx_recipients_user_id';
    
    -- Drop RLS policies on recipients table (if any)
    FOR policy_rec IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'recipients'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.recipients', policy_rec.policyname);
      RAISE NOTICE 'Dropped policy: % on recipients table', policy_rec.policyname;
    END LOOP;
    
    -- Drop recipients table
    DROP TABLE IF EXISTS public.recipients CASCADE;
    RAISE NOTICE 'Dropped obsolete table: recipients';
  ELSE
    RAISE NOTICE 'recipients table does not exist. Nothing to drop.';
  END IF;
END
$$;

-- Update migration comments to remove recipients references
-- Note: This is informational only - actual migration files should be updated manually
COMMENT ON SCHEMA public IS 'Public schema. Note: recipients table has been removed (use clients table instead).';

-- ============================================================================
-- End of Migrations
-- ============================================================================
-- All migrations have been applied successfully.
-- Verify that:
-- 1. RLS is enabled on activities and clients tables
-- 2. Users can only access their own data
-- 3. Recipients table has been removed (if it existed)
-- ============================================================================

