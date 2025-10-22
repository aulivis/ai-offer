-- Ensure PostgREST reloads the schema so that the pdf_jobs table is available via the REST API.
notify pgrst, 'reload schema';
