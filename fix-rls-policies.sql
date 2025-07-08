-- Fix RLS Policies for User Operations
-- This file fixes the Row Level Security policies that are blocking user creation and project operations

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on clerk_id" ON users;

-- Create proper RLS policies for users table
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on clerk_id" ON users
    FOR UPDATE USING (auth.role() = 'authenticated' AND clerk_id = auth.jwt() ->> 'sub');

-- Fix projects table RLS policies
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Users can view public projects" ON projects
    FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own projects" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

-- Fix user_usage table RLS policies
DROP POLICY IF EXISTS "Users can view their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can insert their own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON user_usage;

CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own usage" ON user_usage
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

-- Fix user_saved_projects table RLS policies
DROP POLICY IF EXISTS "Users can view their saved projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can save projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can unsave projects" ON user_saved_projects;

CREATE POLICY "Users can view their saved projects" ON user_saved_projects
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can save projects" ON user_saved_projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can unsave projects" ON user_saved_projects
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

-- Fix project_likes table RLS policies
DROP POLICY IF EXISTS "Users can view project likes" ON project_likes;
DROP POLICY IF EXISTS "Users can like projects" ON project_likes;
DROP POLICY IF EXISTS "Users can unlike projects" ON project_likes;

CREATE POLICY "Users can view project likes" ON project_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like projects" ON project_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can unlike projects" ON project_likes
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.jwt() ->> 'sub');

-- Fix project_views table RLS policies
DROP POLICY IF EXISTS "Users can view project views" ON project_views;
DROP POLICY IF EXISTS "Users can record project views" ON project_views;

CREATE POLICY "Users can view project views" ON project_views
    FOR SELECT USING (true);

CREATE POLICY "Users can record project views" ON project_views
    FOR INSERT WITH CHECK (true);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'projects', 'user_usage', 'user_saved_projects', 'project_likes', 'project_views')
ORDER BY tablename, policyname; 