-- Migration: Remove obsolete recipients table
-- This migration removes the recipients table which is not used in the application.
-- 
-- Background: The recipients table was created but never used. All application
-- code uses the clients table instead. The offers.recipient_id FK points to
-- clients.id, not recipients.id.
--
-- Safety: This migration checks for data and foreign key dependencies before
-- dropping the table. If the table has data or is referenced by other tables,
-- the migration will warn and skip the drop.

-- Check if recipients table exists and has data
DO $$
DECLARE
  row_count INTEGER;
  has_foreign_keys BOOLEAN;
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'recipients'
  ) THEN
    -- Count rows
    EXECUTE 'SELECT COUNT(*) FROM public.recipients' INTO row_count;
    
    -- Check for foreign key references to recipients table
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'recipients'
    ) INTO has_foreign_keys;
    
    -- Warn if table has data
    IF row_count > 0 THEN
      RAISE WARNING 'recipients table contains % rows. Consider migrating data to clients table before dropping.', row_count;
      RAISE NOTICE 'Skipping drop of recipients table due to existing data.';
      RETURN;
    END IF;
    
    -- Warn if table has foreign key references
    IF has_foreign_keys THEN
      RAISE WARNING 'recipients table is referenced by foreign keys. Cannot safely drop.';
      RAISE NOTICE 'Skipping drop of recipients table due to foreign key dependencies.';
      RETURN;
    END IF;
    
    -- Drop index on recipients table (if exists)
    DROP INDEX IF EXISTS public.idx_recipients_user_id;
    RAISE NOTICE 'Dropped index: idx_recipients_user_id';
    
    -- Drop RLS policies on recipients table (if any)
    DO $$
    DECLARE
      policy_rec RECORD;
    BEGIN
      FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'recipients'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.recipients', policy_rec.policyname);
        RAISE NOTICE 'Dropped policy: % on recipients table', policy_rec.policyname;
      END LOOP;
    END
    $$;
    
    -- Drop recipients table
    DROP TABLE IF EXISTS public.recipients CASCADE;
    RAISE NOTICE 'Dropped obsolete table: recipients';
  ELSE
    RAISE NOTICE 'recipients table does not exist. Nothing to drop.';
  END IF;
END
$$;

-- Update migration comments to remove recipients references
-- Note: This is informational only - actual migration files should be updated manually
COMMENT ON SCHEMA public IS 'Public schema. Note: recipients table has been removed (use clients table instead).';

