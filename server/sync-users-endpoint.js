// Server endpoint for syncing Clerk users to Supabase
// Add this to your server.js file

const { createClient } = require('@supabase/supabase-js');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Sync endpoint
app.post('/api/sync-users', async (req, res) => {
  try {
    console.log('🔄 Starting bulk user sync...');
    
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500
    });
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Process each user
    for (const clerkUser of clerkUsers) {
      try {
        const userData = {
          clerk_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          full_name: clerkUser.fullName || null,
          username: clerkUser.username || null,
          avatar_url: clerkUser.imageUrl || null,
          bio: clerkUser.publicMetadata?.bio || null,
          subscription_tier: 'free',
          subscription_status: 'active',
          builds_used: 0,
          remixes_used: 0,
          builds_limit: 5,
          remixes_limit: 10,
          created_at: new Date(clerkUser.createdAt).toISOString(),
          updated_at: new Date(clerkUser.updatedAt).toISOString()
        };
        
        // Insert or update user in Supabase
        const { error } = await supabase
          .from('users')
          .upsert(userData, { 
            onConflict: 'clerk_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`Error syncing user ${clerkUser.id}:`, error);
          errors.push({ userId: clerkUser.id, error: error.message });
          errorCount++;
        } else {
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (userError) {
        console.error(`Error processing user ${clerkUser.id}:`, userError);
        errors.push({ userId: clerkUser.id, error: userError.message });
        errorCount++;
      }
    }
    
    const result = {
      success: true,
      summary: {
        total: clerkUsers.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors
    };
    
    console.log('📊 Sync completed:', result.summary);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Individual user sync endpoint
app.post('/api/sync-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    const userData = {
      clerk_id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      full_name: clerkUser.fullName || null,
      username: clerkUser.username || null,
      avatar_url: clerkUser.imageUrl || null,
      bio: clerkUser.publicMetadata?.bio || null,
      subscription_tier: 'free',
      subscription_status: 'active',
      builds_used: 0,
      remixes_used: 0,
      builds_limit: 5,
      remixes_limit: 10,
      created_at: new Date(clerkUser.createdAt).toISOString(),
      updated_at: new Date(clerkUser.updatedAt).toISOString()
    };
    
    // Insert or update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'clerk_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.json({
        success: true,
        user: data
      });
    }
    
  } catch (error) {
    console.error('❌ User sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}); 