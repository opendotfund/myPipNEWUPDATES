import { createAuthenticatedSupabaseClient } from './supabaseClient';

const supabase = createAuthenticatedSupabaseClient('');

export interface LemonSqueezyWebhook {
  event_name: string;
  data: {
    id: number;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      order_item_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      status: string;
      status_formatted: string;
      card_brand: string;
      card_last_four: string;
      trial_ends_at: string | null;
      renews_at: string;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      email?: string;
      referral_code?: string;
    };
  };
}

export interface SubscriptionTier {
  id: number;
  tier_name: string;
  builds_per_month: number;
  remixes_per_month: number;
  price_monthly: string;
  price_yearly: string;
  features: {
    support: string;
    ai_models: string[];
    pay_per_use?: boolean;
    unlimited_remixes?: boolean;
  };
}

export interface AffiliateStats {
  totalVisits: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
  averageOrderValue: number;
  recentConversions: Array<{
    id: string;
    converted_at: string;
    order_value: number;
    commission_amount: number;
    status: string;
  }>;
}

export class LemonSqueezyService {
  private static instance: LemonSqueezyService;
  private apiKey: string;

  private constructor() {
    this.apiKey = import.meta.env.VITE_LEMON_SQUEEZY_API_KEY || '';
  }

  public static getInstance(): LemonSqueezyService {
    if (!LemonSqueezyService.instance) {
      LemonSqueezyService.instance = new LemonSqueezyService();
    }
    return LemonSqueezyService.instance;
  }

  // Get subscription tiers from Supabase
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching subscription tiers:', error);
      throw error;
    }

    return data || [];
  }

  // Get user's current subscription
  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_tiers (*)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user subscription:', error);
      throw error;
    }

    return data;
  }

  // Get user's usage for current month
  async getUserUsage(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user usage:', error);
      throw error;
    }

    return data || {
      builds_used: 0,
      remixes_used: 0,
      month: currentMonth
    };
  }

  // Check if user can perform an action (build/remix)
  async canPerformAction(userId: string, action: 'build' | 'remix'): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      const usage = await this.getUserUsage(userId);

      if (!subscription) {
        return false; // No subscription
      }

      const tier = subscription.subscription_tiers;
      
      if (action === 'build') {
        return usage.builds_used < tier.builds_per_month;
      } else if (action === 'remix') {
        if (tier.remixes_per_month === -1) {
          return true; // Unlimited remixes
        }
        return usage.remixes_used < tier.remixes_per_month;
      }

      return false;
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  }

  // Increment usage for a user
  async incrementUsage(userId: string, action: 'build' | 'remix'): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: existingUsage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (existingUsage) {
      // Update existing usage
      const updates: any = {};
      if (action === 'build') {
        updates.builds_used = existingUsage.builds_used + 1;
      } else if (action === 'remix') {
        updates.remixes_used = existingUsage.remixes_used + 1;
      }

      const { error } = await supabase
        .from('user_usage')
        .update(updates)
        .eq('id', existingUsage.id);

      if (error) {
        console.error('Error updating usage:', error);
        throw error;
      }
    } else {
      // Create new usage record
      const newUsage: any = {
        user_id: userId,
        month: currentMonth,
        builds_used: action === 'build' ? 1 : 0,
        remixes_used: action === 'remix' ? 1 : 0
      };

      const { error } = await supabase
        .from('user_usage')
        .insert(newUsage);

      if (error) {
        console.error('Error creating usage record:', error);
        throw error;
      }
    }
  }

  // Handle Lemon Squeezy webhooks
  async handleWebhook(webhook: LemonSqueezyWebhook): Promise<void> {
    const { event_name, data, meta } = webhook;
    const userId = meta.custom_data?.user_id;
    const email = meta.custom_data?.email;
    const referralCode = meta.custom_data?.referral_code;

    console.log('Processing webhook:', event_name, { userId, email, referralCode });

    try {
      switch (event_name) {
        case 'subscription_created':
          if (userId) {
            await this.handleSubscriptionCreated(data, userId, email, referralCode);
          }
          break;
        case 'subscription_updated':
          if (userId) {
            await this.handleSubscriptionUpdated(data, userId);
          }
          break;
        case 'subscription_cancelled':
          if (userId) {
            await this.handleSubscriptionCancelled(data, userId);
          }
          break;
        case 'order_created':
          if (userId) {
            await this.handleOrderCreated(data, userId, email, referralCode);
          }
          break;
        default:
          console.log('Unhandled webhook event:', event_name);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(data: any, userId: string, email?: string, referralCode?: string) {
    const { attributes } = data;
    
    // Get tier ID from product mapping
    const tierId = await this.getTierIdFromProduct(attributes.product_id, attributes.variant_id);
    
    const subscriptionData = {
      user_id: userId,
      tier_id: tierId,
      lemon_squeezy_subscription_id: attributes.id.toString(),
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

    // Track referral conversion if referral code exists
    if (referralCode && userId) {
      await this.trackReferralConversion(referralCode, userId, this.getOrderValue(attributes), attributes.id.toString());
    }
  }

  private async handleSubscriptionUpdated(data: any, userId: string) {
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
  }

  private async handleSubscriptionCancelled(data: any, userId: string) {
    const { error } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  private async handleOrderCreated(data: any, userId: string, email?: string, referralCode?: string) {
    const { attributes } = data;
    
    // Track referral conversion if referral code exists
    if (referralCode && userId) {
      await this.trackReferralConversion(referralCode, userId, this.getOrderValue(attributes), attributes.id.toString());
    }
  }

  private getOrderValue(attributes: any): number {
    // Extract order value from attributes
    // This might need adjustment based on your Lemon Squeezy setup
    return parseFloat(attributes.total_formatted?.replace(/[^0-9.]/g, '') || '0');
  }

  private async getTierIdFromProduct(productId: number, variantId: number): Promise<number> {
    // Map Lemon Squeezy product/variant IDs to your tier IDs
    // You'll need to configure this mapping based on your Lemon Squeezy setup
    
    // IMPORTANT: Replace these with your actual Lemon Squeezy product IDs
    // To find these, go to your Lemon Squeezy dashboard > Products > click on each product
    // The product ID will be in the URL or in the product details
    const productMapping: { [key: number]: number } = {
      568025: 1, // Basic tier
      568028: 2, // Pro tier
      568031: 3, // Pro Plus tier
      568029: 4, // Enterprise tier
    };

    const tierId = productMapping[productId];
    if (!tierId) {
      console.error(`Unknown product ID: ${productId}. Please update the product mapping in lemonSqueezyService.ts`);
      throw new Error(`Unknown product ID: ${productId}. Please update the product mapping.`);
    }

    return tierId;
  }

  // Create checkout URL for a specific tier with referral tracking
  createCheckoutUrl(tierId: number, userId: string, email: string, referralCode?: string): string {
    // Validate required parameters
    if (!userId || !email) {
      throw new Error('User ID and email are required to create checkout URL');
    }

    if (!userId.trim() || !email.trim()) {
      throw new Error('User ID and email cannot be empty');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address format');
    }

    const tierMapping: { [key: number]: string } = {
      1: 'https://mypip.lemonsqueezy.com/buy/e210a879-e5ce-4682-8dd6-b00dd56312f2', // Basic
      2: 'https://mypip.lemonsqueezy.com/buy/b0e37f2f-9385-471f-a4cb-ca24b1ff7108', // Pro
      3: 'https://mypip.lemonsqueezy.com/buy/570daf7c-d83f-4f80-8844-8c295955af16', // Pro Plus
      4: 'https://mypip.lemonsqueezy.com/buy/96500a66-befe-4016-be3b-ae691ad87b3f', // Enterprise
    };

    const baseUrl = tierMapping[tierId];
    if (!baseUrl) {
      throw new Error(`Unknown tier ID: ${tierId}`);
    }

    // Add custom data to track user and referral
    const url = new URL(baseUrl);
    url.searchParams.set('checkout[custom][user_id]', userId);
    url.searchParams.set('checkout[custom][email]', email);
    
    if (referralCode) {
      url.searchParams.set('checkout[custom][referral_code]', referralCode);
      url.searchParams.set('aff', referralCode); // Lemon Squeezy affiliate parameter
    }

    return url.toString();
  }

  // Generate or get user's referral code
  async generateUserReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has a referral code
      const { data: existingCode } = await supabase
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single();

      if (existingCode) {
        return existingCode.referral_code;
      }

      // Generate new referral code using database function
      const { data, error } = await supabase
        .rpc('generate_referral_code', { user_uuid: userId });

      if (error) {
        console.error('Error generating referral code:', error);
        throw error;
      }

      const referralCode = data;

      // Save to database
      const { error: insertError } = await supabase
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          is_active: true
        });

      if (insertError) {
        console.error('Error saving referral code:', error);
        throw insertError;
      }

      return referralCode;
    } catch (error) {
      console.error('Error generating user referral code:', error);
      throw error;
    }
  }

  // Track referral visit
  async trackReferralVisit(referralCode: string, visitorData?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('referral_visits')
        .insert({
          referral_code: referralCode,
          visitor_ip: visitorData?.ip || null,
          user_agent: visitorData?.userAgent || null,
          referrer: visitorData?.referrer || null
        });

      if (error) {
        console.error('Error tracking referral visit:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error tracking referral visit:', error);
      return false;
    }
  }

  // Track referral conversion
  async trackReferralConversion(
    referralCode: string, 
    convertedUserId: string, 
    orderValue: number, 
    lemonSqueezyOrderId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('track_referral_conversion', {
          p_referral_code: referralCode,
          p_converted_user_id: convertedUserId,
          p_order_value: orderValue,
          p_lemon_squeezy_order_id: lemonSqueezyOrderId
        });

      if (error) {
        console.error('Error tracking referral conversion:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error tracking referral conversion:', error);
      throw error;
    }
  }

  // Get comprehensive affiliate stats
  async getAffiliateStats(userId: string): Promise<AffiliateStats> {
    try {
      // Get user's referral code
      const { data: referralCode } = await supabase
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single();

      if (!referralCode) {
        return {
          totalVisits: 0,
          totalConversions: 0,
          totalEarnings: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          recentConversions: []
        };
      }

      // Get visit count
      const { count: visits } = await supabase
        .from('referral_visits')
        .select('*', { count: 'exact' })
        .eq('referral_code', referralCode.referral_code);

      // Get conversion count and details
      const { data: conversions, count: conversionCount } = await supabase
        .from('referral_conversions')
        .select('*', { count: 'exact' })
        .eq('referral_code', referralCode.referral_code)
        .order('converted_at', { ascending: false })
        .limit(10);

      // Get total earnings
      const { data: earnings } = await supabase
        .from('affiliate_earnings')
        .select('amount')
        .eq('affiliate_user_id', userId)
        .eq('status', 'paid');

      const totalEarnings = earnings?.reduce((sum, earning) => sum + parseFloat(earning.amount), 0) || 0;
      const totalVisits = visits || 0;
      const totalConversions = conversionCount || 0;
      const conversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;
      const averageOrderValue = totalConversions > 0 ? 
        conversions?.reduce((sum, conv) => sum + parseFloat(conv.order_value), 0) / totalConversions : 0;

      const recentConversions = conversions?.map(conv => ({
        id: conv.id,
        converted_at: conv.converted_at,
        order_value: parseFloat(conv.order_value),
        commission_amount: parseFloat(conv.commission_amount),
        status: conv.status
      })) || [];

      return {
        totalVisits,
        totalConversions,
        totalEarnings,
        conversionRate,
        averageOrderValue,
        recentConversions
      };
    } catch (error) {
      console.error('Error getting affiliate stats:', error);
      throw error;
    }
  }

  // Sign up user as an affiliate
  async signupAffiliate(userId: string, email: string, name: string) {
    try {
      // Generate referral code first
      const referralCode = await this.generateUserReferralCode(userId);

      // Create the affiliate in our database
      const { data: affiliateData, error: dbError } = await supabase
        .from('user_affiliates')
        .insert({
          user_id: userId,
          email: email,
          name: name,
          status: 'pending',
          referral_code: referralCode,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating affiliate in database:', dbError);
        throw new Error('Failed to create affiliate record');
      }

      // Then, redirect to Lemon Squeezy affiliate signup
      const affiliateUrl = `https://app.lemonsqueezy.com/affiliates/apply?store=myPip&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
      
      // Open the affiliate signup in a new window
      if (typeof window !== 'undefined') {
        window.open(affiliateUrl, '_blank', 'width=800,height=600');
      }

      return {
        success: true,
        affiliateId: affiliateData.id,
        referralCode: referralCode,
        message: 'Affiliate signup initiated! Please complete the process in the new window.'
      };
    } catch (error) {
      console.error('Error signing up affiliate:', error);
      throw error;
    }
  }

  // Check affiliate status
  async getAffiliateStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_affiliates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching affiliate status:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error getting affiliate status:', error);
      throw error;
    }
  }

  // Update affiliate status
  async updateAffiliateStatus(userId: string, status: string, affiliateId?: string) {
    try {
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (affiliateId) {
        updateData.lemon_squeezy_affiliate_id = affiliateId;
      }

      const { data, error } = await supabase
        .from('user_affiliates')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating affiliate status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating affiliate status:', error);
      throw error;
    }
  }

  // Build referral link for sharing
  buildReferralLink(referralCode: string, baseUrl?: string): string {
    const url = baseUrl || window.location.origin;
    return `${url}?aff=${referralCode}`;
  }

  // Get current affiliate ID from URL
  getCurrentAffiliateId(): string | null {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('aff');
  }

  // Initialize referral tracking on page load
  async initializeReferralTracking(): Promise<void> {
    const affiliateId = this.getCurrentAffiliateId();
    
    if (affiliateId) {
      console.log('Tracking referral visit for:', affiliateId);
      await this.trackReferralVisit(affiliateId, {
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
    }
  }
}

export const lemonSqueezyService = LemonSqueezyService.getInstance(); 