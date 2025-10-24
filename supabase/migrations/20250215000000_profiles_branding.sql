-- Add branding fields to profiles and ensure a public storage bucket for brand assets.
alter table profiles
  add column if not exists brand_logo_url text,
  add column if not exists brand_color_primary text,
  add column if not exists brand_color_secondary text;

insert into storage.buckets (id, name, public)
select 'brand-assets', 'brand-assets', false
where not exists (select 1 from storage.buckets where id = 'brand-assets');
