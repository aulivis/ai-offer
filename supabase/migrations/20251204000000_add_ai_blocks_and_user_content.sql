-- Add structured AI blocks and user-provided content columns to offers table
-- This migration supports the new dynamic template variable system

-- Add ai_blocks column for structured AI response blocks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offers'
      AND column_name = 'ai_blocks'
  ) THEN
    ALTER TABLE public.offers
      ADD COLUMN ai_blocks JSONB NOT NULL DEFAULT '{}';
    
    COMMENT ON COLUMN public.offers.ai_blocks IS 'Structured AI-generated content blocks (introduction, deliverables, etc.)';
  END IF;
END $$;

-- Add schedule column for user-provided schedule items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offers'
      AND column_name = 'schedule'
  ) THEN
    ALTER TABLE public.offers
      ADD COLUMN schedule TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    
    COMMENT ON COLUMN public.offers.schedule IS 'User-provided schedule items (not AI-generated)';
  END IF;
END $$;

-- Add testimonials column for user-provided testimonials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offers'
      AND column_name = 'testimonials'
  ) THEN
    ALTER TABLE public.offers
      ADD COLUMN testimonials TEXT[] DEFAULT NULL;
    
    COMMENT ON COLUMN public.offers.testimonials IS 'User-provided testimonials (not AI-generated)';
  END IF;
END $$;

-- Add guarantees column for user-provided guarantees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'offers'
      AND column_name = 'guarantees'
  ) THEN
    ALTER TABLE public.offers
      ADD COLUMN guarantees TEXT[] DEFAULT NULL;
    
    COMMENT ON COLUMN public.offers.guarantees IS 'User-provided guarantees (not AI-generated)';
  END IF;
END $$;

-- Create GIN index for ai_blocks JSONB queries
CREATE INDEX IF NOT EXISTS idx_offers_ai_blocks 
  ON public.offers USING GIN (ai_blocks);

-- Create index for schedule array queries (if needed)
CREATE INDEX IF NOT EXISTS idx_offers_schedule 
  ON public.offers USING GIN (schedule);



