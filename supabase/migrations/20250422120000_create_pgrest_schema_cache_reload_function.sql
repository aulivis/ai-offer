-- Ensure the PostgREST helper schema exists so we can define RPC helpers
-- that are compatible with Supabase's PostgREST deployment.  Recent
-- versions expose a `pgrest.schema_cache_reload` helper that mirrors the
-- functionality of sending a `reload schema` notification.  Some
-- environments created before the helper was introduced are missing both
-- the schema and the RPC, which causes HTTP fallback requests to fail with
-- 404 errors when the PDF queue attempts to refresh the schema cache.

create schema if not exists pgrest;

create or replace function pgrest.schema_cache_reload()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_notify('pgrst', 'reload schema');
end;
$$;

revoke all on function pgrest.schema_cache_reload() from public;
grant usage on schema pgrest to service_role;
grant execute on function pgrest.schema_cache_reload() to service_role;
