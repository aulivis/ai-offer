# Brand asset storage policy update

We tightened the Supabase storage policies for the `brand-assets` bucket so that
files are private to the tenant that uploaded them. The legacy `"Brand assets
are public"` policy granted blanket read access to every authenticated user,
which meant any tenant could fetch another tenant's logos.

## Deployment checklist

1. **Run the latest Supabase migrations**
   ```sh
   supabase db push
   ```
   or apply the migrations with your existing release tooling. The migration
   `20250601120000_restrict_brand_assets_access.sql` drops the legacy policies,
   recreates owner-scoped rules, and ensures the bucket is private.

2. **Optional: verify the policies locally**
   Execute the regression script against a staging database to confirm cross
   tenant reads are blocked:
   ```sh
   psql "$SUPABASE_DB_URL" -f supabase/tests/brand_assets_policy_test.sql
   ```
   The script inserts sample rows inside a transaction and raises an error if a
   tenant can view another tenant's files.

3. **Review application uploads**
   Ensure any automated uploader (for example, background services) uses the
   service role if it needs to impersonate tenants. Regular client uploads will
   continue to work because the policies rely on `auth.uid()` matching the
   object owner.

## Rollback guidance

If you need to revert, drop the new policies and recreate the legacy ones, then
mark the bucket as public again. Because the regression script runs inside a
transaction, it will not leave temporary rows behind in any environment.
