-- Additional database indexes for query optimization
-- These indexes improve performance for common query patterns

-- Index for querying offers by user_id and status (common in dashboard)
create index if not exists idx_offers_user_id_status 
  on public.offers(user_id, status) 
  where status is not null;

-- Index for querying offers by user_id and created_at (common pagination pattern)
create index if not exists idx_offers_user_id_created_at 
  on public.offers(user_id, created_at desc);

-- Index for querying PDF jobs by status and created_at (for pending job processing)
create index if not exists idx_pdf_jobs_status_created_at 
  on public.pdf_jobs(status, created_at) 
  where status in ('pending', 'processing');

-- Composite index for user_id and offer_id lookups in PDF jobs
create index if not exists idx_pdf_jobs_user_offer 
  on public.pdf_jobs(user_id, offer_id);

-- Index for sessions query by user_id and revoked_at (for active session checks)
create index if not exists idx_sessions_user_revoked 
  on public.sessions(user_id, revoked_at) 
  where revoked_at is null;

-- Index for usage counters by user_id and period_start (for usage queries)
create index if not exists idx_usage_counters_user_period 
  on public.usage_counters(user_id, period_start desc);

-- Index for device usage counters by user_id and period_start
create index if not exists idx_device_usage_user_period 
  on public.device_usage_counters(user_id, period_start desc);

-- Index for audit logs by user_id and created_at (for user activity queries)
create index if not exists idx_audit_logs_user_created 
  on public.audit_logs(user_id, created_at desc);

-- Index for recipients by user_id (for client listing)
create index if not exists idx_recipients_user_id 
  on public.recipients(user_id);

-- Index for offer_text_templates by user_id and updated_at (for recent templates)
create index if not exists idx_offer_text_templates_user_updated 
  on public.offer_text_templates(user_id, updated_at desc);

-- Index for template_render_metrics by template_id (for telemetry queries)
create index if not exists idx_template_render_metrics_template 
  on public.template_render_metrics(template_id);

