-- Complete Database Setup for myPip
-- This script sets up all necessary tables for project storage, user management, and community features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (core user management)
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

-- Add missing columns to existing users table if they don't exist
DO $$ 
BEGIN
  -- Add subscription_tier if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
    ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'basic';
  END IF;
  
  -- Add subscription_status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
    ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'active';
  END IF;
  
  -- Add lemon_squeezy_customer_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lemon_squeezy_customer_id') THEN
    ALTER TABLE users ADD COLUMN lemon_squeezy_customer_id TEXT;
  END IF;
  
  -- Add lemon_squeezy_subscription_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lemon_squeezy_subscription_id') THEN
    ALTER TABLE users ADD COLUMN lemon_squeezy_subscription_id TEXT;
  END IF;
  
  -- Add builds_used if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'builds_used') THEN
    ALTER TABLE users ADD COLUMN builds_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add builds_limit if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'builds_limit') THEN
    ALTER TABLE users ADD COLUMN builds_limit INTEGER DEFAULT 5;
  END IF;
  
  -- Add remixes_used if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'remixes_used') THEN
    ALTER TABLE users ADD COLUMN remixes_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add remixes_limit if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'remixes_limit') THEN
    ALTER TABLE users ADD COLUMN remixes_limit INTEGER DEFAULT 2;
  END IF;
END $$;

-- 2. Projects table (core project storage) - Fixed to use clerk_id reference
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

-- 3. Project likes table - Fixed to use clerk_id reference
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. Project views table - Fixed to use clerk_id reference
CREATE TABLE IF NOT EXISTS project_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User saved projects table - Fixed to use clerk_id reference
CREATE TABLE IF NOT EXISTS user_saved_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 6. Waitlist table for V2 signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'v2_popup',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing waitlist table if they don't exist
DO $$ 
BEGIN
  -- Add source if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waitlist' AND column_name = 'source') THEN
    ALTER TABLE waitlist ADD COLUMN source TEXT DEFAULT 'v2_popup';
  END IF;
  
  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waitlist' AND column_name = 'status') THEN
    ALTER TABLE waitlist ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  
  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waitlist' AND column_name = 'updated_at') THEN
    ALTER TABLE waitlist ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 7. Subscription plans table
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

-- 8. Subscription transactions table - Fixed to use UUID reference
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

-- 9. User referral codes table - Fixed to use UUID reference
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Referral visits table
CREATE TABLE IF NOT EXISTS referral_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Referral conversions table
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  customer_email TEXT,
  order_amount DECIMAL(10,2),
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
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
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_lemon_squeezy_order_id ON subscription_transactions(lemon_squeezy_order_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referral_codes_referral_code ON user_referral_codes(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_referral_code ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referral_code ON referral_conversions(referral_code);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON waitlist;
DROP POLICY IF EXISTS "Only admins can update waitlist" ON waitlist;
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
DROP POLICY IF EXISTS "Enable read access for subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Enable read access for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Enable insert for subscription transactions" ON subscription_transactions;
DROP POLICY IF EXISTS "Users can view their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Users can insert their own referral codes" ON user_referral_codes;
DROP POLICY IF EXISTS "Enable read access for referral visits" ON referral_visits;
DROP POLICY IF EXISTS "Enable insert for referral visits" ON referral_visits;
DROP POLICY IF EXISTS "Enable read access for referral conversions" ON referral_conversions;
DROP POLICY IF EXISTS "Enable insert for referral conversions" ON referral_conversions;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- RLS Policies for waitlist table
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist" ON waitlist
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update waitlist" ON waitlist
  FOR UPDATE USING (auth.email() IN ('m3stastn@uwaterloo.ca', 'admin@mypip.com'));

-- RLS Policies for projects table
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

-- RLS Policies for project_likes table
CREATE POLICY "Users can view all likes" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON project_likes
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own likes" ON project_likes
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- RLS Policies for project_views table
CREATE POLICY "Users can view all views" ON project_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create views" ON project_views
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_saved_projects table
CREATE POLICY "Users can view their own saved projects" ON user_saved_projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can save projects" ON user_saved_projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can remove their saved projects" ON user_saved_projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- RLS Policies for subscription tables
CREATE POLICY "Enable read access for subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for subscription transactions" ON subscription_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for subscription transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for referral tables
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update remix count
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
    SET remix_count = GREATEST(0, remix_count - 1) 
    WHERE id = OLD.original_project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update likes count
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
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update remix count
CREATE TRIGGER update_remix_count_trigger 
  AFTER INSERT OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_remix_count();

-- Trigger to update likes count
CREATE TRIGGER update_likes_count_trigger 
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, tier, price, builds_limit, remixes_limit) VALUES
  ('Basic', 'basic', 0.00, 5, 2),
  ('Pro', 'pro', 19.99, 50, 20),
  ('Enterprise', 'enterprise', 49.99, 200, 100)
ON CONFLICT (tier) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON waitlist TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_likes TO authenticated;
GRANT ALL ON project_views TO authenticated;
GRANT ALL ON user_saved_projects TO authenticated;
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON subscription_transactions TO authenticated;
GRANT ALL ON user_referral_codes TO authenticated;
GRANT ALL ON referral_visits TO authenticated;
GRANT ALL ON referral_conversions TO authenticated;

-- Verify the setup
SELECT 'Database setup completed successfully!' as status; 