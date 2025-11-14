-- Test Script: Verify RLS Policies Work Correctly
-- This script tests that RLS policies prevent users from accessing other users' data
-- Run this after applying the RLS migrations

-- ============================================================================
-- IMPORTANT: These tests should be run as different users to verify isolation
-- ============================================================================

-- Test 1: Verify activities RLS
-- As user A, try to access user B's activities (should return 0 rows)
DO $$
DECLARE
  user_a_id UUID := '00000000-0000-0000-0000-000000000001'::UUID; -- Replace with actual user ID
  user_b_id UUID := '00000000-0000-0000-0000-000000000002'::UUID; -- Replace with actual user ID
  accessible_count INTEGER;
BEGIN
  -- Set current user to user A
  PERFORM set_config('request.jwt.claim.sub', user_a_id::TEXT, true);
  
  -- Try to count activities belonging to user B
  SELECT COUNT(*) INTO accessible_count
  FROM public.activities
  WHERE user_id = user_b_id;
  
  IF accessible_count > 0 THEN
    RAISE EXCEPTION 'RLS FAILED: User A can access User B activities (count: %)', accessible_count;
  ELSE
    RAISE NOTICE 'PASS: User A cannot access User B activities';
  END IF;
END
$$;

-- Test 2: Verify clients RLS
-- As user A, try to access user B's clients (should return 0 rows)
DO $$
DECLARE
  user_a_id UUID := '00000000-0000-0000-0000-000000000001'::UUID; -- Replace with actual user ID
  user_b_id UUID := '00000000-0000-0000-0000-000000000002'::UUID; -- Replace with actual user ID
  accessible_count INTEGER;
BEGIN
  -- Set current user to user A
  PERFORM set_config('request.jwt.claim.sub', user_a_id::TEXT, true);
  
  -- Try to count clients belonging to user B
  SELECT COUNT(*) INTO accessible_count
  FROM public.clients
  WHERE user_id = user_b_id;
  
  IF accessible_count > 0 THEN
    RAISE EXCEPTION 'RLS FAILED: User A can access User B clients (count: %)', accessible_count;
  ELSE
    RAISE NOTICE 'PASS: User A cannot access User B clients';
  END IF;
END
$$;

-- Test 3: Verify users can access their own data
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID; -- Replace with actual user ID
  own_activities_count INTEGER;
  own_clients_count INTEGER;
BEGIN
  -- Set current user
  PERFORM set_config('request.jwt.claim.sub', test_user_id::TEXT, true);
  
  -- Count own activities
  SELECT COUNT(*) INTO own_activities_count
  FROM public.activities
  WHERE user_id = test_user_id;
  
  -- Count own clients
  SELECT COUNT(*) INTO own_clients_count
  FROM public.clients
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'User can access their own data: % activities, % clients', 
    own_activities_count, own_clients_count;
END
$$;

-- ============================================================================
-- Manual Testing Instructions
-- ============================================================================
-- 
-- To properly test RLS, you need to:
-- 1. Create two test users in your application
-- 2. As User A, create some activities and clients
-- 3. As User B, create some activities and clients
-- 4. As User A, verify you can only see your own data
-- 5. As User B, verify you can only see your own data
--
-- In the application:
-- - Login as User A
-- - Verify you can see User A's activities and clients
-- - Verify you cannot see User B's activities and clients
-- - Login as User B
-- - Verify you can see User B's activities and clients
-- - Verify you cannot see User A's activities and clients
--
-- ============================================================================

-- Query to check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'clients')
ORDER BY tablename, policyname;

-- Query to verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'clients');








