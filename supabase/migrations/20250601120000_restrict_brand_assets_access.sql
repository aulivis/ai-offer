-- Tighten brand asset storage policies to enforce tenant ownership and ensure the bucket remains private.

-- Guarantee the brand-assets bucket is private.
update storage.buckets
   set public = false
 where id = 'brand-assets'
   and public is distinct from false;

-- Drop legacy policies that exposed assets across tenants.
DROP POLICY IF EXISTS "Brand assets are public" ON storage.objects;
DROP POLICY IF EXISTS "Users manage their brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can insert own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets users can delete own files" ON storage.objects;

-- Recreate policies with strict owner-based access control.
DROP POLICY IF EXISTS "Brand assets owners can read" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets owners can insert" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets owners can update" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets owners can delete" ON storage.objects;

CREATE POLICY "Brand assets owners can read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND auth.uid() IS NOT NULL
    AND auth.uid() = owner
  );

CREATE POLICY "Brand assets owners can insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND auth.uid() IS NOT NULL
    AND auth.uid() = owner
  );

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

CREATE POLICY "Brand assets owners can delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND auth.uid() IS NOT NULL
    AND auth.uid() = owner
  );
