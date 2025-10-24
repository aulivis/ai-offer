create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rt_hash text not null,
  issued_at timestamp with time zone not null,
  expires_at timestamp with time zone not null,
  rotated_from uuid references public.sessions (id),
  revoked_at timestamp with time zone,
  ip text,
  ua text
);

create unique index if not exists sessions_rt_hash_idx on public.sessions (rt_hash);
create index if not exists sessions_user_id_idx on public.sessions (user_id);

alter table public.sessions enable row level security;
