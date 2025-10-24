-- Enforce RLS policies for the sessions table.
-- Allows service role full control and restricts authenticated tenants to their own sessions.

-- Ensure service role retains privileges needed by the auth flow.
grant select, insert, update, delete on table public.sessions to service_role;

-- Service role background workers need unrestricted access.
create policy if not exists "Service role full access"
  on public.sessions
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated users can manage only their own sessions.
create policy if not exists "Authenticated users manage own sessions"
  on public.sessions
  as permissive
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Authenticated users update own sessions"
  on public.sessions
  as permissive
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Authenticated users delete own sessions"
  on public.sessions
  as permissive
  for delete
  to authenticated
  using (auth.uid() = user_id);
