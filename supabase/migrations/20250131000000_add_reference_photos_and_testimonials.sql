-- Migration: Add reference photos and testimonials features
-- This migration adds:
-- 1. Reference images column to activities table
-- 2. Testimonials table
-- 3. PRO feature toggles in profiles table

-- Add reference_images column to activities table
-- Stores up to 3 image URLs/paths per activity
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS reference_images JSONB DEFAULT '[]'::jsonb;

-- Add constraint to ensure max 3 images per activity
ALTER TABLE activities
ADD CONSTRAINT check_reference_images_limit 
CHECK (jsonb_array_length(COALESCE(reference_images, '[]'::jsonb)) <= 3);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_activity_id ON testimonials(activity_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);

-- Add RLS policies for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own testimonials
CREATE POLICY "Users can view their own testimonials"
  ON testimonials
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own testimonials
CREATE POLICY "Users can insert their own testimonials"
  ON testimonials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own testimonials
CREATE POLICY "Users can update their own testimonials"
  ON testimonials
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own testimonials
CREATE POLICY "Users can delete their own testimonials"
  ON testimonials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add PRO feature toggles to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS enable_reference_photos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_testimonials BOOLEAN DEFAULT false;

-- Add function to limit testimonials per user (max 10)
CREATE OR REPLACE FUNCTION check_testimonials_limit()
RETURNS TRIGGER AS $$
DECLARE
  testimonial_count INTEGER;
BEGIN
  -- Count existing testimonials for this user
  SELECT COUNT(*) INTO testimonial_count
  FROM testimonials
  WHERE user_id = NEW.user_id;

  -- If this is an update and the user_id hasn't changed, don't count the current row
  IF TG_OP = 'UPDATE' AND OLD.user_id = NEW.user_id THEN
    testimonial_count := testimonial_count - 1;
  END IF;

  -- Check limit
  IF testimonial_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 testimonials allowed per user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce testimonials limit
DROP TRIGGER IF EXISTS trigger_check_testimonials_limit ON testimonials;
CREATE TRIGGER trigger_check_testimonials_limit
  BEFORE INSERT OR UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION check_testimonials_limit();

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS trigger_update_testimonials_updated_at ON testimonials;
CREATE TRIGGER trigger_update_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

-- Add comment to document the features
COMMENT ON COLUMN activities.reference_images IS 'Array of up to 3 reference image URLs/paths for this activity (PRO feature)';
COMMENT ON COLUMN profiles.enable_reference_photos IS 'Toggle to enable reference photos feature (PRO feature)';
COMMENT ON COLUMN profiles.enable_testimonials IS 'Toggle to enable testimonials feature (PRO feature)';
COMMENT ON TABLE testimonials IS 'Customer testimonials/reviews that can be attached to activities (PRO feature, max 10 per user)';



