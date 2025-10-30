-- Remove legacy device usage RPC signatures that predate the user_id-aware
-- implementation.  Only the four-argument form
-- (uuid, text, integer, date) should remain.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT p.oid::regprocedure AS signature
      FROM pg_proc AS p
      JOIN pg_namespace AS n
        ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'check_and_increment_device_usage'
       AND pg_get_function_identity_arguments(p.oid) <> 'uuid, text, integer, date'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s;', rec.signature);
  END LOOP;
END
$$;

-- Ensure no legacy three-argument usage RPCs remain.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT p.oid::regprocedure AS signature
      FROM pg_proc AS p
      JOIN pg_namespace AS n
        ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'check_and_increment_usage'
       AND pg_get_function_identity_arguments(p.oid) <> 'uuid, integer, date'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s;', rec.signature);
  END LOOP;
END
$$;

-- Drop obsolete storage policies that exposed brand assets across tenants.
DROP POLICY IF EXISTS "Brand assets are public" ON storage.objects;
DROP POLICY IF EXISTS "Users manage their brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can insert own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can delete own files" ON storage.objects;

-- Refresh PostgREST so the removals are reflected immediately.
SELECT pgrest.schema_cache_reload();
