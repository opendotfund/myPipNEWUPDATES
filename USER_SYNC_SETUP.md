# User Sync and Admin Panel Setup Guide

## Issues and Solutions

### 1. User Table Not Populating

**Problem**: Users are not being created in the Supabase `users` table when they sign up/sign in.

**Root Cause**: RLS (Row Level Security) policies are too restrictive and blocking user creation.

**Solution**: Run the development-friendly RLS policies.

### 2. Clerk Authentication Setup

**Required**: Configure Clerk to generate Supabase-compatible JWT tokens.

## Step-by-Step Setup

### Step 1: Fix RLS Policies

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-rls-development.sql`
4. Run the script

This will:
- Drop restrictive RLS policies
- Create permissive policies for development
- Enable proper permissions for authenticated users

### Step 2: Configure Clerk JWT Template

1. Go to your Clerk Dashboard
2. Navigate to JWT Templates
3. Create a new template called "supabase"
4. Use this template:

```json
{
  "aud": "authenticated",
  "exp": "{{exp}}",
  "iat": "{{iat}}",
  "iss": "{{iss}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "phone": "{{user.primary_phone_number.phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "email": "{{user.primary_email_address.email_address}}",
    "email_verified": "{{user.primary_email_address.verification.status}}",
    "phone_verified": "{{user.primary_phone_number.verification.status}}",
    "sub": "{{user.id}}"
  },
  "role": "authenticated"
}
```

### Step 3: Update Supabase JWT Settings

1. In your Supabase dashboard, go to Settings > API
2. Copy your JWT secret
3. In Clerk dashboard, go to JWT Templates > supabase
4. Set the signing algorithm to "HS256"
5. Add your Supabase JWT secret as the signing key

### Step 4: Test User Sync

1. Start your development server: `npm run dev`
2. Sign up with a new account
3. Check the browser console for user sync logs
4. Verify the user appears in your Supabase `users` table

## Admin Panel Features

### Accessing the Admin Panel

1. Sign in with an admin email:
   - `m3stastn@uwaterloo.ca`
   - `admin@mypip.com`
   - `your-admin-email@example.com`

2. Click the "Users" button in the header (next to "Waitlist")

### Admin Panel Capabilities

- **View All Users**: See all registered users with their details
- **Update Subscription Tiers**: Change user subscription levels
- **Reset Usage**: Reset build and remix counts for users
- **User Management**: View user profiles, emails, and usage statistics

### Subscription Tiers

- **Basic**: 3 builds/day, 10 remixes/month (Free)
- **Pro**: 50 builds/month, 100 remixes/month ($9/month)
- **Pro Plus**: 200 builds/month, 500 remixes/month ($19/month)
- **Enterprise**: 1000 builds/month, 2000 remixes/month ($49/month)

## Troubleshooting

### User Sync Not Working

1. **Check Console Logs**: Look for "Error in upsertUser" messages
2. **Verify JWT Template**: Ensure the supabase template is correctly configured
3. **Check RLS Policies**: Run the RLS fix script again
4. **Test Authentication**: Try logging out and back in

### Admin Panel Not Showing

1. **Check Email**: Ensure you're using one of the admin emails
2. **Refresh Page**: Sometimes the admin buttons need a page refresh
3. **Check Console**: Look for any JavaScript errors

### Database Connection Issues

1. **Check Environment Variables**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. **Test Connection**: Try a simple query in Supabase SQL Editor
3. **Check Network**: Ensure no firewall is blocking the connection

## Production Considerations

### Security

For production, you should:

1. **Tighten RLS Policies**: Replace permissive policies with proper user-based policies
2. **Add Rate Limiting**: Prevent abuse of admin functions
3. **Audit Logging**: Track admin actions
4. **Two-Factor Authentication**: Require 2FA for admin accounts

### Example Production RLS Policy

```sql
-- Example of a secure user policy for production
CREATE POLICY "Users can manage own profile" ON users
FOR ALL USING (auth.uid()::text = clerk_id)
WITH CHECK (auth.uid()::text = clerk_id);
```

## Monitoring

### Key Metrics to Track

- User registration success rate
- Failed user sync attempts
- Admin panel usage
- Subscription tier changes

### Logs to Monitor

- User sync errors in browser console
- Database connection errors
- Admin action logs
- JWT token validation errors

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a fresh user account
4. Check Supabase logs for database errors

## Files Modified

- `services/supabaseClient.ts` - Added authenticated client
- `services/databaseService.ts` - Updated user operations with authentication
- `components/AdminPanel.tsx` - New admin panel component
- `App.tsx` - Added admin panel integration
- `fix-rls-development.sql` - RLS policy fixes
- `USER_SYNC_SETUP.md` - This guide 