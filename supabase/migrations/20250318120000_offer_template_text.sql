-- Ensure the profiles.offer_template column accepts the string identifiers used by the app.
-- Convert the column to text if it already exists with a different type, otherwise create it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'offer_template'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'offer_template'
        AND data_type <> 'text'
    ) THEN
      ALTER TABLE profiles
        ALTER COLUMN offer_template TYPE text USING offer_template::text;
    END IF;
  ELSE
    ALTER TABLE profiles
      ADD COLUMN offer_template text;
  END IF;
END $$;

-- Normalise existing values so that unknown/legacy values fall back to the modern template.
UPDATE profiles
   SET offer_template = 'premium-banner'
 WHERE offer_template IN ('premium', 'premium_banner');

UPDATE profiles
   SET offer_template = 'modern'
 WHERE offer_template IS NULL
    OR offer_template NOT IN ('modern', 'premium-banner');
