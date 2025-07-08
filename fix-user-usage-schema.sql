-- Fix User Usage Schema - Resolves UUID vs TEXT mismatch
-- Run this in your Supabase SQL editor

-- Drop existing user_usage table if it exists (to avoid conflicts)
DROP TABLE IF EXISTS user_usage CASCADE;

-- Create user_usage table with correct schema - references clerk_id (TEXT) instead of UUID
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create helper function to get or create user usage
CREATE OR REPLACE FUNCTION get_or_create_user_usage(user_clerk_id TEXT)
RETURNS user_usage AS $$
DECLARE
  current_month TEXT;
  usage_record user_usage;
BEGIN
  current_month := to_char(current_date, 'YYYY-MM');
  
  -- Try to get existing usage record
  SELECT * INTO usage_record 
  FROM user_usage 
  WHERE user_id = user_clerk_id AND month = current_month;
  
  -- If no record exists, create one
  IF usage_record IS NULL THEN
    INSERT INTO user_usage (user_id, month, builds_used, remixes_used)
    VALUES (user_clerk_id, current_month, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to increment user usage
CREATE OR REPLACE FUNCTION increment_user_usage(user_clerk_id TEXT, usage_type TEXT)
RETURNS user_usage AS $$
DECLARE
  current_month TEXT;
  usage_record user_usage;
BEGIN
  current_month := to_char(current_date, 'YYYY-MM');
  
  -- Get or create usage record
  SELECT * INTO usage_record 
  FROM user_usage 
  WHERE user_id = user_clerk_id AND month = current_month;
  
  -- If no record exists, create one
  IF usage_record IS NULL THEN
    INSERT INTO user_usage (user_id, month, builds_used, remixes_used)
    VALUES (user_clerk_id, current_month, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  -- Increment the appropriate counter
  IF usage_type = 'build' THEN
    UPDATE user_usage 
    SET builds_used = builds_used + 1, updated_at = NOW()
    WHERE user_id = user_clerk_id AND month = current_month
    RETURNING * INTO usage_record;
  ELSIF usage_type = 'remix' THEN
    UPDATE user_usage 
    SET remixes_used = remixes_used + 1, updated_at = NOW()
    WHERE user_id = user_clerk_id AND month = current_month
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 