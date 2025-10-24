-- Regression coverage for device usage counter policies.
-- Validates that authenticated tenants can only view and mutate their own
-- device counters while the service role retains unrestricted access.

BEGIN;

DO $$
DECLARE
  user_one uuid := '00000000-0000-0000-0000-00000000d001';
  user_two uuid := '00000000-0000-0000-0000-00000000d002';
  device_one text := 'device-one';
  device_two text := 'device-two';
  period date := current_date;
  own_initial integer := 1;
  other_initial integer := 5;
  visible_count integer;
  updated_offers integer;
  rpc_offers integer;
  rpc_allowed boolean;
BEGIN
  -- Service role seeds fixture rows.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  DELETE FROM public.device_usage_counters
   WHERE (user_id, device_id) IN ((user_one, device_one), (user_two, device_two));

  INSERT INTO public.device_usage_counters (user_id, device_id, period_start, offers_generated)
  VALUES
    (user_one, device_one, period, own_initial),
    (user_two, device_two, period, other_initial)
  ON CONFLICT (user_id, device_id) DO UPDATE
    SET period_start = EXCLUDED.period_start,
        offers_generated = EXCLUDED.offers_generated;

  -- Worker enforcement increments via the RPC using the explicit owner id.
  SELECT allowed,
         offers_generated
    INTO rpc_allowed,
         rpc_offers
    FROM public.check_and_increment_device_usage(user_one, device_one, 10, period);

  IF NOT rpc_allowed THEN
    RAISE EXCEPTION 'Device usage RPC should allow incrementing owned row';
  END IF;

  IF rpc_offers <> own_initial + 1 THEN
    RAISE EXCEPTION 'Device usage RPC expected offers %, found %', own_initial + 1, rpc_offers;
  END IF;

  -- Switch to authenticated perspective for the first tenant.
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_one::text, true);

  SELECT count(*)
    INTO visible_count
    FROM public.device_usage_counters;

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Authenticated tenant should only see their own device rows, saw %', visible_count;
  END IF;

  SELECT count(*)
    INTO visible_count
    FROM public.device_usage_counters
   WHERE user_id = user_two;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Authenticated tenant unexpectedly saw another device row (% rows)', visible_count;
  END IF;

  BEGIN
    INSERT INTO public.device_usage_counters (user_id, device_id, period_start, offers_generated)
    VALUES (user_two, device_two, period, 42);
    RAISE EXCEPTION 'Authenticated tenant inserted another user''s device counter';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  BEGIN
    UPDATE public.device_usage_counters
       SET offers_generated = 99
     WHERE user_id = user_two
       AND device_id = device_two;
    RAISE EXCEPTION 'Authenticated tenant updated another user''s device counter';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  UPDATE public.device_usage_counters
     SET offers_generated = offers_generated + 1
   WHERE user_id = user_one
     AND device_id = device_one;

  SELECT offers_generated
    INTO updated_offers
    FROM public.device_usage_counters
   WHERE user_id = user_one
     AND device_id = device_one;

  IF updated_offers <> rpc_offers + 1 THEN
    RAISE EXCEPTION 'Authenticated tenant expected offers %, found %', rpc_offers + 1, updated_offers;
  END IF;

  -- Service role can still view and clean up every row.
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  SELECT count(*)
    INTO visible_count
    FROM public.device_usage_counters
   WHERE (user_id, device_id) IN ((user_one, device_one), (user_two, device_two));

  IF visible_count <> 2 THEN
    RAISE EXCEPTION 'Service role should see both rows, saw %', visible_count;
  END IF;

  DELETE FROM public.device_usage_counters
   WHERE (user_id, device_id) IN ((user_one, device_one), (user_two, device_two));

  PERFORM set_config('request.jwt.claim.role', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
END
$$;

ROLLBACK;
