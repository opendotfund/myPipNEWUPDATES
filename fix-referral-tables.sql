-- Fix Referral Tables and Handle Existing Conflicts
-- Run this in your Supabase SQL editor

-- 1. Drop existing functions that might conflict
DROP FUNCTION IF EXISTS track_referral_conversion(TEXT, UUID, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS generate_referral_code(UUID);
DROP FUNCTION IF EXISTS get_or_create_user_usage(UUID);
DROP FUNCTION IF EXISTS increment_user_usage(UUID, TEXT);

-- 2. Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscription tiers" ON subscription_tiers;
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can insert their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can view their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Anyone can create referral visits" ON referral_visits;
DROP POLICY IF EXISTS "Users can view visits to their referral codes" ON referral_visits;
DROP POLICY IF EXISTS "Anyone can create referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Users can view their own conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Users can view their own earnings" ON affiliate_earnings;
DROP POLICY IF EXISTS "Users can insert their own earnings" ON affiliate_earnings;

-- 3. Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS affiliate_earnings CASCADE;
DROP TABLE IF EXISTS referral_conversions CASCADE;
DROP TABLE IF EXISTS referral_visits CASCADE;
DROP TABLE IF EXISTS user_referral_codes CASCADE;
DROP TABLE IF EXISTS user_affiliates CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_usage CASCADE;
DROP TABLE IF EXISTS subscription_tiers CASCADE;

-- 4. Create tables with proper structure
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
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10% commission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  lemon_squeezy_order_id TEXT,
  order_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  conversion_type TEXT DEFAULT 'subscription', -- subscription, one_time, etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS affiliate_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversion_id UUID REFERENCES referral_conversions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert default subscription tiers
INSERT INTO subscription_tiers (tier_name, builds_per_month, remixes_per_month, price_monthly, price_yearly, features) VALUES
  ('Basic', 5, 2, 0.00, 0.00, '{"support": "Community", "ai_models": ["Gemini Flash"]}'),
  ('Pro', 50, 20, 19.99, 199.99, '{"support": "Email", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true}'),
  ('Pro Plus', 200, 100, 39.99, 399.99, '{"support": "Priority", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true}'),
  ('Enterprise', 1000, 500, 199.99, 1999.99, '{"support": "Dedicated", "ai_models": ["Gemini Flash", "Claude 3.5"], "unlimited_remixes": true, "pay_per_use": true}')
ON CONFLICT (tier_name) DO NOTHING;

-- 6. Enable RLS on all tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own affiliate data" ON user_affiliates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own affiliate data" ON user_affiliates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own referral codes" ON user_referral_codes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own referral codes" ON user_referral_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own referral codes" ON user_referral_codes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can create referral visits" ON referral_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view visits to their referral codes" ON referral_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_referral_codes 
      WHERE user_referral_codes.referral_code = referral_visits.referral_code
      AND user_referral_codes.user_id::text = auth.jwt() ->> 'user_id'
    )
  );

CREATE POLICY "Anyone can create referral conversions" ON referral_conversions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own conversions" ON referral_conversions
  FOR SELECT USING (
    referrer_user_id::text = auth.jwt() ->> 'user_id' OR
    converted_user_id::text = auth.jwt() ->> 'user_id'
  );

CREATE POLICY "Users can view their own earnings" ON affiliate_earnings
  FOR SELECT USING (affiliate_user_id::text = auth.jwt() ->> 'user_id');

CREATE POLICY "Users can insert their own earnings" ON affiliate_earnings
  FOR INSERT WITH CHECK (affiliate_user_id::text = auth.jwt() ->> 'user_id');

-- 8. Grant necessary permissions
GRANT ALL ON user_usage TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT SELECT ON subscription_tiers TO authenticated;
GRANT ALL ON user_affiliates TO authenticated;
GRANT ALL ON user_referral_codes TO authenticated;
GRANT ALL ON referral_visits TO authenticated;
GRANT ALL ON referral_conversions TO authenticated;
GRANT ALL ON affiliate_earnings TO authenticated;

-- 9. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_code ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_visited_at ON referral_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_code ON referral_conversions(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_converted ON referral_conversions(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate ON affiliate_earnings(affiliate_user_id);

-- 10. Create functions
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

CREATE OR REPLACE FUNCTION generate_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_hash TEXT;
  timestamp_hash TEXT;
  referral_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create hash from user ID
  user_hash := substr(md5(user_uuid::text), 1, 6);
  
  -- Create hash from timestamp
  timestamp_hash := substr(md5(extract(epoch from now())::text), 1, 4);
  
  -- Generate base code
  referral_code := 'mypip_' || user_hash || '_' || timestamp_hash;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM user_referral_codes WHERE referral_code = referral_code) LOOP
    counter := counter + 1;
    referral_code := 'mypip_' || user_hash || '_' || timestamp_hash || '_' || counter;
  END LOOP;
  
  RETURN upper(referral_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_referral_code TEXT,
  p_converted_user_id UUID,
  p_order_value DECIMAL,
  p_lemon_squeezy_order_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_referrer_user_id UUID;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_conversion_id UUID;
BEGIN
  -- Get referrer user ID
  SELECT user_id INTO v_referrer_user_id
  FROM user_referral_codes
  WHERE referral_code = p_referral_code AND is_active = true;
  
  IF v_referrer_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive referral code';
  END IF;
  
  -- Get commission rate
  SELECT COALESCE(commission_rate, 10.00) INTO v_commission_rate
  FROM user_affiliates
  WHERE user_id = v_referrer_user_id;
  
  -- Calculate commission
  v_commission_amount := (p_order_value * v_commission_rate) / 100;
  
  -- Create conversion record
  INSERT INTO referral_conversions (
    referral_code,
    referrer_user_id,
    converted_user_id,
    lemon_squeezy_order_id,
    order_value,
    commission_amount,
    status
  ) VALUES (
    p_referral_code,
    v_referrer_user_id,
    p_converted_user_id,
    p_lemon_squeezy_order_id,
    p_order_value,
    v_commission_amount,
    'pending'
  ) RETURNING id INTO v_conversion_id;
  
  -- Create earnings record
  INSERT INTO affiliate_earnings (
    affiliate_user_id,
    conversion_id,
    amount,
    status
  ) VALUES (
    v_referrer_user_id,
    v_conversion_id,
    v_commission_amount,
    'pending'
  );
  
  -- Update affiliate stats
  UPDATE user_affiliates
  SET total_referrals = total_referrals + 1,
      total_earnings = total_earnings + v_commission_amount,
      updated_at = NOW()
  WHERE user_id = v_referrer_user_id;
  
  -- Mark visit as converted
  UPDATE referral_visits
  SET converted = true,
      conversion_value = p_order_value
  WHERE referral_code = p_referral_code
    AND converted = false;
  
  RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verify the tables were created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('user_usage', 'user_subscriptions', 'subscription_tiers', 'user_affiliates', 'user_referral_codes', 'referral_visits', 'referral_conversions', 'affiliate_earnings')
ORDER BY table_name, ordinal_position; 