-- Migration to fix JWT claim from 'sub' to 'user_id'
-- Run this in Supabase SQL Editor to update existing policies

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view all likes" ON project_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON project_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON project_likes;

DROP POLICY IF EXISTS "Users can view all views" ON project_views;
DROP POLICY IF EXISTS "Anyone can create views" ON project_views;

DROP POLICY IF EXISTS "Users can view their own saved projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can save projects" ON user_saved_projects;
DROP POLICY IF EXISTS "Users can remove their saved projects" ON user_saved_projects;

-- Recreate policies with correct user_id claim
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can view public projects" ON projects
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can view all likes" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON project_likes
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own likes" ON project_likes
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can view all views" ON project_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create views" ON project_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own saved projects" ON user_saved_projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can save projects" ON user_saved_projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can remove their saved projects" ON user_saved_projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id'); 