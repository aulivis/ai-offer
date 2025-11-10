-- Migration: Remove chatbot tables and functions
-- This migration removes all chatbot-related database objects:
-- - chatbot_documents table
-- - chatbot_feedback table
-- - chatbot_analytics table
-- - Related functions and triggers

-- ============================================================================
-- 1. Drop triggers first (before dropping functions they depend on)
-- ============================================================================

-- Drop trigger on chatbot_documents table
DROP TRIGGER IF EXISTS set_updated_at ON public.chatbot_documents;

-- ============================================================================
-- 2. Drop chatbot tables (this will also drop any remaining dependencies)
-- ============================================================================

-- Drop chatbot_documents table (includes vector index and trigger)
DROP TABLE IF EXISTS public.chatbot_documents CASCADE;

-- Drop chatbot_feedback table
DROP TABLE IF EXISTS public.chatbot_feedback CASCADE;

-- Drop chatbot_analytics table
DROP TABLE IF EXISTS public.chatbot_analytics CASCADE;

-- ============================================================================
-- 3. Drop chatbot-related functions (now safe since tables/triggers are gone)
-- ============================================================================

-- Drop vector similarity search function
DROP FUNCTION IF EXISTS public.match_chatbot_documents(vector, float, int);

-- Drop vector index rebuild function
DROP FUNCTION IF EXISTS public.rebuild_chatbot_documents_vector_index();

-- Drop cleanup function for chatbot_analytics
DROP FUNCTION IF EXISTS public.cleanup_old_chatbot_analytics();

-- Drop trigger function for chatbot_documents (now safe since trigger is dropped)
DROP FUNCTION IF EXISTS public.handle_chatbot_documents_updated_at();

-- ============================================================================
-- 4. Update cleanup_old_data() function to remove chatbot_analytics reference
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS TABLE (
  table_name TEXT,
  deleted_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_events_count INTEGER;
  audit_logs_count INTEGER;
  sessions_count INTEGER;
  pdf_jobs_count INTEGER;
BEGIN
  -- Cleanup each table (removed chatbot_analytics)
  SELECT public.cleanup_old_template_render_events() INTO template_events_count;
  SELECT public.cleanup_old_audit_logs() INTO audit_logs_count;
  SELECT public.cleanup_old_sessions() INTO sessions_count;
  SELECT public.cleanup_old_pdf_jobs() INTO pdf_jobs_count;
  
  -- Return results (removed chatbot_analytics)
  RETURN QUERY SELECT 'template_render_events'::TEXT, template_events_count;
  RETURN QUERY SELECT 'audit_logs'::TEXT, audit_logs_count;
  RETURN QUERY SELECT 'sessions'::TEXT, sessions_count;
  RETURN QUERY SELECT 'pdf_jobs'::TEXT, pdf_jobs_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_data() IS 
  'Master cleanup function that runs all retention policies. Call this periodically (e.g., via cron) to clean up old data.';

-- ============================================================================
-- 5. Note: pgvector extension is NOT dropped
-- ============================================================================
-- The pgvector extension may be used by other features in the future.
-- If you want to remove it, run: DROP EXTENSION IF EXISTS vector;
-- But be careful - this will fail if any other tables use vector columns.

