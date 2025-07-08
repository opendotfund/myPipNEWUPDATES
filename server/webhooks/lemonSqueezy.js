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
const PRODUCT_TO_TIER_MAPPING = {
  // Update these with your actual Lemon Squeezy product IDs
  123456: 1, // Basic tier
  123457: 2, // Pro tier
  123458: 3, // Pro Plus tier
  123459: 4, // Enterprise tier
};

async function handleSubscriptionCreated(data, userId, email) {
  const { attributes } = data;
  
  // Determine tier based on product_id
  const tierId = PRODUCT_TO_TIER_MAPPING[attributes.product_id];
  if (!tierId) {
    throw new Error(`Unknown product ID: ${attributes.product_id}`);
  }
  
  const subscriptionData = {
    user_id: userId,
    tier_id: tierId,
    lemon_squeezy_subscription_id: attributes.id,
    status: attributes.status,
    current_period_start: new Date(attributes.created_at).toISOString(),
    current_period_end: new Date(attributes.renews_at).toISOString(),
    cancel_at_period_end: false
  };

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  console.log(`Subscription created for user ${userId}, tier ${tierId}`);
}

async function handleSubscriptionUpdated(data, userId) {
  const { attributes } = data;
  
  const updates = {
    status: attributes.status,
    current_period_end: new Date(attributes.renews_at).toISOString(),
    cancel_at_period_end: attributes.ends_at !== null
  };

  const { error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`Subscription updated for user ${userId}`);
}

async function handleSubscriptionCancelled(data, userId) {
  const { error } = await supabase
    .from('user_subscriptions')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  console.log(`Subscription cancelled for user ${userId}`);
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
      return res.status(400).json({ error: 'Invalid user_id' });
    }

    if (!email) {
      console.error('No email in webhook custom_data');
      return res.status(400).json({ error: 'Missing email' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format in webhook custom_data');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log(`Processing webhook: ${event_name} for user ${userId} (${email})`);

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

module.exports = {
  handleWebhook,
  verifyWebhookSignature
}; 