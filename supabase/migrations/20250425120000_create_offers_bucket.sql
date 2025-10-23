-- Ensure the offers storage bucket exists for generated PDFs and grant
-- appropriate access so the Edge Function can upload files and clients can
-- download them via the public URL API.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('offers', 'offers', true)
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        name = EXCLUDED.name;
END
$$;

-- Allow the service role (used by the pdf-worker Edge Function) to manage
-- objects inside the offers bucket.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role manages offer PDFs'
  ) THEN
    CREATE POLICY "Service role manages offer PDFs"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'offers')
      WITH CHECK (bucket_id = 'offers');
  END IF;
END
$$;

-- Allow anonymous access for reading the generated PDFs via the public bucket.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Offer PDFs are publicly accessible'
  ) THEN
    CREATE POLICY "Offer PDFs are publicly accessible"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'offers');
  END IF;
END
$$;

-- Ensure authenticated users can also read the generated PDFs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Offer PDFs accessible to authenticated users'
  ) THEN
    CREATE POLICY "Offer PDFs accessible to authenticated users"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'offers');
  END IF;
END
$$;
