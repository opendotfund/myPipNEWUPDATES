import { createAuthenticatedSupabaseClient, supabase } from './supabaseClient'
import type { User, Project, ProjectLike, ProjectView, UserSavedProject, Waitlist } from '../types/database'

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
  }, token?: string): Promise<User | null> {
    console.log('Upserting user to database:', { clerk_id: userData.clerk_id, email: userData.email });
    
    try {
      // Always use the authenticated client for user operations
      const client = createAuthenticatedSupabaseClient(token || '')
      
      const { data, error } = await client
        .from('users')
        .upsert({
          clerk_id: userData.clerk_id,
          email: userData.email,
          full_name: userData.full_name || null,
          username: userData.username || null,
          avatar_url: userData.avatar_url || null,
          bio: userData.bio || null,
          subscription_tier: 'basic', // Default to basic tier
          subscription_status: 'active',
          builds_used: 0,
          remixes_used: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'clerk_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user:', error);
        return null;
      }

      console.log('User upserted successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception during user upsert:', error);
      return null;
    }
  },

  // Get user by Clerk ID
  async getUserByClerkId(clerkId: string, token?: string): Promise<User | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        console.error('Error getting user by Clerk ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception getting user by Clerk ID:', error);
      return null;
    }
  },

  // Get user by email
  async getUserByEmail(email: string, token?: string): Promise<User | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error getting user by email:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception getting user by email:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(clerkId: string, updates: {
    full_name?: string
    username?: string
    avatar_url?: string
    bio?: string
  }, token?: string): Promise<User | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception updating user profile:', error);
      return null;
    }
  },

  // Update user subscription (admin function)
  async updateUserSubscription(clerkId: string, subscriptionData: {
    subscription_tier: string
    subscription_status?: string
    lemon_squeezy_customer_id?: string
    lemon_squeezy_subscription_id?: string
  }, token?: string): Promise<User | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('users')
        .update({
          ...subscriptionData,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user subscription:', error);
        return null;
      }

      console.log(`Updated user ${clerkId} subscription to: ${subscriptionData.subscription_tier}`);
      return data;
    } catch (error) {
      console.error('Exception updating user subscription:', error);
      return null;
    }
  },

  // Record subscription transaction
  async recordSubscriptionTransaction(transactionData: {
    user_id: string
    lemon_squeezy_order_id: string
    lemon_squeezy_subscription_id?: string
    plan_tier: string
    amount: number
    status: string
  }, token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { error } = await client
        .from('subscription_transactions')
        .insert({
          ...transactionData,
          transaction_date: new Date().toISOString()
        });

      if (error) {
        console.error('Error recording subscription transaction:', error);
        return false;
      }

      console.log('Subscription transaction recorded successfully');
      return true;
    } catch (error) {
      console.error('Exception recording subscription transaction:', error);
      return false;
    }
  },

  // Get subscription plans
  async getSubscriptionPlans(token?: string): Promise<any[]> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error getting subscription plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception getting subscription plans:', error);
      return [];
    }
  },

  // Get all users (admin only)
  async getAllUsers(token?: string): Promise<User[]> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception getting all users:', error);
      return [];
    }
  },

  // Sync existing Clerk users to database
  async syncExistingUsers(clerkUsers: Array<{
    id: string
    emailAddresses: Array<{ emailAddress: string }>
    firstName?: string
    lastName?: string
    username?: string
    imageUrl?: string
  }>, token?: string): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const clerkUser of clerkUsers) {
      try {
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) {
          failed++;
          continue;
        }

        const fullName = [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(' ');

        const result = await this.upsertUser({
          clerk_id: clerkUser.id,
          email,
          full_name: fullName || undefined,
          username: clerkUser.username || undefined,
          avatar_url: clerkUser.imageUrl || undefined
        }, token);

        if (result) {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error syncing user:', clerkUser.id, error);
        failed++;
      }
    }

    return { success, failed };
  }
};

// Waitlist operations
export const waitlistService = {
  // Join the waitlist
  async joinWaitlist(email: string, source: string = 'v2_popup'): Promise<Waitlist | null> {
    const { data, error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim(), source })
      .select()
      .single()

    if (error) {
      console.error('Error joining waitlist:', error)
      return null
    }

    return data
  },

  // Check if email is already on waitlist
  async isEmailOnWaitlist(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error) {
      console.error('Error checking waitlist status:', error)
      return false
    }

    return !!data
  },

  // Get all waitlist entries (admin only)
  async getAllWaitlistEntries(): Promise<Waitlist[]> {
    const { data, error } = await supabase
      .from('waitlist')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting waitlist entries:', error)
      return []
    }

    return data || []
  },

  // Get waitlist statistics
  async getWaitlistStats(): Promise<{ total: number; today: number; thisWeek: number }> {
    const { data: totalData, error: totalError } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact' })

    if (totalError) {
      console.error('Error getting total waitlist count:', totalError)
      return { total: 0, today: 0, thisWeek: 0 }
    }

    const { data: todayData, error: todayError } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date().toISOString().split('T')[0])

    if (todayError) {
      console.error('Error getting today\'s waitlist count:', todayError)
      return { total: totalData?.length || 0, today: 0, thisWeek: 0 }
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { data: weekData, error: weekError } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact' })
      .gte('created_at', oneWeekAgo.toISOString())

    if (weekError) {
      console.error('Error getting this week\'s waitlist count:', weekError)
      return { 
        total: totalData?.length || 0, 
        today: todayData?.length || 0, 
        thisWeek: 0 
      }
    }

    return {
      total: totalData?.length || 0,
      today: todayData?.length || 0,
      thisWeek: weekData?.length || 0
    }
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
    const { data, error } = await supabase
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
    console.log('Loading user projects for:', userId);
    
    const { data, error } = await supabase
      .from('projects')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting user projects:', error)
      return []
    }

    console.log('User projects loaded:', data?.length || 0, 'projects');
    return data || []
  },

  // Get public projects for community feed
  async getPublicProjects(category?: string, search?: string): Promise<Project[]> {
    console.log('Loading public projects...', { category, search });
    
    let query = supabase
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

    console.log('Public projects loaded:', data?.length || 0, 'projects');
    return data || []
  },

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    const { error } = await supabase
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
    const { data: existingLike } = await supabase
      .from('project_likes')
      .select()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
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
      const { error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase
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
    console.log('Loading saved projects for user:', userId);
    
    const { data, error } = await supabase
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

    const projects = data?.map(item => item.projects).filter(Boolean) || []
    console.log('Saved projects loaded:', projects.length, 'projects');
    return projects as unknown as Project[]
  },

  // Check if user has saved a project
  async isProjectSaved(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
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