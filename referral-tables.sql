-- Referral System Tables for Lemon Squeezy Integration

-- User referral codes table
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral visits tracking
CREATE TABLE IF NOT EXISTS referral_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code VARCHAR(50) NOT NULL,
  visitor_ip INET,
  user_agent TEXT,
  referrer TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMP WITH TIME ZONE
);

-- Referral conversions (populated by Lemon Squeezy webhooks)
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code VARCHAR(50) NOT NULL,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  customer_email VARCHAR(255),
  product_id VARCHAR(100),
  product_name VARCHAR(255),
  order_value DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  conversion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);

-- Referral earnings tracking
CREATE TABLE IF NOT EXISTS referral_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  order_id VARCHAR(100) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_code ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_date ON referral_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_code ON referral_conversions(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_order ON referral_conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user ON referral_earnings(user_id);

-- RLS Policies for referral tables
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_earnings ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (tighten in production)
CREATE POLICY "Allow all operations on user_referral_codes" ON user_referral_codes
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on referral_visits" ON referral_visits
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on referral_conversions" ON referral_conversions
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on referral_earnings" ON referral_earnings
FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_user_referral_codes_updated_at 
    BEFORE UPDATE ON user_referral_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 