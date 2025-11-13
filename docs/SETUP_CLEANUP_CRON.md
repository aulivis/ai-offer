# Setting Up Preview Offers Cleanup Cron Job

This document explains how to set up automatic cleanup of expired preview offers.

## Option 1: Using pg_cron (if available)

If your Supabase project has the `pg_cron` extension enabled, the migration will automatically schedule the cleanup job. This runs daily at 2 AM UTC.

To check if pg_cron is enabled:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

If not enabled, you may need to enable it via Supabase Dashboard or contact support (availability depends on your plan).

## Option 2: Using Supabase Edge Function with Cron Trigger (Recommended)

This is the most reliable method and works on all Supabase plans.

### Step 1: Deploy the Edge Function

Deploy the cleanup function:

```bash
supabase functions deploy cleanup-preview-offers
```

Or if using Supabase CLI from the project root:

```bash
cd web
supabase functions deploy cleanup-preview-offers
```

### Step 2: Configure Cron Job in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database** > **Cron Jobs** (or **Database** > **Extensions** > **pg_cron** if available)
3. Click **"Create Cron Job"** or **"New Cron Job"**
4. Configure:
   - **Name**: `cleanup-preview-offers`
   - **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
   - **HTTP Request**:
     - Method: `POST`
     - URL: `https://[your-project-ref].supabase.co/functions/v1/cleanup-preview-offers`
     - Headers:
       - `Authorization: Bearer [your-service-role-key]`
       - `Content-Type: application/json`

### Step 3: Test the Function

Test the function manually:

```bash
curl -X POST \
  'https://[your-project-ref].supabase.co/functions/v1/cleanup-preview-offers' \
  -H 'Authorization: Bearer [your-service-role-key]' \
  -H 'Content-Type: application/json'
```

Expected response:

```json
{
  "success": true,
  "deleted_count": 0,
  "timestamp": "2025-01-30T10:00:00.000Z"
}
```

## Option 3: External Cron Service

If you prefer using an external cron service (e.g., GitHub Actions, cron-job.org, EasyCron):

1. Create an API endpoint that calls the cleanup function (optional, or call Edge Function directly)
2. Set up a cron job to make HTTP POST request to:
   ```
   https://[your-project-ref].supabase.co/functions/v1/cleanup-preview-offers
   ```
   With header: `Authorization: Bearer [your-service-role-key]`

## Manual Cleanup

You can also run the cleanup manually via SQL:

```sql
SELECT public.cleanup_expired_preview_offers();
```

This will return the number of deleted offers.

## Monitoring

To check when cleanup last ran and how many offers were deleted, you can query:

```sql
-- Check for expired preview offers that should be cleaned up
SELECT
  COUNT(*) as expired_preview_offers
FROM public.offers o
INNER JOIN public.offer_shares os ON os.offer_id = o.id
WHERE o.status = 'draft'
  AND o.pdf_url IS NULL
  AND os.expires_at IS NOT NULL
  AND os.expires_at < NOW()
  AND (
    (o.inputs->>'preview')::boolean = true
    OR o.created_at > NOW() - INTERVAL '24 hours'
  );
```

## Troubleshooting

### pg_cron not available

- Use Option 2 (Edge Function) instead
- Check your Supabase plan - pg_cron may require a higher tier

### Edge Function not accessible

- Verify the function is deployed: `supabase functions list`
- Check function logs in Supabase Dashboard
- Ensure service role key is correct

### Cleanup not running

- Check cron job status in Supabase Dashboard
- Verify the schedule expression is correct
- Check Edge Function logs for errors
