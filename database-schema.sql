-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  generated_code TEXT NOT NULL,
  preview_html TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  allow_remix BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'General',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  original_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project likes table
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Project views table
CREATE TABLE IF NOT EXISTS project_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(clerk_id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User saved projects table
CREATE TABLE IF NOT EXISTS user_saved_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_original_id ON projects(original_project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_projects_user_id ON user_saved_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_projects_project_id ON user_saved_projects(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- RLS Policies for projects table
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

-- RLS Policies for project_likes table
CREATE POLICY "Users can view all likes" ON project_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON project_likes
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can delete their own likes" ON project_likes
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- RLS Policies for project_views table
CREATE POLICY "Users can view all views" ON project_views
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create views" ON project_views
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_saved_projects table
CREATE POLICY "Users can view their own saved projects" ON user_saved_projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can save projects" ON user_saved_projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

CREATE POLICY "Users can remove their saved projects" ON user_saved_projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update remix count
CREATE OR REPLACE FUNCTION update_remix_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET remix_count = remix_count + 1 
    WHERE id = NEW.original_project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects 
    SET remix_count = GREATEST(0, remix_count - 1) 
    WHERE id = OLD.original_project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update remix count
CREATE TRIGGER update_remix_count_trigger 
  AFTER INSERT OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_remix_count(); 