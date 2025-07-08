// Browser-based Clerk to Supabase user sync
// Run this in your browser console when signed in to sync all users

async function syncClerkUsersToSupabase() {
  try {
    console.log('🔄 Starting Clerk to Supabase user sync...');
    
    // Check if user is signed in
    if (!window.Clerk || !window.Clerk.user) {
      console.error('❌ You must be signed in to run this sync');
      return;
    }
    
    // Get the JWT token
    const token = await window.Clerk.session.getToken();
    if (!token) {
      console.error('❌ No JWT token available');
      return;
    }
    
    console.log('✅ Got JWT token, starting sync...');
    
    // Get all users from Clerk (this requires admin access)
    // Note: This will only work if you have admin access to your Clerk instance
    const response = await fetch('/api/sync-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to sync users:', response.statusText);
      return;
    }
    
    const result = await response.json();
    console.log('📊 Sync result:', result);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Alternative: Manual sync for individual users
async function syncCurrentUser() {
  try {
    console.log('🔄 Syncing current user...');
    
    if (!window.Clerk || !window.Clerk.user) {
      console.error('❌ No user signed in');
      return;
    }
    
    const user = window.Clerk.user;
    const token = await window.Clerk.session.getToken();
    
    console.log('Current user:', user);
    console.log('Token available:', !!token);
    
    // This will trigger the user sync in your app
    console.log('✅ Current user sync should happen automatically when you sign in');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the sync
console.log('🚀 Clerk to Supabase User Sync');
console.log('Run syncClerkUsersToSupabase() to sync all users');
console.log('Run syncCurrentUser() to check current user sync'); 