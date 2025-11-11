-- ============================================================================
-- Complete Migration Script - Apply All New Migrations
-- ============================================================================
-- This file contains all new migrations that need to be applied in order.
-- Apply this entire script via Supabase Dashboard SQL Editor.
--
-- Migration Order:
-- 1. Enable RLS on activities table
-- 2. Enable RLS on clients table  
-- 3. Remove obsolete recipients table
-- 4. Verify RLS and indexes
-- 5. Data integrity checks
-- 6. Retention policies
--
-- All migrations are idempotent (safe to run multiple times).
-- ============================================================================

-- Import migrations 1-3 (from APPLY_NEW_MIGRATIONS.sql)
-- Note: Include the contents of APPLY_NEW_MIGRATIONS.sql here
-- Then continue with migrations 4-6 below

-- ============================================================================
-- After applying migrations 1-3, continue with:
-- ============================================================================

-- Migration 4: Verify RLS and Indexes
\i supabase/migrations/20250128000003_verify_rls_and_indexes.sql

-- Migration 5: Data Integrity Checks  
\i supabase/migrations/20250128000004_data_integrity_checks.sql

-- Migration 6: Retention Policies
\i supabase/migrations/20250128000005_retention_policies.sql

-- ============================================================================
-- Note: The \i command may not work in Supabase Dashboard
-- Instead, apply each migration file separately in order
-- ============================================================================




