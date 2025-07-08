# Supabase JWT Configuration for Clerk

## The Problem
You're getting RLS policy violations because Supabase isn't properly recognizing the Clerk JWT tokens. This is a common issue when the JWT settings aren't configured correctly.

## Step 1: Get Your Clerk Public Key

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **JWT Templates** in the sidebar
3. Click on **Default** template (or create one if it doesn't exist)
4. Copy the **Public Key** (not the secret key)

The public key should look something like:
```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

## Step 2: Configure Supabase JWT Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **JWT Settings**
5. Set the following:
   - **JWT Secret**: Leave this empty or set to a random string (not used with external JWT)
   - **JWT Expiry**: Set to a reasonable value (e.g., 3600 for 1 hour)
   - **Enable Row Level Security (RLS)**: Make sure this is **ENABLED**

## Step 3: Configure JWT Verification

In the same JWT Settings section:

1. **JWT Verification**: Set to **Custom**
2. **JWT Issuer**: Set to your Clerk issuer URL (e.g., `https://clerk.your-domain.com`)
3. **JWT Audience**: Leave empty or set to your Supabase URL
4. **JWT Public Key**: Paste the Clerk public key you copied in Step 1

## Step 4: Test the Configuration

1. Run the `fix-rls-policies.sql` file in your Supabase SQL editor
2. Open your app and sign in
3. Open browser console and run the `test-jwt-token.js` script
4. Check if the Supabase query succeeds

## Step 5: Alternative Configuration (if above doesn't work)

If the custom JWT verification doesn't work, try this simpler approach:

1. In Supabase JWT Settings:
   - Set **JWT Secret** to your Clerk JWT secret (not public key)
   - Set **JWT Verification** to **Standard**
   - Leave other fields empty

2. Update your Clerk JWT template to include the `sub` claim:
   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}",
     "name": "{{user.full_name}}"
   }
   ```

## Troubleshooting

### Error: "new row violates row-level security policy"
This means the JWT token isn't being recognized. Check:
1. JWT token structure (run the test script)
2. Supabase JWT configuration
3. RLS policies are properly set

### Error: "JWT verification failed"
This means the JWT signature isn't valid. Check:
1. Clerk public key is correct
2. JWT issuer URL is correct
3. Token hasn't expired

### Error: "Cannot read properties of null"
This usually means the user isn't authenticated. Check:
1. User is signed in to Clerk
2. JWT token is being generated
3. Token is being passed to Supabase

## Quick Test

Run this in your browser console after signing in:

```javascript
// Test if JWT token is working
async function quickTest() {
  const token = await window.Clerk.session?.getToken();
  console.log('Token available:', !!token);
  
  if (token) {
    const response = await fetch('https://lrkimhssimcmzvhliqbp.supabase.co/rest/v1/users?select=clerk_id&limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA'
      }
    });
    
    if (response.ok) {
      console.log('✅ JWT authentication working');
    } else {
      console.log('❌ JWT authentication failed:', response.status);
    }
  }
}

quickTest();
```

## Next Steps

1. Run the `fix-rls-policies.sql` file in Supabase
2. Configure JWT settings as described above
3. Test the authentication
4. Try creating a project again

If you're still having issues, the problem might be with the database schema itself. In that case, run the `complete-database-fix.sql` file to ensure all tables and columns are properly set up. 