-- Provide a public schema wrapper for the PostgREST helper so clients that
-- cannot set the `Accept-Profile: pgrest` header (such as supabase-js) can
-- still trigger a schema cache refresh.  The wrapper simply delegates to the
-- canonical helper in the `pgrest` schema.
create or replace function public.pgrest_schema_cache_reload()
returns void
language sql
security definer
set search_path = public
as $$
  select pgrest.schema_cache_reload();
$$;

revoke all on function public.pgrest_schema_cache_reload() from public;
grant execute on function public.pgrest_schema_cache_reload() to service_role;
