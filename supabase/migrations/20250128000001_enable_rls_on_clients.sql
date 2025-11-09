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

