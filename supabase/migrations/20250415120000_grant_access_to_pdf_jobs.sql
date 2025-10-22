-- Ensure the PDF job queue table is visible to PostgREST by granting the
-- required privileges to the roles used by the Supabase API. Without these
-- grants, PostgREST keeps the table out of its schema cache which results in
-- "table not found" errors when the API tries to access it.
grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select, insert, update on table public.pdf_jobs to authenticated;
grant all on table public.pdf_jobs to service_role;

-- Force PostgREST to reload its schema cache so the table becomes immediately
-- available once the migration runs.
notify pgrst, 'reload schema';
