# User Sync Guide: Clerk to Supabase

## 🎯 **Goal**
Sync all existing Clerk users to your Supabase database so they can use your app with proper subscription tiers and usage tracking.

## 📋 **Prerequisites**
- ✅ Clerk connected to Supabase (you've done this)
- ✅ Database schema set up (run `complete-database-setup.sql`)
- ✅ RLS policies configured (run `fix-rls-policies.sql`)

## 🚀 **Method 1: Automatic Sync (Recommended)**

### **Step 1: Test Current User Sync**
1. Open your app at `http://localhost:5182/` (or whatever port you're using)
2. Sign in with an existing Clerk user
3. Open browser console (F12)
4. Run this command:
   ```javascript
   // Copy and paste this into browser console
   console.log('Current user:', window.Clerk.user);
   console.log('User sync status:', window.Clerk.session);
   ```

### **Step 2: Check Database**
1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **users**
3. Check if the signed-in user appears in the table
4. If yes, the automatic sync is working! 🎉

## 🔧 **Method 2: Manual Bulk Sync**

### **Option A: Using Browser Console**
1. Sign in to your app
2. Open browser console (F12)
3. Copy and paste the contents of `browser-sync-users.js`
4. Run: `syncCurrentUser()`

### **Option B: Using Server Endpoint**
1. Install Clerk SDK:
   ```bash
   npm install @clerk/clerk-sdk-node
   ```

2. Add the sync endpoint to your server:
   - Copy the contents of `server/sync-users-endpoint.js`
   - Add it to your `server/server.js` file

3. Start your server and call the endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/sync-users
   ```

## 📊 **Verify Sync Results**

### **Check Supabase Database**
1. Go to Supabase Dashboard → Table Editor → users
2. You should see all your Clerk users with:
   - `clerk_id` matching their Clerk user ID
   - `email` from their Clerk account
   - `subscription_tier` set to 'free'
   - `builds_used` and `remixes_used` set to 0
   - Proper limits set (5 builds, 10 remixes)

### **Test User Functionality**
1. Sign in with different users
2. Try creating a project
3. Check if usage limits are enforced
4. Verify subscription tier restrictions

## 🔍 **Troubleshooting**

### **Issue: Users not syncing**
- Check browser console for errors
- Verify JWT token is being generated
- Ensure RLS policies are correct
- Check Supabase connection

### **Issue: Permission denied**
- Make sure you're signed in as an admin
- Check Clerk JWT configuration
- Verify Supabase API keys

### **Issue: Database errors**
- Run the database setup scripts again
- Check for missing columns
- Verify table structure matches schema

## 🎉 **Success Indicators**

✅ Users appear in Supabase `users` table  
✅ Each user has proper subscription tier  
✅ Usage limits are enforced  
✅ Projects can be created/saved  
✅ No console errors during sign-in  

## 📞 **Next Steps**

Once users are synced:
1. Test the full user flow
2. Implement subscription upgrade flows
3. Set up Lemon Squeezy webhooks
4. Configure referral system
5. Deploy to production

## 🆘 **Need Help?**

If sync isn't working:
1. Check the browser console for errors
2. Verify your environment variables
3. Test with a single user first
4. Check Supabase logs for database errors 