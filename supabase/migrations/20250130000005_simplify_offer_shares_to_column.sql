-- Migration: SIMPLIFIED APPROACH - Add share_token directly to offers table
-- This is an ALTERNATIVE to the separate offer_shares table
-- Only use this if you don't need multiple share links per offer
-- 
-- WARNING: This migration is OPTIONAL. Only run it if you want to simplify
-- and don't need the advanced features of offer_shares table (multiple links,
-- expiration dates, access tracking, etc.)

-- Add share_token column to offers table
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS share_token text;

-- Create unique index on share_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS offers_share_token_idx 
  ON public.offers (share_token) 
  WHERE share_token IS NOT NULL;

-- Create a function to generate and set share token when offer is created
CREATE OR REPLACE FUNCTION public.generate_offer_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_token text;
  v_exists boolean;
BEGIN
  -- Generate token and convert base64 to base64url format
  LOOP
    -- Generate 32 random bytes, encode as base64, then convert to base64url
    v_token := encode(gen_random_bytes(32), 'base64');
    -- Convert base64 to base64url: replace + with -, / with _, and remove padding =
    v_token := replace(replace(rtrim(v_token, '='), '+', '-'), '/', '_');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.offers WHERE share_token = v_token) INTO v_exists;
    
    -- If token is unique, exit loop
    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_token;
END;
$$;

-- Update trigger to set share_token instead of creating offer_shares record
CREATE OR REPLACE FUNCTION public.handle_new_offer_share_simple()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set token if it's not already set
  IF NEW.share_token IS NULL THEN
    NEW.share_token := public.generate_offer_share_token();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create BEFORE INSERT trigger to set share_token
DROP TRIGGER IF EXISTS on_offer_create_share_simple ON public.offers;

CREATE TRIGGER on_offer_create_share_simple
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_offer_share_simple();

-- Backfill: Generate tokens for existing offers without share_token
UPDATE public.offers
SET share_token = public.generate_offer_share_token()
WHERE share_token IS NULL;

COMMENT ON COLUMN public.offers.share_token IS 'Secure token for sharing this offer. Used in URL: /offer/{share_token}';

