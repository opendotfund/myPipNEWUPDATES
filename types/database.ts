export interface User {
  id: string
  clerk_id: string
  email: string
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  prompt: string
  generated_code: string
  preview_html: string
  is_public: boolean
  allow_remix: boolean
  category: string
  likes_count: number
  views_count: number
  remix_count: number
  original_project_id?: string
  created_at: string
  updated_at: string
}

export interface ProjectLike {
  id: string
  project_id: string
  user_id: string
  created_at: string
}

export interface ProjectView {
  id: string
  project_id: string
  user_id?: string
  ip_address?: string
  created_at: string
}

export interface UserSavedProject {
  id: string
  user_id: string
  project_id: string
  saved_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_likes: {
        Row: ProjectLike
        Insert: Omit<ProjectLike, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectLike, 'id' | 'created_at'>>
      }
      project_views: {
        Row: ProjectView
        Insert: Omit<ProjectView, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectView, 'id' | 'created_at'>>
      }
      user_saved_projects: {
        Row: UserSavedProject
        Insert: Omit<UserSavedProject, 'id' | 'saved_at'>
        Update: Partial<Omit<UserSavedProject, 'id' | 'saved_at'>>
      }
    }
  }
} 