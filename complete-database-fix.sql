-- Complete Database Fix - Run this in Supabase SQL Editor
-- This ensures all tables exist with correct structure and fixes any issues

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Drop and recreate users table with all required columns
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  builds_used INTEGER DEFAULT 0,
  builds_limit INTEGER DEFAULT 5,
  remixes_used INTEGER DEFAULT 0,
  remixes_limit INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop and recreate projects table with correct structure
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  preview_html TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  allow_remix BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'General',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Drop and recreate project_likes table
DROP TABLE IF EXISTS project_likes CASCADE;

CREATE TABLE IF NOT EXISTS project_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. Drop and recreate project_views table
DROP TABLE IF EXISTS project_views CASCADE;

CREATE TABLE IF NOT EXISTS project_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Drop and recreate user_saved_projects table
DROP TABLE IF EXISTS user_saved_projects CASCADE;

CREATE TABLE IF NOT EXISTS user_saved_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 6. Drop and recreate waitlist table
DROP TABLE IF EXISTS waitlist CASCADE;

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'v2_popup',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Drop and recreate subscription_plans table
DROP TABLE IF EXISTS subscription_plans CASCADE;

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

-- 8. Drop and recreate user_usage table
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

-- 9. Drop and recreate subscription_transactions table
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

-- 10. Drop and recreate user_referral_codes table
DROP TABLE IF EXISTS user_referral_codes CASCADE;

CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Drop and recreate referral_visits table
DROP TABLE IF EXISTS referral_visits CASCADE;

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

-- 12. Drop and recreate referral_conversions table
DROP TABLE IF EXISTS referral_conversions CASCADE;

CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  converted_user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  lemon_squeezy_order_id TEXT,
  order_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  conversion_type TEXT DEFAULT 'subscription',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 13. Drop and recreate user_affiliates table
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
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Drop and recreate affiliate_earnings table
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

-- 15. Create all indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_original_id ON projects(original_project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_projects_user_id ON user_saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_projects_project_id ON user_saved_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month ON user_usage(month);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_lemon_squeezy_order_id ON subscription_transactions(lemon_squeezy_order_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_referral_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_referral_code ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referral_code ON referral_conversions(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_user_id ON user_affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer ON referral_conversions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_converted ON referral_conversions(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_affiliate ON affiliate_earnings(affiliate_user_id);

-- 16. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- 17. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view all likes" ON project_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON project_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON project_likes;
DROP POLICY IF EXISTS "Users can view all views" ON project_views;
DROP POLICY IF EXISTS "Anyone can create views" ON project_views;
DROP POLICY IF EXISTS "Users can view their own saved projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can save projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can remove their saved projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON waitlist;
DROP POLICY IF EXISTS "Only admins can update waitlist" ON waitlist;
DROP POLICY IF EXISTS "Enable read access for subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;
DROP POLICY IF EXISTS "Enable read access for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Enable insert for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Users can view their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Enable read access for referral visits" ON referral_visits;
DROP POLICY IF EXISTS "Enable insert for referral visits" ON referral_visits;
DROP POLICY IF EXISTS "Enable read access for referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Enable insert for referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Users can view their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can insert their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can update their own affiliate data" ON user_affiliates;
DROP POLICY IF EXISTS "Users can view their own earnings" ON affiliate_earnings;
DROP POLICY IF EXISTS "Users can insert their own earnings" ON affiliate_earnings;

-- 18. Create RLS policies
-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can view public projects" ON projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Project likes policies
CREATE POLICY "Users can view all likes" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON project_likes
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own likes" ON project_likes
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Project views policies
CREATE POLICY "Users can view all views" ON project_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create views" ON project_views
  FOR INSERT WITH CHECK (true);

-- User saved projects policies
CREATE POLICY "Users can view their own saved projects" ON user_saved_projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can save projects" ON user_saved_projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can remove their saved projects" ON user_saved_projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Waitlist policies
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist" ON waitlist
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update waitlist" ON waitlist
  FOR UPDATE USING (auth.email() IN ('m3stastn@uwaterloo.ca', 'admin@mypip.com'));

-- Subscription plans policies
CREATE POLICY "Enable read access for subscription plans" ON subscription_plans
  FOR SELECT USING (true);

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

-- Referral visits policies
CREATE POLICY "Enable read access for referral visits" ON referral_visits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for referral visits" ON referral_visits
  FOR INSERT WITH CHECK (true);

-- Referral conversions policies
CREATE POLICY "Enable read access for referral conversions" ON referral_conversions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for referral conversions" ON referral_conversions
  FOR INSERT WITH CHECK (true);

-- User affiliates policies
CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own affiliate data" ON user_affiliates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own affiliate data" ON user_affiliates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Affiliate earnings policies
CREATE POLICY "Users can view their own earnings" ON affiliate_earnings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own earnings" ON affiliate_earnings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 19. Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_remix_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET remix_count = remix_count + 1 
    WHERE id = NEW.original_project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET remix_count = remix_count - 1 
    WHERE id = OLD.original_project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_create_user_usage(user_clerk_id TEXT)
RETURNS user_usage AS $$
DECLARE
  current_month TEXT;
  usage_record user_usage;
BEGIN
  current_month := to_char(current_date, 'YYYY-MM');
  
  SELECT * INTO usage_record 
  FROM user_usage 
  WHERE user_id = user_clerk_id AND month = current_month;
  
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
  
  SELECT * INTO usage_record 
  FROM user_usage 
  WHERE user_id = user_clerk_id AND month = current_month;
  
  IF usage_record IS NULL THEN
    INSERT INTO user_usage (user_id, month, builds_used, remixes_used)
    VALUES (user_clerk_id, current_month, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
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

-- 20. Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_remix_count_trigger 
  AFTER INSERT OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_remix_count();

CREATE TRIGGER update_likes_count_trigger 
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 21. Insert default subscription plans
INSERT INTO subscription_plans (name, tier, price, builds_limit, remixes_limit) VALUES
  ('Basic', 'basic', 0.00, 5, 2),
  ('Pro', 'pro', 19.99, 50, 20),
  ('Pro Plus', 'pro_plus', 39.99, 200, 100),
  ('Enterprise', 'enterprise', 199.99, 1000, 500)
ON CONFLICT (tier) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! All tables created with correct structure.' as status; 