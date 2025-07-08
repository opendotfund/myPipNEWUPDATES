# Clerk + Supabase Setup Guide

## ✅ **What I Fixed**

I've updated the code to use Clerk's **default session tokens** instead of trying to create custom JWT templates. This is the correct approach according to Clerk's documentation.

## 🚀 **Next Steps**

### **Step 1: Run the RLS Fix Script**

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix-rls-development.sql`
4. **Run the script**

This will make RLS policies development-friendly and allow user creation.

### **Step 2: Test User Creation**

1. **Start your dev server**: `npm run dev`
2. **Sign up a new user** in your app
3. **Check the database** - users should now be created in the `users` table

### **Step 3: Access Admin Panel**

1. **Sign in with an admin email** (one of these):
   - `m3stastn@uwaterloo.ca`
   - `admin@mypip.com`
   - `your-admin-email@example.com`

2. **Click the "Users" button** in the top navbar (next to "Waitlist")

3. **Manage users**:
   - View all users
   - Change subscription tiers
   - Reset usage counts

## 🔧 **How It Works Now**

### **Authentication Flow**
1. User signs up/signs in with Clerk
2. Clerk generates a **default session token** (JWT)
3. Our code gets this token using `getToken({ template: 'supabase' })`
4. Token is passed to Supabase for authenticated operations
5. User data is synced to the database

### **No Custom JWT Template Needed**
- Clerk's default tokens already contain all necessary claims
- No need to create custom JWT templates
- Works out of the box with Supabase

## 🎯 **Key Changes Made**

1. **Updated Supabase Client**: Now accepts JWT tokens as parameters
2. **Fixed Database Service**: Uses authenticated client for user operations
3. **Updated User Sync Hook**: Gets JWT token from Clerk and passes it to database
4. **Added Admin Panel**: Full user management interface
5. **Updated User Type**: Added subscription and usage fields

## 🧪 **Testing**

### **Test User Sync**
```javascript
// Check browser console for these logs:
"Got JWT token from Clerk: true"
"User synced successfully: {user data}"
```

### **Test Admin Functions**
- Change user subscription tiers
- Reset user usage counts
- View all users in the admin panel

## 🔍 **Troubleshooting**

### **If users still aren't being created:**
1. Check browser console for errors
2. Verify RLS script was run successfully
3. Check Supabase logs for permission errors

### **If admin panel doesn't show:**
1. Make sure you're signed in with an admin email
2. Check that the admin email is in the allowed list in `App.tsx`

### **If JWT token is null:**
1. Make sure user is properly authenticated with Clerk
2. Check that Clerk is configured correctly

## 📝 **Environment Variables**

Make sure these are set in your `.env` file:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎉 **You're Ready!**

The user syncing should now work properly. Users will be created in the database when they sign up, and you can manage their subscriptions through the admin panel. 