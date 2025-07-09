-- Fix Subscription Schema
-- Run this in your Supabase SQL editor to add missing subscription columns

-- 1. Add subscription columns to existing users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'pro_plus', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS builds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remixes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS builds_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS remixes_limit INTEGER DEFAULT 3;

-- 2. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_customer_id ON users(lemon_squeezy_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_subscription_id ON users(lemon_squeezy_subscription_id);

-- 3. Update existing users to have free tier by default if not set
UPDATE users 
SET subscription_tier = 'free', 
    subscription_status = 'active',
    builds_limit = 5,
    remixes_limit = 3
WHERE subscription_tier IS NULL;

-- 4. Create user_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- 5. Create subscription_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lemon_squeezy_order_id TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on new tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can view their own transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON subscription_transactions;

-- 8. Create RLS policies for new tables
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can view their own transactions" ON subscription_transactions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can insert their own transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

-- 9. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_lemon_squeezy_order_id ON subscription_transactions(lemon_squeezy_order_id);

-- 10. Initialize user usage for existing users
INSERT INTO user_usage (user_id, usage_date, builds_used, remixes_used)
SELECT id, CURRENT_DATE, 0, 0
FROM users
WHERE id NOT IN (SELECT user_id FROM user_usage WHERE usage_date = CURRENT_DATE)
ON CONFLICT (user_id, usage_date) DO NOTHING;

-- 11. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('subscription_tier', 'subscription_status', 'lemon_squeezy_customer_id', 'lemon_squeezy_subscription_id', 'builds_used', 'remixes_used', 'builds_limit', 'remixes_limit')
ORDER BY column_name; 