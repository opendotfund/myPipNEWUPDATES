// Sync existing Clerk users to Supabase database
// Run this script to populate your users table with existing Clerk users

import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Configuration - Update these with your actual values
const SUPABASE_URL = 'your-supabase-url'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'your-supabase-anon-key'; // Replace with your Supabase anon key
const CLERK_SECRET_KEY = 'your-clerk-secret-key'; // Replace with your Clerk secret key

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncClerkUsersToSupabase() {
  try {
    console.log('🔄 Starting Clerk to Supabase user sync...');
    
    // Get all users from Clerk
    console.log('📥 Fetching users from Clerk...');
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500 // Adjust based on your user count
    });
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    
    // Process each user
    let successCount = 0;
    let errorCount = 0;
    
    for (const clerkUser of clerkUsers) {
      try {
        console.log(`Processing user: ${clerkUser.emailAddresses[0]?.emailAddress || clerkUser.id}`);
        
        // Prepare user data for Supabase
        const userData = {
          clerk_id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          full_name: clerkUser.fullName || null,
          username: clerkUser.username || null,
          avatar_url: clerkUser.imageUrl || null,
          bio: clerkUser.publicMetadata?.bio || null,
          subscription_tier: 'free', // Default to free tier
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
          console.error(`❌ Error syncing user ${clerkUser.id}:`, error);
          errorCount++;
        } else {
          console.log(`✅ Synced user: ${userData.email}`);
          successCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (userError) {
        console.error(`❌ Error processing user ${clerkUser.id}:`, userError);
        errorCount++;
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📈 Total processed: ${clerkUsers.length} users`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to sync. Check the errors above.');
    } else {
      console.log('\n🎉 All users synced successfully!');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
syncClerkUsersToSupabase()
  .then(() => {
    console.log('🏁 Sync completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  }); 