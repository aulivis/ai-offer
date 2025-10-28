-- Create a table for storing reusable offer text templates per user.
create table if not exists public.offer_text_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.offer_text_templates is 'Reusable offer text templates for quickly filling the offer wizard.';

create index if not exists offer_text_templates_user_id_idx on public.offer_text_templates (user_id);
create index if not exists offer_text_templates_updated_at_idx on public.offer_text_templates (updated_at desc);

create or replace function public.handle_offer_text_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.offer_text_templates;
create trigger set_updated_at
before update on public.offer_text_templates
for each row
execute function public.handle_offer_text_templates_updated_at();

alter table public.offer_text_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_text_templates'
      and policyname = 'Users can insert their text templates'
  ) then
    create policy "Users can insert their text templates"
      on public.offer_text_templates
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_text_templates'
      and policyname = 'Users can view their text templates'
  ) then
    create policy "Users can view their text templates"
      on public.offer_text_templates
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_text_templates'
      and policyname = 'Users can update their text templates'
  ) then
    create policy "Users can update their text templates"
      on public.offer_text_templates
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'offer_text_templates'
      and policyname = 'Users can delete their text templates'
  ) then
    create policy "Users can delete their text templates"
      on public.offer_text_templates
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;
