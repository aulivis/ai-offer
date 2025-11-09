# How to Apply Database Migrations

This guide explains how to apply the three new database migrations to your Supabase database.

## Migration Files

1. `20250128000000_enable_rls_on_activities.sql` - Enable RLS on activities table
2. `20250128000001_enable_rls_on_clients.sql` - Enable RLS on clients table
3. `20250128000002_remove_obsolete_recipients_table.sql` - Remove obsolete recipients table

## Option 1: Apply via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Apply Combined Migration**
   - Open the file `APPLY_NEW_MIGRATIONS.sql` in this directory
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify Success**
   - Check for any error messages
   - All migrations are idempotent (safe to run multiple times)
   - You should see success messages in the output

## Option 2: Apply Individual Migrations

If you prefer to apply migrations one at a time:

1. Open each migration file in order:
   - `20250128000000_enable_rls_on_activities.sql`
   - `20250128000001_enable_rls_on_clients.sql`
   - `20250128000002_remove_obsolete_recipients_table.sql`

2. Copy and paste each file's contents into the SQL Editor
3. Run each migration sequentially

## Option 3: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

## What These Migrations Do

### Migration 1: Enable RLS on Activities Table
- Enables Row Level Security on the `activities` table
- Adds policies so users can only access their own activities
- Grants service role full access for background jobs

### Migration 2: Enable RLS on Clients Table
- Enables Row Level Security on the `clients` table
- Adds policies so users can only access their own clients
- Grants service role full access for background jobs
- Note: The `offers.recipient_id` FK will still work correctly

### Migration 3: Remove Obsolete Recipients Table
- Safely removes the `recipients` table (which is not used)
- Checks for data and foreign key dependencies before dropping
- Drops related indexes and policies
- All application code uses the `clients` table instead

## Verification

After applying migrations, verify:

1. **RLS is Enabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('activities', 'clients');
   ```
   Both tables should have `rowsecurity = true`

2. **Policies Exist**
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('activities', 'clients');
   ```
   You should see 4 policies for each table (SELECT, INSERT, UPDATE, DELETE)

3. **Recipients Table Removed**
   ```sql
   SELECT tablename 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'recipients';
   ```
   This should return no rows

4. **Application Still Works**
   - Test that users can create/view activities
   - Test that users can create/view clients
   - Test that dashboard shows offers with client names
   - Verify users cannot access other users' data

## Troubleshooting

### Migration Fails with "table does not exist"
- Ensure the `activities` and `clients` tables exist
- These tables are typically created outside of migrations

### Migration Fails with "policy already exists"
- This is safe to ignore - migrations are idempotent
- The `IF NOT EXISTS` checks prevent duplicate policies

### Recipients Table Cannot Be Dropped
- Check if the table has data: `SELECT COUNT(*) FROM recipients;`
- Check for foreign key references
- The migration will warn and skip if there are dependencies

## Rollback

If you need to rollback these migrations:

1. **Disable RLS on activities** (not recommended for security)
   ```sql
   ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Users can select their own activities" ON public.activities;
   DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
   DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
   DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;
   ```

2. **Disable RLS on clients** (not recommended for security)
   ```sql
   ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "Users can select their own clients" ON public.clients;
   DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
   DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
   DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
   ```

**Note**: Rolling back RLS is not recommended as it reduces security. Only do this if absolutely necessary.

## Support

If you encounter any issues:
1. Check the migration output for error messages
2. Verify your Supabase project has the required permissions
3. Ensure you're using the service role key or have admin access
4. Check the Supabase logs for additional details

