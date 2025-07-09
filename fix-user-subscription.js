import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values
const supabaseUrl = 'https://lrkimhssimcmzvhliqbp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MTk5NSwiZXhwIjoyMDY2MTI3OTk1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get subscription limits
function getSubscriptionLimits(tier) {
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

async function fixUserSubscription() {
  const userEmail = 'sigma44665467766986@proton.me';
  
  try {
    console.log(`Fixing subscription for user: ${userEmail}`);
    
    // First, check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', { clerk_id: user.clerk_id, current_tier: user.subscription_tier });
    
    // Update user to basic tier with correct limits
    const limits = getSubscriptionLimits('basic');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'basic',
        subscription_status: 'active',
        builds_limit: limits.buildsLimit,
        remixes_limit: limits.remixesLimit,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', user.clerk_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user subscription:', updateError);
      return;
    }
    
    console.log('Successfully updated user subscription to basic tier');
    console.log('New limits:', { builds: limits.buildsLimit, remixes: limits.remixesLimit });
    
    // Also create/update subscription record
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.clerk_id,
        tier_id: 1, // Basic tier
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false
      }, { onConflict: 'user_id' });
    
    if (subscriptionError) {
      console.error('Error creating subscription record:', subscriptionError);
    } else {
      console.log('Successfully created subscription record');
    }
    
    console.log('User subscription fixed successfully!');
    
  } catch (error) {
    console.error('Error fixing user subscription:', error);
  }
}

// Run the fix
fixUserSubscription(); 