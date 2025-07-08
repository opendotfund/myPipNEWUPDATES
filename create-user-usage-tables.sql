-- Create User Usage Tables for Build Tracking
-- Run this in your Supabase SQL editor

-- 1. Create user_usage table to track monthly usage
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- 2. Create user_subscriptions table for subscription management
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tier_id INTEGER NOT NULL,
  lemon_squeezy_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id SERIAL PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  builds_per_month INTEGER NOT NULL,
  remixes_per_month INTEGER NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default subscription tiers
INSERT INTO subscription_tiers (tier_name, builds_per_month, remixes_per_month, price_monthly, price_yearly, features) VALUES
  ('Basic', 5, 2, 0.00, 0.00, '{"support": "Community", "ai_models": ["Gemini Flash"]}'),
  ('Pro', 50, 20, 19.99, 199.99, '{"support": "Email", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true}'),
  ('Pro Plus', 200, 100, 39.99, 399.99, '{"support": "Priority", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true}'),
  ('Enterprise', 1000, 500, 199.99, 1999.99, '{"support": "Dedicated", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true, "pay_per_use": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);


-- 5. Create user_affiliates table for affiliate management
CREATE TABLE IF NOT EXISTS user_affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  lemon_squeezy_affiliate_id TEXT,
  referral_code TEXT UNIQUE,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on all tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- User usage policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.role() = 'authenticated');

-- User subscriptions policies
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Subscription tiers policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

-- User affiliates policies
CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own affiliate data" ON user_affiliates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own affiliate data" ON user_affiliates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. Grant necessary permissions
GRANT ALL ON user_usage TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT SELECT ON subscription_tiers TO authenticated;
GRANT ALL ON user_affiliates TO authenticated;

-- 9. Create function to get or create user usage for current month
CREATE OR REPLACE FUNCTION get_or_create_user_usage(user_uuid UUID)
RETURNS user_usage AS $$
DECLARE
  current_month TEXT;
  usage_record user_usage;
BEGIN
  current_month := to_char(current_date, 'YYYY-MM');
  
  -- Try to get existing usage record
  SELECT * INTO usage_record 
  FROM user_usage 
  WHERE user_id = user_uuid AND month = current_month;
  
  -- If no record exists, create one
  IF usage_record IS NULL THEN
    INSERT INTO user_usage (user_id, month, builds_used, remixes_used)
    VALUES (user_uuid, current_month, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to increment usage
CREATE OR REPLACE FUNCTION increment_user_usage(user_uuid UUID, usage_type TEXT)
RETURNS user_usage AS $$
DECLARE
  usage_record user_usage;
BEGIN
  -- Get or create usage record
  usage_record := get_or_create_user_usage(user_uuid);
  
  -- Increment the appropriate counter
  IF usage_type = 'build' THEN
    UPDATE user_usage 
    SET builds_used = builds_used + 1, updated_at = NOW()
    WHERE id = usage_record.id
    RETURNING * INTO usage_record;
  ELSIF usage_type = 'remix' THEN
    UPDATE user_usage 
    SET remixes_used = remixes_used + 1, updated_at = NOW()
    WHERE id = usage_record.id
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verify the tables were created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_usage', 'user_subscriptions', 'subscription_tiers')
ORDER BY table_name, ordinal_position; 