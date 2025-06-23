# Database Setup Guide

This guide will help you set up the Supabase database integration for your myPip application.

## Prerequisites

1. A Supabase account and project
2. Your Supabase project URL and anon key (already provided)
3. Node.js and npm installed

## Step 1: Install Dependencies

Run the following command to install the Supabase client:

```bash
npm install @supabase/supabase-js
```

## Step 2: Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql` into the editor
4. Run the SQL commands

This will create:
- `users` table for storing user profiles
- `projects` table for storing app projects
- `project_likes` table for tracking likes
- `project_views` table for tracking views
- Row Level Security (RLS) policies for data protection
- Indexes for better performance

## Step 3: Configure Clerk Integration

1. In your Clerk dashboard, go to JWT Templates
2. Create a new JWT template for Supabase
3. Use the following template:

```json
{
  "role": "authenticated",
  "sub": "{{user.id}}"
}
```

4. Copy your Supabase JWT secret from your Supabase project settings
5. Add it to the Clerk JWT template configuration

## Step 4: Environment Variables

Create a `.env` file in your project root and add:

```
VITE_SUPABASE_URL=https://lrkimhssimcmzvhliqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA
```

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Sign up/sign in with Clerk
3. Create a new app
4. Save or share the app
5. Check the "My Pips" page to see your saved projects
6. Check the "Community" page to see shared projects

## Features Implemented

### User Management
- Automatic user profile creation when signing up
- User profile synchronization with Clerk
- Profile editing capabilities

### Project Management
- Save projects to database
- Share projects to community
- View user's projects in "My Pips"
- Delete and rename projects
- Public/private project visibility

### Community Features
- Browse public projects
- Search and filter projects
- Like/unlike projects
- View project statistics (likes, views)
- Project categories

### Security
- Row Level Security (RLS) policies
- User authentication required for sensitive operations
- Data isolation between users

## Database Schema Overview

### Users Table
- `id`: UUID primary key
- `clerk_id`: Clerk user ID (unique)
- `email`: User email
- `full_name`: User's full name
- `username`: Username
- `avatar_url`: Profile picture URL
- `bio`: User bio
- `created_at`, `updated_at`: Timestamps

### Projects Table
- `id`: UUID primary key
- `user_id`: Reference to user's clerk_id
- `name`: Project name
- `description`: Project description
- `prompt`: Original generation prompt
- `generated_code`: Generated Swift code
- `preview_html`: HTML preview
- `is_public`: Public visibility flag
- `allow_remix`: Remix permission flag
- `category`: Project category
- `likes_count`, `views_count`: Statistics
- `created_at`, `updated_at`: Timestamps

### Project Likes Table
- `id`: UUID primary key
- `project_id`: Reference to project
- `user_id`: Reference to user
- `created_at`: Timestamp

### Project Views Table
- `id`: UUID primary key
- `project_id`: Reference to project
- `user_id`: Reference to user (optional)
- `ip_address`: IP address for anonymous views
- `created_at`: Timestamp

## Troubleshooting

### Common Issues

1. **"Cannot find module '@supabase/supabase-js'"**
   - Run `npm install @supabase/supabase-js`

2. **Authentication errors**
   - Check that Clerk JWT template is configured correctly
   - Verify Supabase JWT secret is correct

3. **RLS policy errors**
   - Ensure RLS is enabled on all tables
   - Check that policies are created correctly

4. **Data not appearing**
   - Check browser console for errors
   - Verify user is authenticated
   - Check database permissions

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check that the database schema was created successfully 