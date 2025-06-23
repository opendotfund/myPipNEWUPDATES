import { createClerkSupabaseClient } from './supabaseClient'
import type { User, Project, ProjectLike, ProjectView, UserSavedProject } from '../types/database'

const client = createClerkSupabaseClient()

// User operations
export const userService = {
  // Create or update user when they sign up/sign in
  async upsertUser(userData: {
    clerk_id: string
    email: string
    full_name?: string
    username?: string
    avatar_url?: string
    bio?: string
  }): Promise<User | null> {
    const { data, error } = await client
      .from('users')
      .upsert(userData, { onConflict: 'clerk_id' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting user:', error)
      return null
    }

    return data
  },

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    const { data, error } = await client
      .from('users')
      .select()
      .eq('clerk_id', clerkId)
      .single()

    if (error) {
      console.error('Error getting user:', error)
      return null
    }

    return data
  },

  // Update user profile
  async updateUser(clerkId: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('clerk_id', clerkId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data
  }
}

// Project operations
export const projectService = {
  // Create a new project
  async createProject(projectData: {
    user_id: string
    name: string
    description: string
    prompt: string
    generated_code: string
    preview_html: string
    is_public: boolean
    allow_remix: boolean
    category: string
    original_project_id?: string
  }): Promise<Project | null> {
    const { data, error } = await client
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return null
    }

    return data
  },

  // Get user's projects
  async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await client
      .from('projects')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user projects:', error)
      return []
    }

    return data || []
  },

  // Get public projects for community feed
  async getPublicProjects(category?: string, search?: string): Promise<Project[]> {
    let query = client
      .from('projects')
      .select()
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'All Categories') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting public projects:', error)
      return []
    }

    return data || []
  },

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await client
      .from('projects')
      .select()
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('Error getting project:', error)
      return null
    }

    return data
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    const { data, error } = await client
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return null
    }

    return data
  },

  // Delete project
  async deleteProject(projectId: string): Promise<boolean> {
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return false
    }

    return true
  },

  // Like/unlike project
  async toggleProjectLike(projectId: string, userId: string): Promise<boolean> {
    // Check if user already liked the project
    const { data: existingLike } = await client
      .from('project_likes')
      .select()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await client
        .from('project_likes')
        .delete()
        .eq('id', existingLike.id)

      if (error) {
        console.error('Error unliking project:', error)
        return false
      }

      // Decrease likes count
      const currentProject = await this.getProjectById(projectId)
      if (currentProject) {
        await this.updateProject(projectId, {
          likes_count: Math.max(0, currentProject.likes_count - 1)
        })
      }
    } else {
      // Like
      const { error } = await client
        .from('project_likes')
        .insert({ project_id: projectId, user_id: userId })

      if (error) {
        console.error('Error liking project:', error)
        return false
      }

      // Increase likes count
      const currentProject = await this.getProjectById(projectId)
      if (currentProject) {
        await this.updateProject(projectId, {
          likes_count: currentProject.likes_count + 1
        })
      }
    }

    return true
  },

  // Record project view
  async recordProjectView(projectId: string, userId?: string, ipAddress?: string): Promise<void> {
    const { error } = await client
      .from('project_views')
      .insert({
        project_id: projectId,
        user_id: userId,
        ip_address: ipAddress
      })

    if (error) {
      console.error('Error recording project view:', error)
      return
    }

    // Increase views count
    const currentProject = await this.getProjectById(projectId)
    if (currentProject) {
      await this.updateProject(projectId, {
        views_count: currentProject.views_count + 1
      })
    }
  },

  // Save project to user's account
  async saveProject(projectId: string, userId: string): Promise<boolean> {
    const { error } = await client
      .from('user_saved_projects')
      .insert({ project_id: projectId, user_id: userId })

    if (error) {
      console.error('Error saving project:', error)
      return false
    }

    return true
  },

  // Remove project from user's saved projects
  async unsaveProject(projectId: string, userId: string): Promise<boolean> {
    const { error } = await client
      .from('user_saved_projects')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing saved project:', error)
      return false
    }

    return true
  },

  // Get user's saved projects
  async getUserSavedProjects(userId: string): Promise<Project[]> {
    const { data, error } = await client
      .from('user_saved_projects')
      .select(`
        project_id,
        projects (
          id,
          user_id,
          name,
          description,
          prompt,
          generated_code,
          preview_html,
          is_public,
          allow_remix,
          category,
          likes_count,
          views_count,
          remix_count,
          original_project_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Error getting saved projects:', error)
      return []
    }

    return data?.map(item => item.projects).filter(Boolean) || []
  },

  // Check if user has saved a project
  async isProjectSaved(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await client
      .from('user_saved_projects')
      .select()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return false
    }

    return !!data
  },

  // Remix a project (create a copy)
  async remixProject(originalProjectId: string, userId: string, newName?: string): Promise<Project | null> {
    // Get the original project
    const originalProject = await this.getProjectById(originalProjectId)
    if (!originalProject) {
      console.error('Original project not found')
      return null
    }

    // Check if remixing is allowed
    if (!originalProject.allow_remix) {
      console.error('Remixing not allowed for this project')
      return null
    }

    // Create a new project based on the original
    const remixedProject = await this.createProject({
      user_id: userId,
      name: newName || `${originalProject.name} (Remix)`,
      description: originalProject.description,
      prompt: originalProject.prompt,
      generated_code: originalProject.generated_code,
      preview_html: originalProject.preview_html,
      is_public: false, // Remixes start as private
      allow_remix: true,
      category: originalProject.category,
      original_project_id: originalProjectId
    })

    return remixedProject
  }
} 