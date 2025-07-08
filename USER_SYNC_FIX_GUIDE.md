# User Sync Fix Guide

## Problem
Users are not being synced to Supabase when they sign in, causing console errors and failed database operations.

## Root Causes
1. **Missing Database Columns**: The `users` table is missing subscription-related columns
2. **Incorrect RLS Policies**: Policies are not configured for Clerk JWT tokens
3. **JWT Token Issues**: Clerk JWT tokens might not be properly configured
4. **Database Schema Mismatch**: The current schema doesn't match what the code expects

## Solution Steps

### Step 1: Update Database Schema
Run the following SQL in your Supabase SQL Editor:

```sql
-- Add missing subscription columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS builds_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remixes_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS builds_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS remixes_limit INTEGER DEFAULT 3;

-- Create missing tables
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  builds_used INTEGER DEFAULT 0,
  remixes_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lemon_squeezy_order_id TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  referral_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Fix RLS Policies
Run the following SQL to fix the RLS policies:

```sql
-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create correct policies for Clerk JWT
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (clerk_id = auth.jwt() ->> 'sub');
```

### Step 3: Configure Clerk JWT Template
In your Clerk Dashboard:

1. Go to **JWT Templates**
2. Create a new template or edit existing one
3. Set the template to include the user ID in the `sub` claim
4. Make sure the template is enabled

### Step 4: Test User Sync
1. Open the browser console
2. Sign in to the application
3. Look for these console messages:
   - "Got JWT token from Clerk: true"
   - "User synced successfully: [user data]"
   - "Supabase connection test successful"

### Step 5: Verify Database
Check your Supabase dashboard:

1. Go to **Table Editor**
2. Check the `users` table
3. Verify that new users are being created with:
   - `clerk_id` field populated
   - `subscription_tier` set to 'free'
   - `subscription_status` set to 'active'
   - `builds_limit` and `remixes_limit` set to default values

## Troubleshooting

### If JWT Token is Not Received
1. Check Clerk JWT template configuration
2. Verify the template is enabled
3. Check browser console for JWT errors

### If Database Connection Fails
1. Verify Supabase URL and API key in environment variables
2. Check if RLS policies are blocking access
3. Test connection with a simple query

### If User Sync Still Fails
1. Check the browser console for specific error messages
2. Verify the `useUserData` hook is being called
3. Check if the `upsertUser` function is receiving the correct data

## Files Modified
- `App.tsx`: Added proper error handling for user sync
- `hooks/useUserData.ts`: Added fallback mechanism and better logging
- `services/databaseService.ts`: Added detailed error logging
- `services/supabaseClient.ts`: Added connection testing

## SQL Files Created
- `add-missing-subscription-columns.sql`: Adds missing columns to existing database
- `fix-rls-policies.sql`: Fixes RLS policies for Clerk authentication
- `complete-database-setup.sql`: Complete database setup (use for new installations)

## Testing
Run the test script in browser console:
```javascript
// Copy and paste the contents of test-user-sync.js
```

This will help identify where the sync process is failing. 