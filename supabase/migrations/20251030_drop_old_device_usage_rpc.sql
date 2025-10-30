-- Drop the legacy 3-argument signature for check_and_increment_device_usage
DROP FUNCTION IF EXISTS public.check_and_increment_device_usage(text, integer, date);

-- Ensure PostgREST schema cache reflects the change
SELECT pgrest.schema_cache_reload();
