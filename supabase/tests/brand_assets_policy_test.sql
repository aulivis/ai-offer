-- Regression verification for brand asset storage policies.
-- Ensures tenants can only read their own files within the brand-assets bucket.

BEGIN;

DO $$
DECLARE
  tenant_one uuid := '00000000-0000-0000-0000-000000000001';
  tenant_two uuid := '00000000-0000-0000-0000-000000000002';
  object_one text := tenant_one::text || '/policy-verification-logo.png';
  object_two text := tenant_two::text || '/policy-verification-logo.png';
  visible_count integer;
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES
    ('brand-assets', object_one, tenant_one),
    ('brand-assets', object_two, tenant_two);

  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', tenant_one::text, true);

  SELECT count(*) INTO visible_count
    FROM storage.objects
   WHERE bucket_id = 'brand-assets';

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Tenant % should only see 1 asset but saw %', tenant_one, visible_count;
  END IF;

  SELECT count(*) INTO visible_count
    FROM storage.objects
   WHERE bucket_id = 'brand-assets'
     AND owner = tenant_two;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Tenant % can see % assets owned by tenant %', tenant_one, visible_count, tenant_two;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', tenant_two::text, true);

  SELECT count(*) INTO visible_count
    FROM storage.objects
   WHERE bucket_id = 'brand-assets';

  IF visible_count <> 1 THEN
    RAISE EXCEPTION 'Tenant % should only see 1 asset but saw %', tenant_two, visible_count;
  END IF;

  SELECT count(*) INTO visible_count
    FROM storage.objects
   WHERE bucket_id = 'brand-assets'
     AND owner = tenant_one;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'Tenant % can see % assets owned by tenant %', tenant_two, visible_count, tenant_one;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', NULL, true);
  PERFORM set_config('request.jwt.claim.role', NULL, true);
END
$$;

ROLLBACK;
