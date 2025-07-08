-- Add missing columns to existing tables
-- This script safely adds missing columns without recreating tables

-- Add reset_date column to user_usage if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'reset_date'
    ) THEN
        ALTER TABLE user_usage ADD COLUMN reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added reset_date column to user_usage table';
    ELSE
        RAISE NOTICE 'reset_date column already exists in user_usage table';
    END IF;
END $$;

-- Add any other missing columns that might be needed
DO $$
BEGIN
    -- Check if builds_limit column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'builds_limit'
    ) THEN
        ALTER TABLE user_usage ADD COLUMN builds_limit INTEGER DEFAULT 3;
        RAISE NOTICE 'Added builds_limit column to user_usage table';
    END IF;
    
    -- Check if subscription_tier column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE user_usage ADD COLUMN subscription_tier TEXT DEFAULT 'free';
        RAISE NOTICE 'Added subscription_tier column to user_usage table';
    END IF;
    
    -- Check if builds_used column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'builds_used'
    ) THEN
        ALTER TABLE user_usage ADD COLUMN builds_used INTEGER DEFAULT 0;
        RAISE NOTICE 'Added builds_used column to user_usage table';
    END IF;
    
    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_usage' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_usage ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to user_usage table';
    END IF;
END $$;

-- Create the reset_monthly_usage function if it doesn't exist
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
    UPDATE user_usage 
    SET builds_used = 0,
        reset_date = NOW(),
        updated_at = NOW()
    WHERE DATE_TRUNC('month', reset_date) < DATE_TRUNC('month', NOW());
    
    RAISE NOTICE 'Monthly usage reset completed';
END;
$$ LANGUAGE plpgsql;

-- Create the initialize_user_usage function if it doesn't exist
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

-- Create the record_build_usage function if it doesn't exist
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

DO $$
BEGIN
    RAISE NOTICE 'All missing columns and functions have been added successfully!';
END $$; 