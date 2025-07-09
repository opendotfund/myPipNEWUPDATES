import { createAuthenticatedSupabaseClient, supabase } from './supabaseClient'
import type { User, Project, ProjectLike, ProjectView, UserSavedProject, Waitlist } from '../types/database'

// Helper function to get subscription limits based on tier
function getSubscriptionLimits(tier: string): { buildsLimit: number; remixesLimit: number } {
  switch (tier) {
    case 'basic':
      return { buildsLimit: 50, remixesLimit: 25 };
    case 'pro':
      return { buildsLimit: 200, remixesLimit: 100 };
    case 'pro_plus':
      return { buildsLimit: 500, remixesLimit: 250 };
    case 'enterprise':
      return { buildsLimit: 1000, remixesLimit: 500 };
    default: // free tier
      return { buildsLimit: 5, remixesLimit: 3 };
  }
}

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
    console.log('Token provided:', !!token);
    
    try {
      // Always use the authenticated client for user operations
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      console.log('Using authenticated client:', !!token);
      
      // First, check if user already exists
      const { data: existingUser } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', userData.clerk_id)
        .single();

      if (existingUser) {
        // Update existing user - preserve subscription data
    const { data, error } = await client
      .from('users')
          .update({
            email: userData.email,
            full_name: userData.full_name || existingUser.full_name,
            username: userData.username || existingUser.username,
            avatar_url: userData.avatar_url || existingUser.avatar_url,
            bio: userData.bio || existingUser.bio,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', userData.clerk_id)
      .select()
          .single();

    if (error) {
          console.error('Error updating user:', error);
          console.error('Error details:', error.message, error.details, error.hint);
          return null;
        }

        console.log('User updated successfully:', data);
        return data;
      } else {
        // Create new user with default subscription tier
        const { data, error } = await client
          .from('users')
          .insert({
            clerk_id: userData.clerk_id,
            email: userData.email,
            full_name: userData.full_name || null,
            username: userData.username || null,
            avatar_url: userData.avatar_url || null,
            bio: userData.bio || null,
            subscription_tier: 'free', // Default to free tier
            subscription_status: 'active',
            builds_used: 0,
            remixes_used: 0,
            builds_limit: 5, // Free tier limit
            remixes_limit: 3, // Free tier limit
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user:', error);
          console.error('Error details:', error.message, error.details, error.hint);
          return null;
        }

        console.log('User created successfully with free tier:', data);
        
        // Initialize user usage for current month
        try {
          await client
            .from('user_usage')
            .insert({
              user_id: userData.clerk_id, // Use clerk_id (TEXT) instead of UUID
              month: new Date().toISOString().slice(0, 7), // Format: YYYY-MM
              builds_used: 0,
              remixes_used: 0
            });
          console.log('User usage initialized for new user');
        } catch (usageError) {
          console.warn('Could not initialize user usage:', usageError);
        }

        return data;
      }
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
      
      // Get the limits for the new tier
      const limits = getSubscriptionLimits(subscriptionData.subscription_tier);
      
      const { data, error } = await client
        .from('users')
        .update({
          ...subscriptionData,
          builds_limit: limits.buildsLimit,
          remixes_limit: limits.remixesLimit,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user subscription:', error);
        return null;
      }

      console.log(`Updated user ${clerkId} subscription to: ${subscriptionData.subscription_tier} with limits: ${limits.buildsLimit} builds, ${limits.remixesLimit} remixes`);
      return data;
    } catch (error) {
      console.error('Exception updating user subscription:', error);
      return null;
    }
  },

  // Record subscription transaction
  async recordSubscriptionTransaction(transactionData: {
    user_id: string // This is clerk_id (TEXT)
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
          user_id: transactionData.user_id, // Use clerk_id directly (TEXT)
          lemon_squeezy_order_id: transactionData.lemon_squeezy_order_id,
          lemon_squeezy_subscription_id: transactionData.lemon_squeezy_subscription_id,
          plan_tier: transactionData.plan_tier,
          amount: transactionData.amount,
          status: transactionData.status,
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
  },

  // Check if user can perform action (build/remix)
  async canUserPerformAction(clerkId: string, actionType: 'build' | 'remix', token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      // Get user with current usage
      const { data: user } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (!user) {
        console.error('User not found for action check:', clerkId);
        return false;
      }

      // Check limits based on action type
      if (actionType === 'build') {
        return user.builds_used < user.builds_limit;
      } else if (actionType === 'remix') {
        return user.remixes_used < user.remixes_limit;
      }

      return false;
    } catch (error) {
      console.error('Error checking user action limits:', error);
      return false;
    }
  },

  // Increment user usage
  async incrementUserUsage(clerkId: string, actionType: 'build' | 'remix', token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      // Get user
      const { data: user } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (!user) {
        console.error('User not found for usage increment:', clerkId);
        return false;
      }

      // Check if user can perform action
      if (!(await this.canUserPerformAction(clerkId, actionType, token))) {
        console.error(`User ${clerkId} has reached their ${actionType} limit`);
        return false;
      }

      // Update user usage
      const updateData: any = {};
      if (actionType === 'build') {
        updateData.builds_used = user.builds_used + 1;
      } else if (actionType === 'remix') {
        updateData.remixes_used = user.remixes_used + 1;
      }

      const { error: userError } = await client
        .from('users')
        .update(updateData)
        .eq('clerk_id', clerkId);

      if (userError) {
        console.error('Error updating user usage:', userError);
        return false;
      }

      // Update monthly usage tracking
      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const { data: existingUsage } = await client
        .from('user_usage')
        .select('*')
        .eq('user_id', clerkId) // Use clerk_id (TEXT) instead of user.id (UUID)
        .eq('month', currentMonth)
        .single();

      if (existingUsage) {
        // Update existing usage
        const usageUpdateData: any = {};
        if (actionType === 'build') {
          usageUpdateData.builds_used = existingUsage.builds_used + 1;
        } else if (actionType === 'remix') {
          usageUpdateData.remixes_used = existingUsage.remixes_used + 1;
        }

        const { error: usageError } = await client
          .from('user_usage')
          .update(usageUpdateData)
          .eq('id', existingUsage.id);

        if (usageError) {
          console.error('Error updating daily usage:', usageError);
        }
      } else {
        // Create new usage record for current month
        const usageData: any = {
          user_id: clerkId, // Use clerk_id (TEXT) instead of user.id (UUID)
          month: currentMonth,
          builds_used: actionType === 'build' ? 1 : 0,
          remixes_used: actionType === 'remix' ? 1 : 0
        };

        const { error: usageError } = await client
          .from('user_usage')
          .insert(usageData);

        if (usageError) {
          console.error('Error creating daily usage:', usageError);
        }
      }

      console.log(`Incremented ${actionType} usage for user ${clerkId}`);
      return true;
    } catch (error) {
      console.error('Error incrementing user usage:', error);
      return false;
    }
  },

  // Get user subscription info
  async getUserSubscriptionInfo(clerkId: string, token?: string): Promise<{
    tier: string;
    status: string;
    buildsUsed: number;
    buildsLimit: number;
    remixesUsed: number;
    remixesLimit: number;
    canBuild: boolean;
    canRemix: boolean;
  } | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data: user } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (!user) {
        return null;
      }

      const limits = getSubscriptionLimits(user.subscription_tier);
      const canBuild = user.builds_used < limits.buildsLimit;
      const canRemix = user.remixes_used < limits.remixesLimit;

      return {
        tier: user.subscription_tier,
        status: user.subscription_status,
        buildsUsed: user.builds_used,
        buildsLimit: limits.buildsLimit,
        remixesUsed: user.remixes_used,
        remixesLimit: limits.remixesLimit,
        canBuild: canBuild,
        canRemix: canRemix
      };
    } catch (error) {
      console.error('Error getting user subscription info:', error);
      return null;
    }
  },

  // Refresh user data from database
  async refreshUserData(clerkId: string, token?: string): Promise<User | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data: user, error } = await client
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        console.error('Error refreshing user data:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Exception refreshing user data:', error);
      return null;
    }
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
  }, token?: string): Promise<Project | null> {
    try {
      console.log('Creating project with data:', { ...projectData, generated_code: projectData.generated_code?.substring(0, 100) + '...' });
      console.log('Token provided:', !!token);
      
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      // Get user to check usage limits
      const { data: user, error: userError } = await client
        .from('users')
        .select('clerk_id, builds_used, builds_limit')
        .eq('clerk_id', projectData.user_id) // Use clerk_id instead of id
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return null;
      }

      if (!user) {
        console.error('User not found for project creation, clerk_id:', projectData.user_id);
        return null;
      }

      // Check if user can create a project
      if (user.builds_used >= user.builds_limit) {
        console.error(`User ${user.clerk_id} has reached their build limit (${user.builds_used}/${user.builds_limit})`);
        throw new Error('You have reached your build limit for this subscription tier. Please upgrade to create more projects.');
      }

      // Create the project
    const { data, error } = await client
      .from('projects')
        .insert({
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return null;
      }

      // Increment user usage
      await userService.incrementUserUsage(user.clerk_id, 'build', token);

      console.log('Project created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception during project creation:', error);
      throw error; // Re-throw to handle in the UI
    }
  },

  // Get user projects
  async getUserProjects(userId: string, token?: string): Promise<Project[]> {
    try {
      console.log('Getting user projects for user:', userId);
      
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
    const { data, error } = await client
      .from('projects')
        .select('*')
        .eq('user_id', userId) // This is now the Clerk ID
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting user projects:', error);
        return [];
      }

      console.log('User projects data:', data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        generated_code_length: p.generated_code?.length || 0,
        preview_html_length: p.preview_html?.length || 0,
        generated_code_preview: p.generated_code?.substring(0, 100) + '...',
        preview_html_preview: p.preview_html?.substring(0, 100) + '...'
      })));

      return data || [];
    } catch (error) {
      console.error('Exception getting user projects:', error);
      return [];
    }
  },

  // Get public projects
  async getTopLikedProjects(limit: number = 4): Promise<Project[]> {
    try {
      console.log('Getting top liked projects, limit:', limit);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user:users!projects_user_id_fkey(
            full_name,
            username
          )
        `)
        .eq('is_public', true)
        .order('likes_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting top liked projects:', error);
        return [];
      }

      // Transform the data to include user information
      const transformedData = data?.map((project: any) => ({
        ...project,
        user_full_name: project.user?.full_name,
        user_name: project.user?.username,
        likes_count: project.likes_count || 0,
        remix_count: project.remix_count || 0
      })) || [];

      console.log('Top liked projects data:', transformedData.map((p: any) => ({
        id: p.id,
        name: p.name,
        user_full_name: p.user_full_name,
        user_name: p.user_name,
        likes_count: p.likes_count,
        remix_count: p.remix_count
      })));

      return transformedData;
    } catch (error) {
      console.error('Exception getting top liked projects:', error);
      return [];
    }
  },

  async getPublicProjects(category?: string, search?: string): Promise<Project[]> {
    try {
      console.log('Getting public projects with category:', category, 'search:', search);
      
      let query = supabase
      .from('projects')
        .select(`
          *,
          user:users!projects_user_id_fkey(
            full_name,
            username
          )
        `)
      .eq('is_public', true)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });

    if (category && category !== 'All Categories') {
        query = query.eq('category', category);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

      const { data, error } = await query;

    if (error) {
        console.error('Error getting public projects:', error);
        return [];
    }

      // Transform the data to include user information
      const transformedData = data?.map((project: any) => ({
        ...project,
        user_full_name: project.user?.full_name,
        user_name: project.user?.username,
        likes_count: project.likes_count || 0,
        remix_count: project.remix_count || 0
      })) || [];

      console.log('Public projects data:', transformedData.map((p: any) => ({
        id: p.id,
        name: p.name,
        user_full_name: p.user_full_name,
        user_name: p.user_name,
        likes_count: p.likes_count,
        remix_count: p.remix_count,
        generated_code_length: p.generated_code?.length || 0,
        preview_html_length: p.preview_html?.length || 0
      })));

      return transformedData;
    } catch (error) {
      console.error('Exception getting public projects:', error);
      return [];
    }
  },

  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
      .from('projects')
        .select('*')
      .eq('id', projectId)
        .single();

    if (error) {
        console.error('Error getting project by ID:', error);
        return null;
    }

      return data;
    } catch (error) {
      console.error('Exception getting project by ID:', error);
      return null;
    }
  },

  // Update project
  async updateProject(projectId: string, updates: Partial<Project>, token?: string): Promise<Project | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
    const { data, error } = await client
      .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
      .eq('id', projectId)
      .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        return null;
    }

      return data;
    } catch (error) {
      console.error('Exception updating project:', error);
      return null;
    }
  },

  // Delete project
  async deleteProject(projectId: string, token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
    const { error } = await client
      .from('projects')
      .delete()
        .eq('id', projectId);

    if (error) {
        console.error('Error deleting project:', error);
        return false;
    }

      return true;
    } catch (error) {
      console.error('Exception deleting project:', error);
      return false;
    }
  },

  // Toggle project like
  async toggleProjectLike(projectId: string, userId: string, token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase;
      
    // Check if user already liked the project
    const { data: existingLike } = await client
      .from('project_likes')
        .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
        .single();

    if (existingLike) {
        // Unlike the project
      const { error } = await client
        .from('project_likes')
        .delete()
          .eq('id', existingLike.id);

      if (error) {
          console.error('Error unliking project:', error);
          return false;
      }

        // Decrement likes_count
        const { data: currentProject } = await client
          .from('projects')
          .select('likes_count')
          .eq('id', projectId)
          .single();
        
      if (currentProject) {
          await client
            .from('projects')
            .update({ 
              likes_count: Math.max(0, (currentProject.likes_count || 0) - 1),
              updated_at: new Date().toISOString()
            })
            .eq('id', projectId);
        }

        return true;
    } else {
        // Like the project
      const { error } = await client
        .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: userId
          });

      if (error) {
          console.error('Error liking project:', error);
          return false;
      }

        // Increment likes_count
        const { data: currentProject } = await client
          .from('projects')
          .select('likes_count')
          .eq('id', projectId)
          .single();
        
      if (currentProject) {
          await client
            .from('projects')
            .update({ 
              likes_count: (currentProject.likes_count || 0) + 1,
              updated_at: new Date().toISOString()
        })
            .eq('id', projectId);
    }

        return true;
      }
    } catch (error) {
      console.error('Exception toggling project like:', error);
      return false;
    }
  },

  // Record project view
  async recordProjectView(projectId: string, userId?: string, ipAddress?: string): Promise<void> {
    try {
      await supabase
      .from('project_views')
      .insert({
        project_id: projectId,
          user_id: userId || null,
          ip_address: ipAddress || null
        });
    } catch (error) {
      console.error('Exception recording project view:', error);
    }
  },

  // Save project to user's saved list
  async saveProject(projectId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
      .from('user_saved_projects')
        .insert({
          project_id: projectId,
          user_id: userId
        });

    if (error) {
        console.error('Error saving project:', error);
        return false;
    }

      return true;
    } catch (error) {
      console.error('Exception saving project:', error);
      return false;
    }
  },

  // Remove project from user's saved list
  async unsaveProject(projectId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
      .from('user_saved_projects')
      .delete()
      .eq('project_id', projectId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error unsaving project:', error);
        return false;
    }

      return true;
    } catch (error) {
      console.error('Exception unsaving project:', error);
      return false;
    }
  },

  // Get user's saved projects
  async getUserSavedProjects(userId: string): Promise<Project[]> {
    try {
      console.log('Getting saved projects for user:', userId);
      
      const { data, error } = await supabase
      .from('user_saved_projects')
      .select(`
        project_id,
        projects (
          id,
          name,
          description,
            category,
          is_public,
          allow_remix,
          likes_count,
          views_count,
          remix_count,
          created_at,
            updated_at,
            generated_code,
            preview_html,
            prompt,
            original_project_id,
            users (
              id,
              clerk_id,
              full_name,
              username
            )
        )
      `)
      .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting user saved projects:', error);
        return [];
      }

      console.log('Raw saved projects data:', data);

      // Transform the data to match Project type
      const transformedProjects = (data || []).map((item: any) => {
        const project = {
          id: item.projects.id,
          user_id: item.projects.users.clerk_id, // Use clerk_id instead of id
          name: item.projects.name,
          description: item.projects.description,
          prompt: item.projects.prompt || '',
          generated_code: item.projects.generated_code || '',
          preview_html: item.projects.preview_html || '',
          is_public: item.projects.is_public,
          allow_remix: item.projects.allow_remix,
          category: item.projects.category,
          original_project_id: item.projects.original_project_id,
          likes_count: item.projects.likes_count,
          views_count: item.projects.views_count,
          remix_count: item.projects.remix_count,
          created_at: item.projects.created_at,
          updated_at: item.projects.updated_at
        };
        
        console.log('Transformed project:', {
          id: project.id,
          name: project.name,
          generated_code_length: project.generated_code?.length || 0,
          preview_html_length: project.preview_html?.length || 0,
          generated_code_preview: project.generated_code?.substring(0, 100) + '...',
          preview_html_preview: project.preview_html?.substring(0, 100) + '...'
        });
        
        return project;
      });

      console.log('Returning', transformedProjects.length, 'saved projects');
      return transformedProjects;
    } catch (error) {
      console.error('Exception getting user saved projects:', error);
      return [];
    }
  },

  // Check if project is saved by user
  async isProjectSaved(projectId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
      .from('user_saved_projects')
        .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
        .single();

    if (error) {
        return false;
    }

      return !!data;
    } catch (error) {
      return false;
    }
  },

  // Remix a project
  async remixProject(originalProjectId: string, userId: string, newName?: string, token?: string): Promise<Project | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
    // Get the original project
      const originalProject = await this.getProjectById(originalProjectId);
    if (!originalProject) {
        console.error('Original project not found for remix');
        return null;
    }

      // Get user to check usage limits
      const { data: user } = await client
        .from('users')
        .select('clerk_id, remixes_used, remixes_limit')
        .eq('clerk_id', userId) // Use clerk_id instead of id
        .single();

      if (!user) {
        console.error('User not found for remix creation, clerk_id:', userId);
        return null;
      }

      // Check if user can remix
      if (user.remixes_used >= user.remixes_limit) {
        console.error(`User ${user.clerk_id} has reached their remix limit (${user.remixes_used}/${user.remixes_limit})`);
        throw new Error('You have reached your remix limit for this subscription tier. Please upgrade to create more remixes.');
    }

    // Create a new project based on the original
    const remixedProject = await this.createProject({
      user_id: userId,
      name: newName || `${originalProject.name} (Remix)`,
      description: originalProject.description,
      prompt: originalProject.prompt,
      generated_code: originalProject.generated_code,
      preview_html: originalProject.preview_html,
        is_public: false, // Remixes are private by default
        allow_remix: originalProject.allow_remix,
      category: originalProject.category,
      original_project_id: originalProjectId
      }, token);

      if (remixedProject) {
        // Increment user usage
        await userService.incrementUserUsage(user.clerk_id, 'remix', token);
        
        // Increment remix_count on the original project
        const { data: originalProject } = await supabase
          .from('projects')
          .select('remix_count')
          .eq('id', originalProjectId)
          .single();
        
        if (originalProject) {
          await supabase
            .from('projects')
            .update({ 
              remix_count: (originalProject.remix_count || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', originalProjectId);
        }
      }

      return remixedProject;
    } catch (error) {
      console.error('Exception during project remix:', error);
      throw error; // Re-throw to handle in the UI
    }
  }
} 