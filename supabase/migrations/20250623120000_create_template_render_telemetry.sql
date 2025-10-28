-- Track template render performance for monitoring and optimisation.
create table if not exists public.template_render_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  template_id text not null check (char_length(trim(template_id)) > 0),
  renderer text not null check (char_length(trim(renderer)) > 0),
  render_ms integer check (render_ms is null or render_ms >= 0),
  outcome text not null check (outcome in ('success', 'failure')),
  error_code text check (error_code is null or char_length(trim(error_code)) > 0)
);

comment on table public.template_render_events is 'Event log for offer template rendering, used for performance telemetry.';
comment on column public.template_render_events.template_id is 'Canonical template identifier captured during rendering.';
comment on column public.template_render_events.renderer is 'Source component that initiated the render (for example, preview or AI generate).';
comment on column public.template_render_events.render_ms is 'Measured render duration in milliseconds when available.';
comment on column public.template_render_events.outcome is 'Render outcome captured as success or failure.';
comment on column public.template_render_events.error_code is 'Best-effort, non-PII indicator of the failure class.';

create index if not exists template_render_events_template_id_idx on public.template_render_events (template_id);
create index if not exists template_render_events_renderer_idx on public.template_render_events (renderer);
create index if not exists template_render_events_created_at_idx on public.template_render_events (created_at desc);
create index if not exists template_render_events_outcome_idx on public.template_render_events (outcome);

alter table public.template_render_events enable row level security;

create or replace view public.template_render_metrics as
select
  template_id,
  count(*)::bigint as total_renders,
  sum(case when outcome = 'success' then 1 else 0 end)::bigint as success_count,
  sum(case when outcome = 'failure' then 1 else 0 end)::bigint as failure_count,
  coalesce(sum(render_ms), 0)::bigint as total_render_ms,
  count(render_ms)::bigint as render_samples,
  case when count(*) = 0 then 0::numeric
       else sum(case when outcome = 'failure' then 1 else 0 end)::numeric / count(*)
  end as failure_rate,
  case when count(render_ms) = 0 then null
       else sum(render_ms)::numeric / count(render_ms)
  end as average_render_ms
from public.template_render_events
group by template_id;

comment on view public.template_render_metrics is 'Aggregated render telemetry per template (usage, failure rate, and timing).';
comment on column public.template_render_metrics.total_renders is 'Total number of render attempts for the template.';
comment on column public.template_render_metrics.success_count is 'Number of successful render attempts.';
comment on column public.template_render_metrics.failure_count is 'Number of failed render attempts.';
comment on column public.template_render_metrics.total_render_ms is 'Sum of recorded render durations in milliseconds.';
comment on column public.template_render_metrics.render_samples is 'Count of render attempts that reported a duration.';
comment on column public.template_render_metrics.failure_rate is 'Proportion of render attempts that failed.';
comment on column public.template_render_metrics.average_render_ms is 'Average render duration in milliseconds where timings are available.';
