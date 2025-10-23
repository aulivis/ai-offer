-- Ensure the profiles table supports branding updates and Supabase policies
-- are present even if earlier migrations were skipped.

-- Add missing branding columns when deploying into an environment that
-- predates the initial branding rollout.
alter table public.profiles
  add column if not exists brand_logo_url text,
  add column if not exists brand_color_primary text,
  add column if not exists brand_color_secondary text,
  add column if not exists offer_template text;

-- Allow authenticated users to manage their own profile information.
alter table public.profiles enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'profiles'
       AND policyname = 'Users can view their profile'
  ) THEN
    CREATE POLICY "Users can view their profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'profiles'
       AND policyname = 'Users can update their profile'
  ) THEN
    CREATE POLICY "Users can update their profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'profiles'
       AND policyname = 'Users can create their profile'
  ) THEN
    CREATE POLICY "Users can create their profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Make sure the API roles are able to interact with the table.
grant usage on schema public to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant usage on schema public to service_role;
grant all on table public.profiles to service_role;

-- Ensure the storage bucket used for brand assets exists and is configured.
insert into storage.buckets (id, name, public)
select 'brand-assets', 'brand-assets', false
 where not exists (
   select 1 from storage.buckets where id = 'brand-assets'
 );

update storage.buckets
   set public = false
 where id = 'brand-assets'
   and public is distinct from false;

update storage.buckets
   set file_size_limit = 4194304
 where id = 'brand-assets'
   and (file_size_limit is null or file_size_limit <> 4194304);

update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/svg+xml']
 where id = 'brand-assets'
   and allowed_mime_types is distinct from array['image/png', 'image/jpeg', 'image/svg+xml'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_policies
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
    SELECT 1
      FROM pg_policies
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
