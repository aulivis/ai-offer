-- Migration: Data Integrity Checks
-- This migration performs data integrity checks and fixes common issues

-- ============================================================================
-- 1. Check for orphaned offers (offers with invalid recipient_id)
-- ============================================================================

DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check for offers with recipient_id that doesn't exist in clients table
  SELECT COUNT(*) INTO orphaned_count
  FROM public.offers o
  WHERE o.recipient_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = o.recipient_id
    );
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned offers with invalid recipient_id', orphaned_count;
    RAISE NOTICE 'Consider updating or removing these offers:';
    RAISE NOTICE '  SELECT id, title, recipient_id FROM offers WHERE recipient_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clients WHERE id = offers.recipient_id);';
  ELSE
    RAISE NOTICE 'No orphaned offers found - all recipient_id values are valid';
  END IF;
END
$$;

-- ============================================================================
-- 2. Check for offers with null user_id
-- ============================================================================

DO $$
DECLARE
  null_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_user_count
  FROM public.offers
  WHERE user_id IS NULL;
  
  IF null_user_count > 0 THEN
    RAISE WARNING 'Found % offers with null user_id', null_user_count;
    RAISE NOTICE 'These offers cannot be accessed via RLS. Consider cleaning them up.';
  ELSE
    RAISE NOTICE 'No offers with null user_id found';
  END IF;
END
$$;

-- ============================================================================
-- 3. Check for activities with null user_id
-- ============================================================================

DO $$
DECLARE
  null_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_user_count
  FROM public.activities
  WHERE user_id IS NULL;
  
  IF null_user_count > 0 THEN
    RAISE WARNING 'Found % activities with null user_id', null_user_count;
    RAISE NOTICE 'These activities cannot be accessed via RLS. Consider cleaning them up.';
  ELSE
    RAISE NOTICE 'No activities with null user_id found';
  END IF;
END
$$;

-- ============================================================================
-- 4. Check for clients with null user_id
-- ============================================================================

DO $$
DECLARE
  null_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_user_count
  FROM public.clients
  WHERE user_id IS NULL;
  
  IF null_user_count > 0 THEN
    RAISE WARNING 'Found % clients with null user_id', null_user_count;
    RAISE NOTICE 'These clients cannot be accessed via RLS. Consider cleaning them up.';
  ELSE
    RAISE NOTICE 'No clients with null user_id found';
  END IF;
END
$$;

-- ============================================================================
-- 5. Check for pdf_jobs with invalid offer_id
-- ============================================================================

DO $$
DECLARE
  invalid_offer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_offer_count
  FROM public.pdf_jobs pj
  WHERE NOT EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = pj.offer_id
  );
  
  IF invalid_offer_count > 0 THEN
    RAISE WARNING 'Found % pdf_jobs with invalid offer_id', invalid_offer_count;
    RAISE NOTICE 'These jobs reference non-existent offers. Consider cleaning them up.';
  ELSE
    RAISE NOTICE 'No pdf_jobs with invalid offer_id found';
  END IF;
END
$$;

-- ============================================================================
-- 6. Check for pdf_jobs with invalid user_id
-- ============================================================================

DO $$
DECLARE
  invalid_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_user_count
  FROM public.pdf_jobs pj
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = pj.user_id
  );
  
  IF invalid_user_count > 0 THEN
    RAISE WARNING 'Found % pdf_jobs with invalid user_id', invalid_user_count;
    RAISE NOTICE 'These jobs reference non-existent users. Consider cleaning them up.';
  ELSE
    RAISE NOTICE 'No pdf_jobs with invalid user_id found';
  END IF;
END
$$;

-- ============================================================================
-- 7. Check for testimonials with invalid activity_id
-- ============================================================================

DO $$
DECLARE
  invalid_activity_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'testimonials'
  ) THEN
    SELECT COUNT(*) INTO invalid_activity_count
    FROM public.testimonials t
    WHERE t.activity_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.activities a
        WHERE a.id = t.activity_id
      );
    
    IF invalid_activity_count > 0 THEN
      RAISE WARNING 'Found % testimonials with invalid activity_id', invalid_activity_count;
      RAISE NOTICE 'These testimonials reference non-existent activities. Consider cleaning them up.';
    ELSE
      RAISE NOTICE 'No testimonials with invalid activity_id found';
    END IF;
  END IF;
END
$$;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Data Integrity Checks Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Review warnings above for any data issues';
  RAISE NOTICE '========================================';
END
$$;


