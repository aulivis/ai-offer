-- Migration: Retention Policies for Telemetry and Logs
-- This migration creates functions and policies for cleaning up old telemetry data
-- to prevent database bloat and reduce costs

-- ============================================================================
-- 1. Create function to cleanup old template_render_events
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_template_render_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 90; -- Keep events for 90 days
BEGIN
  -- Delete events older than retention period
  DELETE FROM public.template_render_events
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % template_render_events older than % days', deleted_count, retention_days;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_template_render_events() IS 
  'Deletes template_render_events older than 90 days. Run periodically to prevent database bloat.';

-- ============================================================================
-- 2. Create function to cleanup old chatbot_analytics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_analytics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 90; -- Keep analytics for 90 days
BEGIN
  -- Delete analytics older than retention period
  DELETE FROM public.chatbot_analytics
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % chatbot_analytics older than % days', deleted_count, retention_days;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_chatbot_analytics() IS 
  'Deletes chatbot_analytics older than 90 days. Run periodically to prevent database bloat.';

-- ============================================================================
-- 3. Create function to cleanup old audit_logs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 365; -- Keep audit logs for 1 year (compliance)
BEGIN
  -- Delete audit logs older than retention period
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % audit_logs older than % days', deleted_count, retention_days;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_audit_logs() IS 
  'Deletes audit_logs older than 365 days. Run periodically for compliance and cost management.';

-- ============================================================================
-- 4. Create function to cleanup old sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 30; -- Keep sessions for 30 days
BEGIN
  -- Delete expired or revoked sessions older than retention period
  DELETE FROM public.sessions
  WHERE (expires_at < NOW() OR revoked_at IS NOT NULL)
    AND created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old sessions', deleted_count;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_sessions() IS 
  'Deletes expired or revoked sessions older than 30 days. Run periodically to prevent database bloat.';

-- ============================================================================
-- 5. Create function to cleanup old pdf_jobs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_pdf_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER := 90; -- Keep completed/failed jobs for 90 days
BEGIN
  -- Delete completed or failed jobs older than retention period
  DELETE FROM public.pdf_jobs
  WHERE status IN ('completed', 'failed')
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old pdf_jobs', deleted_count;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_pdf_jobs() IS 
  'Deletes completed or failed pdf_jobs older than 90 days. Run periodically to prevent database bloat.';

-- ============================================================================
-- 6. Create master cleanup function
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
  chatbot_analytics_count INTEGER;
  audit_logs_count INTEGER;
  sessions_count INTEGER;
  pdf_jobs_count INTEGER;
BEGIN
  -- Cleanup each table
  SELECT public.cleanup_old_template_render_events() INTO template_events_count;
  SELECT public.cleanup_old_chatbot_analytics() INTO chatbot_analytics_count;
  SELECT public.cleanup_old_audit_logs() INTO audit_logs_count;
  SELECT public.cleanup_old_sessions() INTO sessions_count;
  SELECT public.cleanup_old_pdf_jobs() INTO pdf_jobs_count;
  
  -- Return results
  RETURN QUERY SELECT 'template_render_events'::TEXT, template_events_count;
  RETURN QUERY SELECT 'chatbot_analytics'::TEXT, chatbot_analytics_count;
  RETURN QUERY SELECT 'audit_logs'::TEXT, audit_logs_count;
  RETURN QUERY SELECT 'sessions'::TEXT, sessions_count;
  RETURN QUERY SELECT 'pdf_jobs'::TEXT, pdf_jobs_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_data() IS 
  'Master cleanup function that runs all retention policies. Call this periodically (e.g., via cron) to clean up old data.';

-- ============================================================================
-- 7. Grant execute permissions
-- ============================================================================

-- Grant execute to service role (for cron jobs or scheduled tasks)
GRANT EXECUTE ON FUNCTION public.cleanup_old_template_render_events() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_chatbot_analytics() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_pdf_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;

-- ============================================================================
-- Usage Notes
-- ============================================================================

COMMENT ON SCHEMA public IS 'Public schema. Retention policies: Run cleanup_old_data() periodically (e.g., weekly) to clean up old telemetry and logs.';

-- To run cleanup manually:
-- SELECT * FROM public.cleanup_old_data();
--
-- To run cleanup for specific table:
-- SELECT public.cleanup_old_template_render_events();
-- SELECT public.cleanup_old_chatbot_analytics();
-- SELECT public.cleanup_old_audit_logs();
-- SELECT public.cleanup_old_sessions();
-- SELECT public.cleanup_old_pdf_jobs();
--
-- To schedule via pg_cron (if extension is enabled):
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT * FROM public.cleanup_old_data()');
-- (Runs every Sunday at 2 AM)










