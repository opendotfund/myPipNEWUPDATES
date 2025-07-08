-- Add missing subscription columns to existing users table
-- Run this in your Supabase SQL editor if the columns don't exist

-- Add subscription-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS builds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remixes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS builds_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS remixes_limit INTEGER DEFAULT 3;

-- Create user_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Create subscription_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lemon_squeezy_order_id TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_affiliates table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  referral_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY IF NOT EXISTS "Users can view their own usage" ON user_usage
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their own usage" ON user_usage
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can view their own affiliates" ON user_affiliates
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert their own affiliates" ON user_affiliates
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_user_id ON user_affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_affiliate_code ON user_affiliates(affiliate_code);

-- Update existing users to have free tier by default
UPDATE users 
SET subscription_tier = 'free', 
    subscription_status = 'active',
    builds_limit = 5,
    remixes_limit = 3
WHERE subscription_tier IS NULL;

-- Initialize user usage for existing users
INSERT INTO user_usage (user_id, usage_date, builds_used, remixes_used)
SELECT id, CURRENT_DATE, 0, 0
FROM users
WHERE id NOT IN (SELECT user_id FROM user_usage WHERE usage_date = CURRENT_DATE)
ON CONFLICT (user_id, usage_date) DO NOTHING; 