-- Ensure authenticated users can manage their own brand assets while keeping files public.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets are public'
  ) THEN
    CREATE POLICY "Brand assets are public"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'brand-assets');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users manage their brand assets'
  ) THEN
    CREATE POLICY "Users manage their brand assets"
      ON storage.objects
      FOR ALL
      USING (bucket_id = 'brand-assets' AND auth.uid() = owner)
      WITH CHECK (bucket_id = 'brand-assets' AND auth.uid() = owner);
  END IF;
END
$$;
