-- Ensure the brand-assets bucket exists and enforce per-user access using object ownership.
-- NOTE: This migration creates legacy policy names that are later replaced by 
-- 20250601120000_restrict_brand_assets_access.sql with "owners" naming.
-- The legacy policies are cleaned up in 20250627120000_cleanup_legacy_usage_artifacts.sql

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('brand-assets', 'brand-assets', false)
  ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        name = EXCLUDED.name;
END
$$;

-- Drop obsolete policies if they exist to avoid conflicts with the new ownership model.
-- These will be replaced by newer migrations with better naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets are public'
  ) THEN
    DROP POLICY "Brand assets are public" ON storage.objects;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users manage their brand assets'
  ) THEN
    DROP POLICY "Users manage their brand assets" ON storage.objects;
  END IF;
END
$$;

-- Create legacy policies (these will be replaced by newer migrations)
-- Keeping for backward compatibility during migration transitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Brand assets users can read own files'
  ) THEN
    CREATE POLICY "Brand assets users can read own files"
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
      AND policyname = 'Brand assets users can insert own files'
  ) THEN
    CREATE POLICY "Brand assets users can insert own files"
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
      AND policyname = 'Brand assets users can update own files'
  ) THEN
    CREATE POLICY "Brand assets users can update own files"
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
      AND policyname = 'Brand assets users can delete own files'
  ) THEN
    CREATE POLICY "Brand assets users can delete own files"
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
