-- Script to check and fix missing offer share links
-- Run this in your Supabase SQL Editor

-- 1. Check if offer_shares table exists and count records
SELECT 
  'offer_shares table' as check_name,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'offer_shares';

-- 2. Check if trigger exists
SELECT 
  'Trigger check' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_trigger 
      WHERE tgname = 'on_offer_create_share'
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status;

-- 3. Find offers without share links
SELECT 
  o.id as offer_id,
  o.title,
  o.user_id,
  o.created_at,
  'MISSING SHARE LINK' as status
FROM public.offers o
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.offer_shares os 
  WHERE os.offer_id = o.id 
    AND os.is_active = true
    AND (os.expires_at IS NULL OR os.expires_at > NOW())
)
ORDER BY o.created_at DESC;

-- 4. Create missing share links (run this if you found missing ones)
-- This will create share links for all offers that don't have one
INSERT INTO public.offer_shares (
  offer_id,
  user_id,
  token,
  expires_at,
  is_active,
  access_count,
  created_at,
  updated_at
)
SELECT 
  o.id as offer_id,
  o.user_id,
  -- Generate base64url token (32 bytes)
  REPLACE(REPLACE(RTRIM(ENCODE(GEN_RANDOM_BYTES(32), 'base64'), '='), '+', '-'), '/', '_') as token,
  NULL as expires_at, -- No expiration
  true as is_active,
  0 as access_count,
  o.created_at,
  NOW() as updated_at
FROM public.offers o
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.offer_shares os 
  WHERE os.offer_id = o.id 
    AND os.is_active = true
    AND (os.expires_at IS NULL OR os.expires_at > NOW())
)
ON CONFLICT (token) DO NOTHING; -- Skip if token collision (extremely unlikely)

-- 5. Verify all offers now have share links
SELECT 
  'Verification' as check_name,
  COUNT(DISTINCT o.id) as total_offers,
  COUNT(DISTINCT os.offer_id) as offers_with_shares,
  COUNT(DISTINCT o.id) - COUNT(DISTINCT os.offer_id) as missing_shares
FROM public.offers o
LEFT JOIN public.offer_shares os ON os.offer_id = o.id 
  AND os.is_active = true
  AND (os.expires_at IS NULL OR os.expires_at > NOW());






