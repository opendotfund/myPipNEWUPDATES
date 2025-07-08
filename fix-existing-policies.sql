-- Fix existing policies and handle conflicts
-- This script safely handles existing policies and tables

-- First, let's drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop user_usage policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'Users can view their own usage') THEN
        DROP POLICY "Users can view their own usage" ON user_usage;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'Users can insert their own usage') THEN
        DROP POLICY "Users can insert their own usage" ON user_usage;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'Users can update their own usage') THEN
        DROP POLICY "Users can update their own usage" ON user_usage;
    END IF;
    
    -- Drop subscription_transactions policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_transactions' AND policyname = 'Users can view their own transactions') THEN
        DROP POLICY "Users can view their own transactions" ON subscription_transactions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_transactions' AND policyname = 'Users can insert their own transactions') THEN
        DROP POLICY "Users can insert their own transactions" ON subscription_transactions;
    END IF;
    
    -- Drop user_affiliates policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_affiliates' AND policyname = 'Users can view their own affiliate data') THEN
        DROP POLICY "Users can view their own affiliate data" ON user_affiliates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_affiliates' AND policyname = 'Users can insert their own affiliate data') THEN
        DROP POLICY "Users can insert their own affiliate data" ON user_affiliates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_affiliates' AND policyname = 'Users can update their own affiliate data') THEN
        DROP POLICY "Users can update their own affiliate data" ON user_affiliates;
    END IF;
    
    -- Drop referral_commissions policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_commissions' AND policyname = 'Users can view their own commissions') THEN
        DROP POLICY "Users can view their own commissions" ON referral_commissions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_commissions' AND policyname = 'Users can insert their own commissions') THEN
        DROP POLICY "Users can insert their own commissions" ON referral_commissions;
    END IF;
    
    -- Drop users table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
        DROP POLICY "Users can view their own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        DROP POLICY "Users can update their own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own data') THEN
        DROP POLICY "Users can insert their own data" ON users;
    END IF;
    
    -- Drop projects table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view their own projects') THEN
        DROP POLICY "Users can view their own projects" ON projects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert their own projects') THEN
        DROP POLICY "Users can insert their own projects" ON projects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update their own projects') THEN
        DROP POLICY "Users can update their own projects" ON projects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete their own projects') THEN
        DROP POLICY "Users can delete their own projects" ON projects;
    END IF;
    
    -- Drop builds table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'builds' AND policyname = 'Users can view their own builds') THEN
        DROP POLICY "Users can view their own builds" ON builds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'builds' AND policyname = 'Users can insert their own builds') THEN
        DROP POLICY "Users can insert their own builds" ON builds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'builds' AND policyname = 'Users can update their own builds') THEN
        DROP POLICY "Users can update their own builds" ON builds;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'builds' AND policyname = 'Users can delete their own builds') THEN
        DROP POLICY "Users can delete their own builds" ON builds;
    END IF;
    
    -- Drop chat_messages table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view their own messages') THEN
        DROP POLICY "Users can view their own messages" ON chat_messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can insert their own messages') THEN
        DROP POLICY "Users can insert their own messages" ON chat_messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update their own messages') THEN
        DROP POLICY "Users can update their own messages" ON chat_messages;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can delete their own messages') THEN
        DROP POLICY "Users can delete their own messages" ON chat_messages;
    END IF;
    
    -- Drop waitlist table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Users can view their own waitlist entry') THEN
        DROP POLICY "Users can view their own waitlist entry" ON waitlist;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Users can insert their own waitlist entry') THEN
        DROP POLICY "Users can insert their own waitlist entry" ON waitlist;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist' AND policyname = 'Users can update their own waitlist entry') THEN
        DROP POLICY "Users can update their own waitlist entry" ON waitlist;
    END IF;
    
    -- Drop waitlist_admin table policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist_admin' AND policyname = 'Admins can view all waitlist entries') THEN
        DROP POLICY "Admins can view all waitlist entries" ON waitlist_admin;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist_admin' AND policyname = 'Admins can update waitlist entries') THEN
        DROP POLICY "Admins can update waitlist entries" ON waitlist_admin;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waitlist_admin' AND policyname = 'Admins can delete waitlist entries') THEN
        DROP POLICY "Admins can delete waitlist entries" ON waitlist_admin;
    END IF;
    
    RAISE NOTICE 'Dropped existing policies successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Now create the tables if they don't exist
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_tier TEXT NOT NULL,
    builds_used INTEGER DEFAULT 0,
    builds_limit INTEGER NOT NULL,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL,
    subscription_tier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    affiliate_id TEXT UNIQUE,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_reset_date ON user_usage(reset_date);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_transaction_id ON subscription_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_user_id ON user_affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliates_affiliate_id ON user_affiliates(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_affiliate_user_id ON referral_commissions(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_user_id ON referral_commissions(referred_user_id);

-- Enable RLS on all tables
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_admin ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for subscription_transactions
CREATE POLICY "Users can view their own transactions" ON subscription_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON subscription_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_affiliates
CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate data" ON user_affiliates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate data" ON user_affiliates
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for referral_commissions
CREATE POLICY "Users can view their own commissions" ON referral_commissions
    FOR SELECT USING (auth.uid() = affiliate_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert their own commissions" ON referral_commissions
    FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for builds table
CREATE POLICY "Users can view their own builds" ON builds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own builds" ON builds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own builds" ON builds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own builds" ON builds
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for chat_messages table
CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for waitlist table
CREATE POLICY "Users can view their own waitlist entry" ON waitlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist entry" ON waitlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waitlist entry" ON waitlist
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for waitlist_admin table (admin only)
CREATE POLICY "Admins can view all waitlist entries" ON waitlist_admin
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'admin'));

CREATE POLICY "Admins can update waitlist entries" ON waitlist_admin
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'admin'));

CREATE POLICY "Admins can delete waitlist entries" ON waitlist_admin
    FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_usage_updated_at ON user_usage;
CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_affiliates_updated_at ON user_affiliates;
CREATE TRIGGER update_user_affiliates_updated_at
    BEFORE UPDATE ON user_affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user usage
CREATE OR REPLACE FUNCTION initialize_user_usage(user_uuid UUID, tier TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_usage (user_id, subscription_tier, builds_limit)
    VALUES (
        user_uuid,
        tier,
        CASE 
            WHEN tier = 'free' THEN 3
            WHEN tier = 'pro' THEN 50
            WHEN tier = 'enterprise' THEN 500
            ELSE 3
        END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = EXCLUDED.subscription_tier,
        builds_limit = EXCLUDED.builds_limit,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to record build usage
CREATE OR REPLACE FUNCTION record_build_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage RECORD;
    can_build BOOLEAN := false;
BEGIN
    -- Get current usage
    SELECT * INTO current_usage 
    FROM user_usage 
    WHERE user_id = user_uuid;
    
    -- If no usage record exists, create one with free tier
    IF current_usage IS NULL THEN
        PERFORM initialize_user_usage(user_uuid, 'free');
        SELECT * INTO current_usage 
        FROM user_usage 
        WHERE user_id = user_uuid;
    END IF;
    
    -- Check if user can build
    IF current_usage.builds_used < current_usage.builds_limit THEN
        -- Increment builds_used
        UPDATE user_usage 
        SET builds_used = builds_used + 1,
            updated_at = NOW()
        WHERE user_id = user_uuid;
        
        can_build := true;
    END IF;
    
    RETURN can_build;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
    UPDATE user_usage 
    SET builds_used = 0,
        reset_date = NOW(),
        updated_at = NOW()
    WHERE DATE_TRUNC('month', reset_date) < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to reset usage monthly (if you have pg_cron extension)
-- SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', 'SELECT reset_monthly_usage();');

DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
END $$; 