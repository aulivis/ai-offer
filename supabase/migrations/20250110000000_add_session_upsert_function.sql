-- Add UPSERT function for sessions table to handle deduplication
-- This ensures that if the same refresh token hash already exists,
-- we update the existing record instead of failing with a unique constraint error.
-- This is critical for migration scenarios where both /api/auth/callback and /api/auth/confirm
-- might try to persist the same session.

CREATE OR REPLACE FUNCTION public.upsert_session(
  p_user_id uuid,
  p_rt_hash text,
  p_issued_at timestamp with time zone,
  p_expires_at timestamp with time zone,
  p_ip text,
  p_ua text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO public.sessions (
    user_id,
    rt_hash,
    issued_at,
    expires_at,
    ip,
    ua,
    revoked_at
  )
  VALUES (
    p_user_id,
    p_rt_hash,
    p_issued_at,
    p_expires_at,
    p_ip,
    p_ua,
    NULL  -- Ensure revoked_at is NULL for new/updated sessions
  )
  ON CONFLICT (rt_hash) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    issued_at = EXCLUDED.issued_at,
    expires_at = EXCLUDED.expires_at,
    ip = EXCLUDED.ip,
    ua = EXCLUDED.ua,
    revoked_at = NULL  -- Clear revocation if session is being re-established
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION public.upsert_session TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.upsert_session IS 
  'UPSERT function for sessions table. Inserts a new session or updates an existing one based on rt_hash unique constraint. Used for session deduplication during auth flows.';


