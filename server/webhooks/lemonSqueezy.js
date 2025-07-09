const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://lrkimhssimcmzvhliqbp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lemon Squeezy webhook secret
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.warn('No webhook secret configured, skipping signature verification');
    return true;
  }

  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Map Lemon Squeezy product IDs to tier IDs
// These are the actual product IDs from your Lemon Squeezy store
const PRODUCT_TO_TIER_MAPPING = {
  568025: 1, // Basic tier
  568028: 2, // Pro tier
  568031: 3, // Pro Plus tier
  568029: 4, // Enterprise tier
};

async function handleSubscriptionCreated(data, userId, email) {
  const { attributes } = data;
  
  // Determine tier based on product_id
  const tierId = PRODUCT_TO_TIER_MAPPING[attributes.product_id];
  if (!tierId) {
    throw new Error(`Unknown product ID: ${attributes.product_id}`);
  }
  
  // Map tier ID to subscription tier name
  const tierMapping = {
    1: 'basic',
    2: 'pro', 
    3: 'pro_plus',
    4: 'enterprise'
  };
  
  const subscriptionTier = tierMapping[tierId];
  if (!subscriptionTier) {
    throw new Error(`Unknown tier ID: ${tierId}`);
  }
  
  // Get subscription limits based on tier
  const getSubscriptionLimits = (tier) => {
    switch (tier) {
      case 'basic':
        return { buildsLimit: 50, remixesLimit: 25 };
      case 'pro':
        return { buildsLimit: 200, remixesLimit: 100 };
      case 'pro_plus':
        return { buildsLimit: 500, remixesLimit: 250 };
      case 'enterprise':
        return { buildsLimit: 1000, remixesLimit: 500 };
      default:
        return { buildsLimit: 5, remixesLimit: 3 };
    }
  };
  
  const limits = getSubscriptionLimits(subscriptionTier);
  
  // Update main users table with new subscription info
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: subscriptionTier,
      subscription_status: 'active',
      lemon_squeezy_subscription_id: attributes.id,
      builds_limit: limits.buildsLimit,
      remixes_limit: limits.remixesLimit,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_id', userId);

  if (userError) {
    console.error('Error updating user subscription in users table:', userError);
    throw userError;
  }

  console.log(`Subscription created for user ${userId}, tier ${subscriptionTier} with limits: ${limits.buildsLimit} builds, ${limits.remixesLimit} remixes`);
}

async function handleSubscriptionUpdated(data, userId) {
  const { attributes } = data;
  
  const updates = {
    subscription_status: attributes.status,
    updated_at: new Date().toISOString()
  };

  // If subscription is cancelled, reset to free tier
  if (attributes.ends_at !== null) {
    updates.subscription_tier = 'free';
    updates.builds_limit = 5;
    updates.remixes_limit = 3;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('clerk_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionCancelled(data, userId) {
  // Reset user to free tier in main users table
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'active',
      lemon_squeezy_subscription_id: null,
      builds_limit: 5,
      remixes_limit: 3,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_id', userId);

  if (userError) {
    console.error('Error resetting user to free tier:', userError);
    throw userError;
  }

  console.log(`Subscription cancelled for user ${userId}, reset to free tier`);
}

async function handleOrderCreated(data, userId, email) {
  // Handle one-time purchases if needed
  console.log('Order created:', data);
}

// Main webhook handler
async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event_name, data, meta } = req.body;
    const userId = meta.custom_data?.user_id;
    const email = meta.custom_data?.email;

    // Validate required user data
    if (!userId) {
      console.error('No user_id in webhook custom_data');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    if (!userId.trim()) {
      console.error('Empty user_id in webhook custom_data');
      return res.status(400).json({ error: 'Empty user_id' });
    }

    console.log(`Processing webhook: ${event_name} for user: ${userId}`);

    // Handle different webhook events
    switch (event_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(data, userId, email);
        break;
      case 'subscription_updated':
        await handleSubscriptionUpdated(data, userId);
        break;
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data, userId);
        break;
      case 'order_created':
        await handleOrderCreated(data, userId, email);
        break;
      default:
        console.log(`Unhandled webhook event: ${event_name}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { handleWebhook }; 