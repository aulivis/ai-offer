-- Regression coverage for usage counter policies.
-- Ensures authenticated users only interact with their own rows and the service role
-- retains unrestricted access for background jobs.

BEGIN;

DO $$
DECLARE
  user_one uuid := '00000000-0000-0000-0000-00000000a001';
  user_two uuid := '00000000-0000-0000-0000-00000000a002';
  period date := current_date;
  own_initial integer := 1;
  other_initial integer := 5;
  visible_count integer;
  updated_offers integer;
BEGIN
  -- Service role can seed fixture rows.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  DELETE FROM public.usage_counters WHERE user_id IN (user_one, user_two);

  INSERT INTO public.usage_counters (user_id, period_start, offers_generated)
  VALUES
    (user_one, period, own_initial),
    (user_two, period, other_initial)
  ON CONFLICT (user_id) DO UPDATE
    SET period_start = EXCLUDED.period_start,
        offers_generated = EXCLUDED.offers_generated;

  -- Switch to an authenticated tenant perspective.
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_one::text, true);

  SELECT count(*) INTO visible_count
    FROM public.usage_counters;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Authenticated tenant should only see their own row, saw %', visible_count;
  END IF;

  SELECT count(*) INTO visible_count
    FROM public.usage_counters
   WHERE user_id = user_two;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Authenticated tenant unexpectedly saw another user''s row (% rows)', visible_count;
  END IF;

  BEGIN
    INSERT INTO public.usage_counters (user_id, period_start, offers_generated)
    VALUES (user_two, period, 99);
    RAISE EXCEPTION 'Authenticated tenant inserted another user''s usage row';
  EXCEPTION
    WHEN others THEN
      -- Expected: RLS rejects the insert.
      NULL;
  END;

  BEGIN
    UPDATE public.usage_counters
       SET offers_generated = 42
     WHERE user_id = user_two;
    RAISE EXCEPTION 'Authenticated tenant updated another user''s usage row';
  EXCEPTION
    WHEN others THEN
      -- Expected: RLS rejects the update.
      NULL;
  END;

  UPDATE public.usage_counters
     SET offers_generated = offers_generated + 1
   WHERE user_id = user_one;

  SELECT offers_generated INTO updated_offers
    FROM public.usage_counters
   WHERE user_id = user_one;

  IF updated_offers <> own_initial + 1 THEN
    RAISE EXCEPTION 'Authenticated tenant expected offers %, found %', own_initial + 1, updated_offers;
  END IF;

  -- Service role can still view and clean up every row.
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  SELECT count(*) INTO visible_count
    FROM public.usage_counters
   WHERE user_id IN (user_one, user_two);

  IF visible_count <> 2 THEN
    RAISE EXCEPTION 'Service role should see both rows, saw %', visible_count;
  END IF;

  DELETE FROM public.usage_counters WHERE user_id IN (user_one, user_two);

  PERFORM set_config('request.jwt.claim.role', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
END
$$;

ROLLBACK;
