-- Migration: Create block customization preferences table
-- Stores user preferences for offer block structure customization
-- Allows users to customize block visibility, order, and welcome line text

-- Create block_customization_preferences table
create table if not exists public.block_customization_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete cascade,
  -- If offer_id is null, these are default preferences for the user
  -- If offer_id is set, these are offer-specific preferences
  
  -- Block settings stored as JSONB for flexibility
  block_settings jsonb not null default '{
    "blocks": [
      {"id": "welcome", "visible": true, "order": 0},
      {"id": "introduction", "visible": true, "order": 1},
      {"id": "project_summary", "visible": true, "order": 2},
      {"id": "value_proposition", "visible": true, "order": 3},
      {"id": "scope", "visible": true, "order": 4},
      {"id": "deliverables", "visible": true, "order": 5},
      {"id": "expected_outcomes", "visible": true, "order": 6},
      {"id": "assumptions", "visible": true, "order": 7},
      {"id": "next_steps", "visible": true, "order": 8},
      {"id": "images", "visible": true, "order": 9},
      {"id": "pricing", "visible": true, "order": 10},
      {"id": "schedule", "visible": true, "order": 11},
      {"id": "guarantees", "visible": true, "order": 12},
      {"id": "testimonials", "visible": true, "order": 13},
      {"id": "closing", "visible": true, "order": 14}
    ],
    "welcomeLineCustomization": {
      "enabled": false,
      "customText": null
    }
  }'::jsonb,
  
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

comment on table public.block_customization_preferences is 'User preferences for customizing offer block structure (visibility, order, welcome line).';
comment on column public.block_customization_preferences.user_id is 'User who owns these preferences.';
comment on column public.block_customization_preferences.offer_id is 'If set, these are offer-specific preferences. If null, these are default user preferences.';
comment on column public.block_customization_preferences.block_settings is 'JSONB object containing block visibility, order, and welcome line customization settings.';

-- Create indexes
create index if not exists idx_block_customization_preferences_user_id 
  on public.block_customization_preferences(user_id);

create index if not exists idx_block_customization_preferences_offer_id 
  on public.block_customization_preferences(offer_id) 
  where offer_id is not null;

-- Create unique indexes for constraints (PostgreSQL doesn't support WHERE in constraint definitions)
-- Ensure one default preference per user
create unique index if not exists idx_block_customization_preferences_unique_user_default
  on public.block_customization_preferences(user_id)
  where offer_id is null;

-- Ensure one preference per offer
create unique index if not exists idx_block_customization_preferences_unique_offer
  on public.block_customization_preferences(offer_id)
  where offer_id is not null;

-- Enable RLS
alter table public.block_customization_preferences enable row level security;

-- Policy: Users can select their own preferences
create policy "Users can select their own block preferences"
  on public.block_customization_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
create policy "Users can insert their own block preferences"
  on public.block_customization_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can update their own preferences
create policy "Users can update their own block preferences"
  on public.block_customization_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own preferences
create policy "Users can delete their own block preferences"
  on public.block_customization_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Grant permissions
grant select, insert, update, delete on table public.block_customization_preferences to authenticated;
grant all on table public.block_customization_preferences to service_role;

-- Create function to update updated_at timestamp
create or replace function public.update_block_customization_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Create trigger
drop trigger if exists update_block_customization_preferences_updated_at on public.block_customization_preferences;
create trigger update_block_customization_preferences_updated_at
  before update on public.block_customization_preferences
  for each row
  execute function public.update_block_customization_preferences_updated_at();

