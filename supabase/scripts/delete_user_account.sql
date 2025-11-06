-- Script to completely delete a user account and all related data
-- WARNING: This is irreversible! Make sure you have the correct user ID.
--
-- INSTRUCTIONS:
-- 1. Replace 'b9106fe0-2871-445f-b0dc-6c8e9de853bf' with your actual user ID
-- 2. Run this in Supabase Dashboard > SQL Editor
-- 3. The deletion will cascade to all related tables due to foreign key constraints

DO $$
DECLARE
  target_user_id uuid := 'b9106fe0-2871-445f-b0dc-6c8e9de853bf'; -- REPLACE WITH YOUR USER ID
BEGIN
  -- First, show what will be deleted (for verification)
  RAISE NOTICE 'Records to be deleted for user %:', target_user_id;
  RAISE NOTICE '  - Offers: %', (SELECT COUNT(*) FROM offers WHERE user_id = target_user_id);
  RAISE NOTICE '  - Profiles: %', (SELECT COUNT(*) FROM profiles WHERE id = target_user_id);
  RAISE NOTICE '  - Usage counters: %', (SELECT COUNT(*) FROM usage_counters WHERE user_id = target_user_id);
  RAISE NOTICE '  - Device usage counters: %', (SELECT COUNT(*) FROM device_usage_counters WHERE user_id = target_user_id);
  RAISE NOTICE '  - PDF jobs: %', (SELECT COUNT(*) FROM pdf_jobs WHERE user_id = target_user_id);
  RAISE NOTICE '  - Activities: %', (SELECT COUNT(*) FROM activities WHERE user_id = target_user_id);
  RAISE NOTICE '  - Clients: %', (SELECT COUNT(*) FROM clients WHERE user_id = target_user_id);
  RAISE NOTICE '  - Sessions: %', (SELECT COUNT(*) FROM sessions WHERE user_id = target_user_id);
  RAISE NOTICE '  - Offer text templates: %', (SELECT COUNT(*) FROM offer_text_templates WHERE user_id = target_user_id);
  
  -- Delete the user from auth.users
  -- This will CASCADE delete related data due to foreign key constraints:
  -- - profiles (via FK with ON DELETE CASCADE)
  -- - offers (via FK with ON DELETE CASCADE)
  -- - usage_counters (via FK with ON DELETE CASCADE)
  -- - device_usage_counters (via FK with ON DELETE CASCADE)
  -- - pdf_jobs (via FK with ON DELETE CASCADE)
  -- - activities (via FK with ON DELETE CASCADE)
  -- - clients (via FK with ON DELETE CASCADE)
  -- - sessions (via FK with ON DELETE CASCADE)
  -- - offer_text_templates (via FK with ON DELETE CASCADE)
  
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- Verify deletion
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User still exists - deletion may have failed';
  ELSE
    RAISE NOTICE 'User successfully deleted!';
  END IF;
END $$;

-- NOTE: Storage files (PDFs and brand assets) need to be deleted separately:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Delete folders:
--    - offers/{user_id}/* (all PDFs)
--    - brand-assets/{user_id}/* (brand logos)
-- Or use the Storage API to delete them programmatically

