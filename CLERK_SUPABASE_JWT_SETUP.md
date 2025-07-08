# Clerk JWT Setup with Supabase

## Problem
Your JWT tokens from Clerk aren't working with Supabase, causing user sync failures.

## Solution: Complete JWT Setup

### Step 1: Configure Clerk JWT Template

1. **Go to your Clerk Dashboard**
   - Visit: https://dashboard.clerk.com/
   - Select your application

2. **Navigate to JWT Templates**
   - Go to: **JWT Templates** in the sidebar
   - Click **"New template"**

3. **Create Supabase JWT Template**
   ```
   Template name: supabase
   Claims: 
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
       "sub": "{{user.id}}",
       "full_name": "{{user.full_name}}",
       "avatar_url": "{{user.image_url}}"
     },
     "role": "authenticated"
   }
   ```

### Step 2: Configure Supabase JWT Settings

1. **Get your Supabase JWT Secret**
   - Go to your Supabase Dashboard
   - Navigate to: **Settings** → **API**
   - Copy the **JWT Secret** (starts with `eyJ...`)

2. **Configure Clerk with Supabase JWT Secret**
   - Go back to Clerk Dashboard
   - Go to: **JWT Templates** → **supabase** template
   - Click **"Configure"**
   - Add the Supabase JWT Secret in the **Signing Key** field

### Step 3: Update Your Environment Variables

Add these to your `.env` file:

```env
# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret

# Supabase Configuration  
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
CLERK_JWT_TEMPLATE_NAME=supabase
```

### Step 4: Update Your Supabase Client

Make sure your `supabaseClient.ts` is configured correctly:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Function to create authenticated client with JWT
export function createAuthenticatedSupabaseClient(jwt: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  })
}
```

### Step 5: Test JWT Integration

1. **Run the complete database setup:**
   ```sql
   -- Run the complete-database-setup.sql in Supabase SQL Editor
   ```

2. **Test user sign-in:**
   - Sign in to your app
   - Check browser console for JWT token logs
   - Verify user sync success messages

### Step 6: Verify JWT Claims

To test if JWT is working, add this to your browser console when signed in:

```javascript
// Test JWT token
window.Clerk.session.getToken({ template: 'supabase' }).then(token => {
  console.log('JWT Token:', token);
  
  // Decode JWT (without verification)
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('JWT Payload:', payload);
  
  // Check if 'sub' claim exists
  console.log('User ID (sub):', payload.sub);
});
```

## Common Issues & Solutions

### Issue: "JWT token is invalid"
**Solution:** Make sure the JWT secret in Clerk matches your Supabase JWT secret exactly.

### Issue: "User not found" in RLS policies
**Solution:** Verify the JWT template includes the correct `sub` claim with the user ID.

### Issue: "Policy violation" errors
**Solution:** Ensure RLS policies are using `auth.jwt() ->> 'sub'` to match Clerk's user ID format.

## Verification Checklist

- [ ] Clerk JWT template created with name "supabase"
- [ ] Supabase JWT secret configured in Clerk
- [ ] Environment variables updated
- [ ] Database tables created successfully
- [ ] RLS policies created and enabled
- [ ] User sign-in works without errors
- [ ] Console shows "User synced successfully" message

## Next Steps

After completing this setup:
1. Test user registration and sign-in
2. Verify user data is saved to Supabase
3. Test project creation and retrieval
4. Monitor console for any remaining errors 