-- Helper function to refresh the PostgREST schema cache when the
-- `pdf_jobs` table is reported missing.  In some environments the schema
-- cache can become stale even after running migrations that create the
-- table, leading to `Could not find the table 'public.pdf_jobs' in the
-- schema cache` errors from the REST API.  Exposing this helper allows the
-- service role to explicitly trigger a refresh.
create or replace function public.refresh_pdf_jobs_schema_cache()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_notify('pgrst', 'reload schema');
end;
$$;

revoke all on function public.refresh_pdf_jobs_schema_cache() from public;
grant execute on function public.refresh_pdf_jobs_schema_cache() to service_role;
