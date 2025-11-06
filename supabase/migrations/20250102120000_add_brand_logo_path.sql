-- Migration: Add brand_logo_path column and migrate existing URLs to paths
-- This fixes the signed URL expiration issue by storing storage paths instead of URLs

-- Add brand_logo_path column to store the storage path (e.g., "{userId}/brand-logo.png")
alter table public.profiles
  add column if not exists brand_logo_path text;

-- Migrate existing brand_logo_url values to brand_logo_path
-- Extract path from signed URLs or infer from URL structure
DO $$
DECLARE
  profile_record RECORD;
  extracted_path text;
  url_path text;
BEGIN
  FOR profile_record IN 
    SELECT id, brand_logo_url 
    FROM public.profiles 
    WHERE brand_logo_url IS NOT NULL 
      AND brand_logo_url != ''
      AND brand_logo_path IS NULL
  LOOP
    -- Try to extract path from signed URL
    -- Supabase signed URLs typically contain the path in the format:
    -- https://{project}.supabase.co/storage/v1/object/sign/brand-assets/{path}?token=...
    url_path := profile_record.brand_logo_url;
    
    -- Extract path between '/brand-assets/' and '?' or end of string
    IF url_path LIKE '%/brand-assets/%' THEN
      extracted_path := substring(
        url_path 
        FROM '%/brand-assets/([^?]+)'
      );
      
      IF extracted_path IS NOT NULL AND extracted_path != '' THEN
        -- Decode URL encoding if present
        extracted_path := replace(extracted_path, '%2F', '/');
        extracted_path := replace(extracted_path, '%20', ' ');
        
        -- Update the profile with the extracted path
        UPDATE public.profiles
        SET brand_logo_path = extracted_path
        WHERE id = profile_record.id;
      ELSE
        -- If extraction fails, try to infer from user ID
        -- Format: {userId}/brand-logo.{ext}
        -- We'll use a common pattern - if URL contains user ID, construct path
        IF url_path LIKE '%' || profile_record.id::text || '%' THEN
          -- Try common extensions
          IF url_path LIKE '%.png%' OR url_path LIKE '%image/png%' THEN
            extracted_path := profile_record.id::text || '/brand-logo.png';
          ELSIF url_path LIKE '%.jpg%' OR url_path LIKE '%.jpeg%' OR url_path LIKE '%image/jpeg%' THEN
            extracted_path := profile_record.id::text || '/brand-logo.jpg';
          ELSIF url_path LIKE '%.svg%' OR url_path LIKE '%image/svg%' THEN
            extracted_path := profile_record.id::text || '/brand-logo.svg';
          ELSE
            -- Default to PNG
            extracted_path := profile_record.id::text || '/brand-logo.png';
          END IF;
          
          UPDATE public.profiles
          SET brand_logo_path = extracted_path
          WHERE id = profile_record.id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END
$$;

-- Add comment explaining the column purpose
comment on column public.profiles.brand_logo_path is 
  'Storage path for brand logo (e.g., "{userId}/brand-logo.png"). Signed URLs are generated on-demand to avoid expiration issues.';

-- Keep brand_logo_url column for backward compatibility during migration period
-- It will be deprecated and removed in a future migration




