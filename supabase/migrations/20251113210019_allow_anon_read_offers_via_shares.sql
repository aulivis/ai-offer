-- Migration: Allow anonymous users to read offers through active share links
-- This fixes the 404 issue when accessing shared offer links
-- Anonymous users need to be able to read offers that have active share links

-- Add RLS policy to allow anonymous users to read offers via active share links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'offers'
      AND policyname = 'Anonymous can read offers via active shares'
  ) THEN
    CREATE POLICY "Anonymous can read offers via active shares"
      ON public.offers
      FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM public.offer_shares
          WHERE offer_shares.offer_id = offers.id
            AND offer_shares.is_active = true
            AND (offer_shares.expires_at IS NULL OR offer_shares.expires_at > NOW())
        )
      );
  END IF;
END
$$;

COMMENT ON POLICY "Anonymous can read offers via active shares" ON public.offers IS 
  'Allows anonymous users to read offers that have active share links, enabling public access to shared offers.';

-- Add RLS policy to allow anonymous users to read profiles of users who have shared offers
-- This is needed for branding (logo, colors) on public offer pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Anonymous can read profiles via active shares'
  ) THEN
    CREATE POLICY "Anonymous can read profiles via active shares"
      ON public.profiles
      FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM public.offer_shares
          INNER JOIN public.offers ON offers.id = offer_shares.offer_id
          WHERE offers.user_id = profiles.id
            AND offer_shares.is_active = true
            AND (offer_shares.expires_at IS NULL OR offer_shares.expires_at > NOW())
        )
      );
  END IF;
END
$$;

COMMENT ON POLICY "Anonymous can read profiles via active shares" ON public.profiles IS 
  'Allows anonymous users to read profiles of users who have active share links, enabling branding display on public offer pages.';

