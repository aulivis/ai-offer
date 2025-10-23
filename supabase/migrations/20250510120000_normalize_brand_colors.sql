-- Normalize stored brand colors to lowercase #rrggbb format so they comply with
-- the database constraints enforced in production.
UPDATE profiles
   SET brand_color_primary = lower(brand_color_primary)
 WHERE brand_color_primary IS NOT NULL
   AND brand_color_primary ~* '^#[0-9A-F]{6}$';

UPDATE profiles
   SET brand_color_secondary = lower(brand_color_secondary)
 WHERE brand_color_secondary IS NOT NULL
   AND brand_color_secondary ~* '^#[0-9A-F]{6}$';
