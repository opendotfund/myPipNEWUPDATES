-- Fix UUID vs TEXT Mismatch Issues
-- Run this in your Supabase SQL editor to resolve all type conflicts

-- 1. Drop and recreate user_usage table with correct schema
DROP TABLE IF EXISTS user_usage CASCADE;

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

-- 2. Drop and recreate subscription_transactions table with correct schema
DROP TABLE IF EXISTS subscription_transactions CASCADE;

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  lemon_squeezy_order_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  plan_tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Drop and recreate user_referral_codes table with correct schema
DROP TABLE IF EXISTS user_referral_codes CASCADE;

CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Drop and recreate user_affiliates table with correct schema
DROP TABLE IF EXISTS user_affiliates CASCADE;

CREATE TABLE IF NOT EXISTS user_affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  lemon_squeezy_affiliate_id TEXT,
  referral_code TEXT UNIQUE,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10% commission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Drop and recreate referral_conversions table with correct schema
DROP TABLE IF EXISTS referral_conversions CASCADE;

CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  converted_user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  lemon_squeezy_order_id TEXT,
  order_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  conversion_type TEXT DEFAULT 'subscription', -- subscription, one_time, etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 6. Drop and recreate affiliate_earnings table with correct schema
DROP TABLE IF EXISTS affiliate_earnings CASCADE;

CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES referral_conversions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_lemon_squeezy_order_id ON subscription_transactions(lemon_squeezy_order_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_referral_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_user_id ON user_affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_converted ON referral_conversions(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate ON affiliate_earnings(affiliate_user_id);

-- 8. Enable RLS on all tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- 9. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;
DROP POLICY IF EXISTS "Enable read access for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Enable insert for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Users can view their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can insert their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Enable read access for referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Enable insert for referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Users can view their own earnings" ON affiliate_earnings;
DROP POLICY IF EXISTS "Users can insert their own earnings" ON affiliate_earnings;

-- 10. Create RLS policies
-- User usage policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Subscription transactions policies
CREATE POLICY "Enable read access for subscription transactions" ON subscription_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for subscription transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User referral codes policies
CREATE POLICY "Users can view their own referral codes" ON user_referral_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own referral codes" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own referral codes" ON user_referral_codes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- User affiliates policies
CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own affiliate data" ON user_affiliates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own affiliate data" ON user_affiliates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Referral conversions policies
CREATE POLICY "Enable read access for referral conversions" ON referral_conversions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for referral conversions" ON referral_conversions
  FOR INSERT WITH CHECK (true);

-- Affiliate earnings policies
CREATE POLICY "Users can view their own earnings" ON affiliate_earnings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own earnings" ON affiliate_earnings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 11. Create helper functions
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

-- 12. Update the database service function to use the correct user_id type
-- The recordSubscriptionTransaction function now expects clerk_id and converts it to UUID internally 