-- Migration: Create template versions table
-- Stores versioned templates with semantic versioning support
-- Allows template versioning, rollback, and preview

-- Create template_versions table
create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id text not null, -- e.g., 'free.classic', 'premium.luxury'
  version text not null, -- Semantic version: major.minor.patch (e.g., '1.2.3')
  content text not null, -- Template HTML/content
  changelog text, -- Description of changes in this version
  is_active boolean not null default false, -- Only one version per template can be active
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  
  -- Ensure unique version per template
  constraint unique_template_version unique (template_id, version),
  -- Ensure valid semantic version format (major.minor.patch)
  constraint valid_version_format check (version ~ '^\d+\.\d+\.\d+$')
);

comment on table public.template_versions is 'Versioned templates with semantic versioning support.';
comment on column public.template_versions.template_id is 'Template identifier (e.g., free.classic, premium.luxury).';
comment on column public.template_versions.version is 'Semantic version in major.minor.patch format.';
comment on column public.template_versions.content is 'Template HTML/content for this version.';
comment on column public.template_versions.changelog is 'Description of changes in this version.';
comment on column public.template_versions.is_active is 'Whether this version is currently active. Only one version per template can be active.';

-- Create indexes
create index if not exists idx_template_versions_template_id 
  on public.template_versions(template_id);

create index if not exists idx_template_versions_is_active 
  on public.template_versions(template_id, is_active) 
  where is_active = true;

create index if not exists idx_template_versions_created_at 
  on public.template_versions(created_at desc);

-- Enable RLS
alter table public.template_versions enable row level security;

-- Policy: Authenticated users can read all template versions (templates are shared)
create policy "Users can read template versions"
  on public.template_versions
  for select
  to authenticated
  using (true);

-- Policy: Only admins can insert template versions
-- Note: Admin check should be done in application layer
create policy "Admins can insert template versions"
  on public.template_versions
  for insert
  to authenticated
  with check (true); -- RLS check done in application layer

-- Policy: Only admins can update template versions
create policy "Admins can update template versions"
  on public.template_versions
  for update
  to authenticated
  using (true) -- RLS check done in application layer
  with check (true);

-- Policy: Only admins can delete template versions
create policy "Admins can delete template versions"
  on public.template_versions
  for delete
  to authenticated
  using (true); -- RLS check done in application layer

-- Grant permissions
grant select on table public.template_versions to authenticated;
grant all on table public.template_versions to service_role;

-- Create function to ensure only one active version per template
create or replace function public.ensure_single_active_template_version()
returns trigger
language plpgsql
as $$
begin
  -- If setting a version to active, deactivate all other versions for this template
  if new.is_active = true and (old.is_active is null or old.is_active = false) then
    update public.template_versions
    set is_active = false
    where template_id = new.template_id
      and id != new.id
      and is_active = true;
  end if;
  
  return new;
end;
$$;

-- Create trigger
drop trigger if exists ensure_single_active_template_version on public.template_versions;
create trigger ensure_single_active_template_version
  before insert or update on public.template_versions
  for each row
  execute function public.ensure_single_active_template_version();

-- Create function to update updated_at timestamp
create or replace function public.update_template_versions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Create trigger
drop trigger if exists update_template_versions_updated_at on public.template_versions;
create trigger update_template_versions_updated_at
  before update on public.template_versions
  for each row
  execute function public.update_template_versions_updated_at();




