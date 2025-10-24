-- Ensure authenticated users can only interact with brand assets they own.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets owners can read'
  ) THEN
    CREATE POLICY "Brand assets owners can read"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'brand-assets'
        AND auth.uid() IS NOT NULL
        AND auth.uid() = owner
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets owners can insert'
  ) THEN
    CREATE POLICY "Brand assets owners can insert"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'brand-assets'
        AND auth.uid() IS NOT NULL
        AND auth.uid() = owner
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets owners can update'
  ) THEN
    CREATE POLICY "Brand assets owners can update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'brand-assets'
        AND auth.uid() IS NOT NULL
        AND auth.uid() = owner
      )
      WITH CHECK (
        bucket_id = 'brand-assets'
        AND auth.uid() IS NOT NULL
        AND auth.uid() = owner
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets owners can delete'
  ) THEN
    CREATE POLICY "Brand assets owners can delete"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'brand-assets'
        AND auth.uid() IS NOT NULL
        AND auth.uid() = owner
      );
  END IF;
END
$$;
