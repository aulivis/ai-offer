-- Ensure the PostgREST schema cache includes the pdf_jobs table.  Without this
-- notification, the REST API may continue to report that the table is missing
-- even after the migration that creates it has been applied.
notify pgrst, 'reload schema';
