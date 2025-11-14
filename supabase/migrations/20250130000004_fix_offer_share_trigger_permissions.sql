-- Migration: Fix offer share trigger permissions
-- Ensure the trigger function can properly create share links
-- This fixes the issue where triggers fail silently due to RLS/permissions

-- First, ensure the function owner has proper permissions
-- The function is SECURITY DEFINER, so it runs with the owner's privileges
DO $$
BEGIN
  -- Grant INSERT on offer_shares to the function owner (typically postgres or supabase_admin)
  -- This allows the security definer function to bypass RLS
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT INSERT ON TABLE public.offer_shares TO postgres;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN
    GRANT INSERT ON TABLE public.offer_shares TO supabase_admin;
  END IF;
  
  -- Also grant to authenticated role as fallback
  GRANT INSERT ON TABLE public.offer_shares TO authenticated;
END
$$;

-- Recreate the trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_offer_share()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_token text;
  v_share_id uuid;
  v_error_message text;
BEGIN
  -- Generate secure token for the default share link
  BEGIN
    v_share_token := public.generate_share_token();
  EXCEPTION
    WHEN OTHERS THEN
      -- If token generation fails, log and return (don't fail offer creation)
      RAISE WARNING 'Failed to generate share token for offer %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
  
  -- Create default share link (permanent, no expiration)
  BEGIN
    INSERT INTO public.offer_shares (
      offer_id,
      user_id,
      token,
      expires_at,
      is_active,
      access_count,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      v_share_token,
      NULL, -- No expiration by default
      TRUE, -- Active by default
      0,
      timezone('utc', now()),
      timezone('utc', now())
    )
    RETURNING id INTO v_share_id;
    
    -- Log success (only visible in server logs)
    RAISE NOTICE 'Created default share link for offer %: token %', NEW.id, v_share_token;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the offer creation
      -- This ensures offers can still be created even if share link creation fails
      v_error_message := SQLERRM;
      RAISE WARNING 'Failed to create default share link for offer %: %', NEW.id, v_error_message;
      
      -- Try to get more details about the error
      RAISE WARNING 'Error details - SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;
      
      -- Return NEW to allow offer creation to succeed
      RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_offer_share() IS 'Trigger function that automatically creates a default share link when a new offer is created. Uses security definer to bypass RLS.';

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_offer_create_share ON public.offers;

CREATE TRIGGER on_offer_create_share
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_offer_share();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_offer_share() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_share_token() TO authenticated;


