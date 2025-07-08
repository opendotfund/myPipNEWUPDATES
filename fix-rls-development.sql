-- Fix RLS policies for development
-- This script makes RLS policies more permissive for development

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create permissive policies for development
CREATE POLICY "Allow all user operations for development" ON users
FOR ALL USING (true) WITH CHECK (true);

-- Drop existing project policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;

-- Create permissive project policies for development
CREATE POLICY "Allow all project operations for development" ON projects
FOR ALL USING (true) WITH CHECK (true);

-- Drop existing project_likes policies
DROP POLICY IF EXISTS "Users can like projects" ON project_likes;
DROP POLICY IF EXISTS "Users can unlike own likes" ON project_likes;

-- Create permissive project_likes policies for development
CREATE POLICY "Allow all project_likes operations for development" ON project_likes
FOR ALL USING (true) WITH CHECK (true);

-- Drop existing project_views policies
DROP POLICY IF EXISTS "Anyone can record project views" ON project_views;

-- Create permissive project_views policies for development
CREATE POLICY "Allow all project_views operations for development" ON project_views
FOR ALL USING (true) WITH CHECK (true);

-- Drop existing user_saved_projects policies
DROP POLICY IF EXISTS "Users can save projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can unsave own saved projects" ON user_saved_projects;

-- Create permissive user_saved_projects policies for development
CREATE POLICY "Allow all user_saved_projects operations for development" ON user_saved_projects
FOR ALL USING (true) WITH CHECK (true);

-- Drop existing waitlist policies
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist;
DROP POLICY IF EXISTS "Only admins can view waitlist" ON waitlist;
DROP POLICY IF EXISTS "Only admins can update waitlist" ON waitlist;

-- Create permissive waitlist policies for development
CREATE POLICY "Allow all waitlist operations for development" ON waitlist
FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_likes TO authenticated;
GRANT ALL ON project_views TO authenticated;
GRANT ALL ON user_saved_projects TO authenticated;
GRANT ALL ON waitlist TO authenticated;

-- Grant permissions to anon role for public operations
GRANT SELECT ON projects TO anon;
GRANT SELECT ON project_views TO anon;
GRANT INSERT ON waitlist TO anon;

-- Create a function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email IN ('m3stastn@uwaterloo.ca', 'admin@mypip.com', 'your-admin-email@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user email from JWT
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS text AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'email')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the setup
SELECT 'RLS policies updated for development' as status; 