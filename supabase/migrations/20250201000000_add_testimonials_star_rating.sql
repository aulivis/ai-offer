-- Migration: Add star rating and star style to testimonials
-- This allows users to add star ratings (1-5) with 3 different star styles to testimonials

-- Add star_rating column (1-5)
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS star_rating INTEGER CHECK (star_rating IS NULL OR (star_rating >= 1 AND star_rating <= 5));

-- Add star_style column (3 styles: 'filled', 'outlined', 'solid')
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS star_style TEXT CHECK (star_style IS NULL OR star_style IN ('filled', 'outlined', 'solid'));

-- Add comments
COMMENT ON COLUMN testimonials.star_rating IS 'Star rating from 1 to 5 (optional)';
COMMENT ON COLUMN testimonials.star_style IS 'Star style: filled, outlined, or solid (optional)';








