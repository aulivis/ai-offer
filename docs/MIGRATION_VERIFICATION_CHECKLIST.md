# Migration Verification Checklist

This checklist helps verify that all database migrations have been applied correctly and that the system is working as expected.

## Pre-Migration Checklist

- [ ] Backup database
- [ ] Test migrations on staging environment first
- [ ] Review all migration files
- [ ] Verify no active users are performing critical operations

## Migration Application Order

Apply migrations in this order:

1. ✅ `20250128000000_enable_rls_on_activities.sql`
2. ✅ `20250128000001_enable_rls_on_clients.sql`
3. ✅ `20250128000002_remove_obsolete_recipients_table.sql`
4. ✅ `20250128000003_verify_rls_and_indexes.sql`
5. ✅ `20250128000004_data_integrity_checks.sql`
6. ✅ `20250128000005_retention_policies.sql`

Or use the combined file: `APPLY_NEW_MIGRATIONS.sql` (includes migrations 1-3)

## Post-Migration Verification

### 1. Verify RLS is Enabled

```sql
-- Check RLS status
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('activities', 'clients');
```

Expected: Both tables should have `rowsecurity = true`

### 2. Verify RLS Policies Exist

```sql
-- Check policies for activities
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'activities'
ORDER BY policyname;
```

Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

```sql
-- Check policies for clients
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'clients'
ORDER BY policyname;
```

Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 3. Verify Indexes Exist

```sql
-- Check indexes on clients table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'clients';
```

Expected: At least `idx_clients_user_id` and `idx_clients_user_company`

```sql
-- Check indexes on activities table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'activities';
```

Expected: At least `idx_activities_user_id` and `idx_activities_user_created`

### 4. Verify Recipients Table is Removed

```sql
-- Check if recipients table exists
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'recipients';
```

Expected: No rows (table should not exist)

### 5. Verify PDF Jobs Status Constraint

```sql
-- Check pdf_jobs status constraint
SELECT 
  conname,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.pdf_jobs'::regclass
  AND conname LIKE '%status%';
```

Expected: Constraint should allow: 'pending', 'processing', 'completed', 'failed'

### 6. Verify Vector Extension

```sql
-- Check if vector extension is enabled
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';
```

Expected: Extension should exist (for chatbot_documents)

### 7. Data Integrity Checks

Run the data integrity migration (`20250128000004_data_integrity_checks.sql`) and review warnings:

- [ ] No orphaned offers (invalid recipient_id)
- [ ] No null user_id values
- [ ] No invalid foreign key references

### 8. Test RLS Policies

**Manual Testing Required:**

1. **Create Test Users**
   - Create User A and User B in your application
   - Login as User A
   - Create some activities and clients

2. **Test User Isolation**
   - Login as User A
   - Verify you can see User A's activities and clients
   - Verify you cannot see User B's activities and clients
   - Login as User B
   - Verify you can see User B's activities and clients
   - Verify you cannot see User A's activities and clients

3. **Test CRUD Operations**
   - As User A, create a new activity → Should succeed
   - As User A, update your activity → Should succeed
   - As User A, delete your activity → Should succeed
   - As User A, try to update User B's activity → Should fail (no rows updated)
   - Repeat for clients

### 9. Verify PDF Jobs Worker

```sql
-- Check pdf_jobs table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pdf_jobs'
ORDER BY ordinal_position;
```

Verify:
- [ ] Status column exists
- [ ] Status constraint allows: 'pending', 'processing', 'completed', 'failed'
- [ ] Edge Function worker can process jobs (test PDF generation)

### 10. Verify Application Functionality

Test the following in your application:

- [ ] **Dashboard**: Can view offers with client names (join works)
- [ ] **Create Offer**: Can create new offers
- [ ] **Activities**: Can create/view/edit/delete activities
- [ ] **Clients**: Can create/view/edit/delete clients
- [ ] **PDF Generation**: PDF jobs are created and processed
- [ ] **Settings**: Can manage profile, activities, testimonials

### 11. Verify Retention Policies

```sql
-- Check if cleanup functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'cleanup_%';
```

Expected: 5 cleanup functions should exist

Test cleanup functions (optional):
```sql
-- Test cleanup (dry run - check what would be deleted)
SELECT COUNT(*) as old_events
FROM template_render_events
WHERE created_at < NOW() - INTERVAL '90 days';

SELECT COUNT(*) as old_analytics
FROM chatbot_analytics
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 12. Performance Verification

After migrations, monitor:

- [ ] Query performance (dashboard loads quickly)
- [ ] Index usage (check with `EXPLAIN ANALYZE`)
- [ ] Database size (should not increase significantly)
- [ ] Response times (API endpoints respond quickly)

## Rollback Plan

If something goes wrong:

1. **RLS Issues**: Disable RLS temporarily (not recommended for production)
   ```sql
   ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
   ```

2. **Restore Recipients Table**: If needed, recreate from backup

3. **Restore Database**: Use database backup to restore previous state

## Support

If you encounter issues:

1. Check migration output for error messages
2. Review Supabase logs
3. Verify environment variables
4. Test on staging environment first
5. Contact database administrator if needed

## Notes

- All migrations are idempotent (safe to run multiple times)
- RLS policies use `auth.uid() = user_id` pattern
- Service role has full access to all tables (for background jobs)
- Retention policies should be run periodically (weekly recommended)

## Next Steps

After verification:

1. Monitor application for any issues
2. Set up scheduled cleanup jobs (retention policies)
3. Document any custom changes
4. Update team on new security policies
5. Consider adding integration tests for RLS

