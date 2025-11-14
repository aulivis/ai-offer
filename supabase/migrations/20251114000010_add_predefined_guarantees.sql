-- Add predefined guarantees and activity attachments

-- Create guarantees table
CREATE TABLE IF NOT EXISTS guarantees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE guarantees IS 'User-defined guarantee snippets that can be inserted into offers';
COMMENT ON COLUMN guarantees.text IS 'Guarantee copy shown in the offer';

-- Ensure text has a reasonable length (max 500 chars)
ALTER TABLE guarantees
  DROP CONSTRAINT IF EXISTS guarantees_text_length_check;

ALTER TABLE guarantees
  ADD CONSTRAINT guarantees_text_length_check
  CHECK (char_length(text) BETWEEN 3 AND 500);

CREATE INDEX IF NOT EXISTS idx_guarantees_user_id ON guarantees(user_id);
CREATE INDEX IF NOT EXISTS idx_guarantees_created_at ON guarantees(created_at DESC);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_guarantees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_guarantees_updated_at ON guarantees;
CREATE TRIGGER trigger_update_guarantees_updated_at
  BEFORE UPDATE ON guarantees
  FOR EACH ROW
  EXECUTE FUNCTION update_guarantees_updated_at();

-- Create junction table between activities and guarantees
CREATE TABLE IF NOT EXISTS activity_guarantees (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  guarantee_id UUID NOT NULL REFERENCES guarantees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (activity_id, guarantee_id)
);

COMMENT ON TABLE activity_guarantees IS 'Links guarantees to default activities so they can be suggested automatically';

CREATE INDEX IF NOT EXISTS idx_activity_guarantees_user_id ON activity_guarantees(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_guarantees_activity_id ON activity_guarantees(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_guarantees_guarantee_id ON activity_guarantees(guarantee_id);

-- Enable RLS
ALTER TABLE guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_guarantees ENABLE ROW LEVEL SECURITY;

-- Guarantees policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guarantees' AND policyname = 'Users can view their guarantees'
  ) THEN
    CREATE POLICY "Users can view their guarantees"
      ON guarantees
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guarantees' AND policyname = 'Users can insert their guarantees'
  ) THEN
    CREATE POLICY "Users can insert their guarantees"
      ON guarantees
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guarantees' AND policyname = 'Users can update their guarantees'
  ) THEN
    CREATE POLICY "Users can update their guarantees"
      ON guarantees
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'guarantees' AND policyname = 'Users can delete their guarantees'
  ) THEN
    CREATE POLICY "Users can delete their guarantees"
      ON guarantees
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Activity guarantees policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_guarantees' AND policyname = 'Users can view their activity guarantees'
  ) THEN
    CREATE POLICY "Users can view their activity guarantees"
      ON activity_guarantees
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_guarantees' AND policyname = 'Users can insert their activity guarantees'
  ) THEN
    CREATE POLICY "Users can insert their activity guarantees"
      ON activity_guarantees
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activity_guarantees' AND policyname = 'Users can delete their activity guarantees'
  ) THEN
    CREATE POLICY "Users can delete their activity guarantees"
      ON activity_guarantees
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

