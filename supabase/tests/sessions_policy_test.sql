-- Coverage for sessions table policies.
-- Ensures service role retains full control while authenticated users may
-- only manage their own sessions, including revoked and rotated entries.

BEGIN;

DO $$
DECLARE
  user_one uuid := '00000000-0000-0000-0000-00000000b001';
  user_two uuid := '00000000-0000-0000-0000-00000000b002';
  session_one uuid;
  session_two uuid;
  session_three uuid;
  visible_count integer;
  updated_hash text;
BEGIN
  -- Service role seeds fixtures and can mutate hashed tokens.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  DELETE FROM public.sessions WHERE user_id IN (user_one, user_two);

  INSERT INTO public.sessions (user_id, rt_hash, issued_at, expires_at, revoked_at)
  VALUES (user_one, 'hash-one', now(), now() + interval '1 day', NULL)
  RETURNING id INTO session_one;

  INSERT INTO public.sessions (user_id, rt_hash, issued_at, expires_at, revoked_at)
  VALUES (user_two, 'hash-two', now(), now() + interval '1 day', now())
  RETURNING id INTO session_two;

  INSERT INTO public.sessions (user_id, rt_hash, issued_at, expires_at, rotated_from)
  VALUES (user_two, 'hash-two-rotated', now(), now() + interval '1 day', session_two)
  RETURNING id INTO session_three;

  UPDATE public.sessions
     SET rt_hash = 'hash-one-updated'
   WHERE id = session_one;

  SELECT rt_hash INTO updated_hash
    FROM public.sessions
   WHERE id = session_one;

  IF updated_hash <> 'hash-one-updated' THEN
    RAISE EXCEPTION 'Service role failed to update hashed token, found %', updated_hash;
  END IF;

  SELECT count(*) INTO visible_count
    FROM public.sessions
   WHERE user_id IN (user_one, user_two);

  IF visible_count <> 3 THEN
    RAISE EXCEPTION 'Service role should see all sessions, saw %', visible_count;
  END IF;

  -- Authenticated user_one can only access their session.
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_one::text, true);

  SELECT count(*) INTO visible_count
    FROM public.sessions;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Authenticated user should only see their session, saw %', visible_count;
  END IF;

  SELECT count(*) INTO visible_count
    FROM public.sessions
   WHERE user_id = user_two;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Authenticated user unexpectedly saw another user''s session (% rows)', visible_count;
  END IF;

  UPDATE public.sessions
     SET revoked_at = now()
   WHERE id = session_one;

  BEGIN
    UPDATE public.sessions
       SET revoked_at = NULL
     WHERE id = session_two;
    RAISE EXCEPTION 'Authenticated user updated another user''s revoked session';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  BEGIN
    DELETE FROM public.sessions
     WHERE id = session_two;
    RAISE EXCEPTION 'Authenticated user deleted another user''s revoked session';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  BEGIN
    UPDATE public.sessions
       SET rotated_from = NULL
     WHERE id = session_three;
    RAISE EXCEPTION 'Authenticated user updated another user''s rotated session';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  DELETE FROM public.sessions
   WHERE id = session_one;

  SELECT count(*) INTO visible_count
    FROM public.sessions
   WHERE user_id = user_one;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Authenticated user failed to delete own session';
  END IF;

  -- Switch to user_two to ensure revoked/rotated sessions remain scoped per owner.
  PERFORM set_config('request.jwt.claim.sub', user_two::text, true);

  SELECT count(*) INTO visible_count
    FROM public.sessions;

  IF visible_count <> 2 THEN
    RAISE EXCEPTION 'User two should only see their sessions, saw %', visible_count;
  END IF;

  UPDATE public.sessions
     SET rotated_from = NULL
   WHERE id = session_three;

  -- Service role can still clean up everything.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  DELETE FROM public.sessions
   WHERE user_id IN (user_one, user_two);

  PERFORM set_config('request.jwt.claim.role', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
END
$$;

ROLLBACK;
