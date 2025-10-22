-- Create table to track PDF generation jobs and ensure appropriate access policies.
create table if not exists public.pdf_jobs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  offer_id uuid not null references public.offers (id) on delete cascade,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  payload jsonb not null,
  error_message text,
  storage_path text not null,
  pdf_url text,
  callback_url text,
  download_token text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.pdf_jobs is 'Queue of PDF rendering jobs processed by the Edge Function worker.';

create index if not exists pdf_jobs_user_id_idx on public.pdf_jobs (user_id);
create index if not exists pdf_jobs_status_idx on public.pdf_jobs (status);
create index if not exists pdf_jobs_offer_id_idx on public.pdf_jobs (offer_id);

-- Helper trigger to keep updated_at current.
create or replace function public.handle_pdf_jobs_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.pdf_jobs;
create trigger set_updated_at
before update on public.pdf_jobs
for each row
execute function public.handle_pdf_jobs_updated_at();

alter table public.pdf_jobs enable row level security;

-- Users can insert their own PDF jobs.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pdf_jobs'
      and policyname = 'Users can enqueue their own pdf jobs'
  ) then
    create policy "Users can enqueue their own pdf jobs"
      on public.pdf_jobs
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Users can read jobs they own.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pdf_jobs'
      and policyname = 'Users can view their own pdf jobs'
  ) then
    create policy "Users can view their own pdf jobs"
      on public.pdf_jobs
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

-- Allow the service role (used by the Edge Function) to update any job.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pdf_jobs'
      and policyname = 'Service role can update pdf jobs'
  ) then
    create policy "Service role can update pdf jobs"
      on public.pdf_jobs
      for update
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

