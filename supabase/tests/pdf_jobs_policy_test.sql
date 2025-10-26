-- Regression coverage for pdf_jobs table policies.
-- Ensures authenticated users are constrained to their own jobs while
-- the service role retains full visibility for worker coordination.

BEGIN;

DO $$
DECLARE
  user_one uuid := '00000000-0000-0000-0000-00000000c001';
  user_two uuid := '00000000-0000-0000-0000-00000000c002';
  offer_one uuid := '10000000-0000-0000-0000-00000000c001';
  offer_two uuid := '20000000-0000-0000-0000-00000000c002';
  job_one uuid := '30000000-0000-0000-0000-00000000c001';
  job_two uuid := '40000000-0000-0000-0000-00000000c002';
  visible_count integer;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  DELETE FROM public.pdf_jobs WHERE id IN (job_one, job_two);

  INSERT INTO public.pdf_jobs (
    id,
    user_id,
    offer_id,
    status,
    payload,
    storage_path,
    pdf_url,
    download_token
  )
  VALUES
    (
      job_one,
      user_one,
      offer_one,
      'completed',
      jsonb_build_object('kind', 'test'),
      'user-one/job-one.pdf',
      'https://example.com/job-one.pdf',
      'download-one'
    ),
    (
      job_two,
      user_two,
      offer_two,
      'completed',
      jsonb_build_object('kind', 'test'),
      'user-two/job-two.pdf',
      'https://example.com/job-two.pdf',
      'download-two'
    );

  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', user_one::text, true);

  SELECT count(*) INTO visible_count FROM public.pdf_jobs;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'User % should only see their job, saw % rows', user_one, visible_count;
  END IF;

  SELECT count(*) INTO visible_count
    FROM public.pdf_jobs
   WHERE user_id = user_two;
  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'User % unexpectedly saw another job (% rows)', user_one, visible_count;
  END IF;

  BEGIN
    UPDATE public.pdf_jobs SET status = 'failed' WHERE id = job_two;
    RAISE EXCEPTION 'Authenticated user updated another tenant\'s job';
  EXCEPTION
    WHEN others THEN
      NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub', user_two::text, true);

  SELECT count(*) INTO visible_count FROM public.pdf_jobs;
  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'User % should only see their job, saw % rows', user_two, visible_count;
  END IF;

  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);

  SELECT count(*) INTO visible_count FROM public.pdf_jobs;
  IF visible_count <> 2 THEN
    RAISE EXCEPTION 'Service role should see all jobs, saw %', visible_count;
  END IF;

  DELETE FROM public.pdf_jobs WHERE id IN (job_one, job_two);

  PERFORM set_config('request.jwt.claim.role', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
END
$$;

ROLLBACK;
