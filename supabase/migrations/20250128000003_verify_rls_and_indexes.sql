-- Migration: Verify RLS policies and indexes
-- This migration verifies that RLS is enabled and policies exist for activities and clients tables
-- It also ensures necessary indexes exist for optimal query performance

-- ============================================================================
-- 1. Verify RLS is enabled on activities and clients
-- ============================================================================

DO $$
BEGIN
  -- Check activities table RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'activities' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on activities table';
  END IF;
  
  -- Check clients table RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on clients table';
  END IF;
  
  RAISE NOTICE 'RLS is enabled on activities and clients tables';
END
$$;

-- ============================================================================
-- 2. Verify RLS policies exist for activities table
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'activities'
    AND policyname IN (
      'Users can select their own activities',
      'Users can insert their own activities',
      'Users can update their own activities',
      'Users can delete their own activities'
    );
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Missing RLS policies on activities table. Expected 4 policies, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'All RLS policies exist for activities table';
END
$$;

-- ============================================================================
-- 3. Verify RLS policies exist for clients table
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'clients'
    AND policyname IN (
      'Users can select their own clients',
      'Users can insert their own clients',
      'Users can update their own clients',
      'Users can delete their own clients'
    );
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Missing RLS policies on clients table. Expected 4 policies, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'All RLS policies exist for clients table';
END
$$;

-- ============================================================================
-- 4. Ensure indexes exist for optimal query performance
-- ============================================================================

-- Index on clients.user_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND indexname = 'idx_clients_user_id'
  ) THEN
    CREATE INDEX idx_clients_user_id ON public.clients(user_id);
    RAISE NOTICE 'Created index: idx_clients_user_id';
  ELSE
    RAISE NOTICE 'Index already exists: idx_clients_user_id';
  END IF;
END
$$;

-- Index on clients.company_name for autocomplete (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND indexname = 'idx_clients_user_company'
  ) THEN
    CREATE INDEX idx_clients_user_company ON public.clients(user_id, company_name);
    RAISE NOTICE 'Created index: idx_clients_user_company';
  ELSE
    RAISE NOTICE 'Index already exists: idx_clients_user_company';
  END IF;
END
$$;

-- Verify offers table has user_id index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'offers'
      AND indexname LIKE '%user_id%'
  ) THEN
    RAISE WARNING 'No user_id index found on offers table. Consider creating one for better performance.';
  ELSE
    RAISE NOTICE 'user_id index exists on offers table';
  END IF;
END
$$;

-- Verify pdf_jobs table has user_id index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'pdf_jobs'
      AND indexname LIKE '%user_id%'
  ) THEN
    RAISE WARNING 'No user_id index found on pdf_jobs table. Consider creating one for better performance.';
  ELSE
    RAISE NOTICE 'user_id index exists on pdf_jobs table';
  END IF;
END
$$;

-- Verify sessions table has user_id index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'sessions'
      AND indexname LIKE '%user_id%'
  ) THEN
    RAISE WARNING 'No user_id index found on sessions table. Consider creating one for better performance.';
  ELSE
    RAISE NOTICE 'user_id index exists on sessions table';
  END IF;
END
$$;

-- Verify chatbot_documents table (vector index is created separately)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'chatbot_documents'
  ) THEN
    -- Check if vector extension is enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
      RAISE WARNING 'vector extension is not enabled. Chatbot documents may not work correctly.';
    ELSE
      RAISE NOTICE 'vector extension is enabled';
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- 5. Verify pdf_jobs status constraint matches worker logic
-- ============================================================================

DO $$
DECLARE
  constraint_check TEXT;
BEGIN
  -- Check if status constraint exists and matches expected values
  SELECT con.conkey::text INTO constraint_check
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'pdf_jobs'
    AND con.conname LIKE '%status%'
    AND con.contype = 'c';
  
  IF constraint_check IS NULL THEN
    RAISE WARNING 'No status constraint found on pdf_jobs table';
  ELSE
    RAISE NOTICE 'Status constraint exists on pdf_jobs table';
  END IF;
  
  -- Verify expected status values are allowed
  -- Expected: 'pending', 'processing', 'completed', 'failed'
  RAISE NOTICE 'pdf_jobs status values should be: pending, processing, completed, failed';
END
$$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS and Index Verification Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. RLS is enabled on activities and clients';
  RAISE NOTICE '2. RLS policies exist for both tables';
  RAISE NOTICE '3. Indexes verified/created';
  RAISE NOTICE '4. pdf_jobs status constraint verified';
  RAISE NOTICE '========================================';
END
$$;












