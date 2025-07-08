-- Fix User Synchronization Issues and Add Subscription Management
-- Run this in your Supabase SQL editor

-- 1. First, let's check if the users table exists and has the right structure
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_lemon_squeezy_customer_id ON users(lemon_squeezy_customer_id);

-- 3. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on clerk_id" ON users;

-- 5. Create new policies that work with Clerk authentication
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on clerk_id" ON users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 6. Create user_referral_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create referral_visits table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create referral_conversions table if it doesn't exist
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  customer_email TEXT,
  order_amount DECIMAL(10,2),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create subscription_plans table for Lemon Squeezy integration
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL UNIQUE,
  lemon_squeezy_variant_id TEXT,
  price DECIMAL(10,2) NOT NULL,
  builds_limit INTEGER,
  remixes_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create subscription_transactions table
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lemon_squeezy_order_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  plan_tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Enable RLS on all tables
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- 12. Create policies for referral tables
CREATE POLICY "Users can view their own referral codes" ON user_referral_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own referral codes" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for referral visits" ON referral_visits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for referral visits" ON referral_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for referral conversions" ON referral_conversions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for referral conversions" ON referral_conversions
  FOR INSERT WITH CHECK (true);

-- 13. Create policies for subscription tables
CREATE POLICY "Enable read access for subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for subscription transactions" ON subscription_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for subscription transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 14. Create indexes for all tables
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_referral_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_referral_code ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referral_code ON referral_conversions(referral_code);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_lemon_squeezy_order_id ON subscription_transactions(lemon_squeezy_order_id);

-- 15. Insert default subscription plans
INSERT INTO subscription_plans (name, tier, price, builds_limit, remixes_limit) VALUES
  ('Basic', 'basic', 0.00, 5, 2),
  ('Pro', 'pro', 19.99, 50, 20),
  ('Enterprise', 'enterprise', 49.99, 200, 100)
ON CONFLICT (tier) DO NOTHING;

-- 16. Create function to handle Lemon Squeezy webhook
CREATE OR REPLACE FUNCTION handle_lemon_squeezy_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by the webhook handler
  -- For now, it's a placeholder
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_referral_codes TO authenticated;
GRANT ALL ON referral_visits TO authenticated;
GRANT ALL ON referral_conversions TO authenticated;
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON subscription_transactions TO authenticated; 