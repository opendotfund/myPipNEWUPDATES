import { createAuthenticatedSupabaseClient, supabase } from './supabaseClient'

// Referral service for Lemon Squeezy affiliate tracking
export const referralService = {
  // Generate a unique referral code for a user
  generateReferralCode(userId: string): string {
    // Create a unique code based on user ID and timestamp
    const timestamp = Date.now().toString(36)
    const userIdHash = userId.slice(-6)
    return `mypip_${userIdHash}_${timestamp}`.toUpperCase()
  },

  // Get or create referral code for a user
  async getUserReferralCode(userId: string, token?: string): Promise<string> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      // Check if user already has a referral code
      const { data: existingCode } = await client
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single()

      if (existingCode) {
        return existingCode.referral_code
      }

      // Generate new referral code
      const referralCode = this.generateReferralCode(userId)
      
      // Save to database
      const { error } = await client
        .from('user_referral_codes')
        .insert({
          user_id: userId,
          referral_code: referralCode,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving referral code:', error)
        return referralCode // Return code even if save fails
      }

      return referralCode
    } catch (error) {
      console.error('Error getting referral code:', error)
      return this.generateReferralCode(userId)
    }
  },

  // Get user by referral code
  async getUserByReferralCode(referralCode: string, token?: string): Promise<string | null> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { data, error } = await client
        .from('user_referral_codes')
        .select('user_id')
        .eq('referral_code', referralCode)
        .single()

      if (error || !data) {
        return null
      }

      return data.user_id
    } catch (error) {
      console.error('Error getting user by referral code:', error)
      return null
    }
  },

  // Track referral visit
  async trackReferralVisit(referralCode: string, visitorIp?: string, token?: string): Promise<boolean> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      const { error } = await client
        .from('referral_visits')
        .insert({
          referral_code: referralCode,
          visitor_ip: visitorIp || null,
          visited_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error tracking referral visit:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error tracking referral visit:', error)
      return false
    }
  },

  // Get referral statistics for a user
  async getUserReferralStats(userId: string, token?: string): Promise<{
    totalVisits: number
    totalConversions: number
    totalEarnings: number
  }> {
    try {
      const client = token ? createAuthenticatedSupabaseClient(token) : supabase
      
      // Get user's referral code
      const { data: referralCode } = await client
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single()

      if (!referralCode) {
        return { totalVisits: 0, totalConversions: 0, totalEarnings: 0 }
      }

      // Get visit count
      const { count: visits } = await client
        .from('referral_visits')
        .select('*', { count: 'exact' })
        .eq('referral_code', referralCode.referral_code)

      // Get conversion count (this would be populated by Lemon Squeezy webhooks)
      const { count: conversions } = await client
        .from('referral_conversions')
        .select('*', { count: 'exact' })
        .eq('referral_code', referralCode.referral_code)

      // Calculate earnings (this would be based on your commission structure)
      const totalEarnings = (conversions || 0) * 5 // Example: $5 per conversion

      return {
        totalVisits: visits || 0,
        totalConversions: conversions || 0,
        totalEarnings
      }
    } catch (error) {
      console.error('Error getting referral stats:', error)
      return { totalVisits: 0, totalConversions: 0, totalEarnings: 0 }
    }
  },

  // Build Lemon Squeezy checkout URL with referral tracking
  buildCheckoutUrl(productId: string, referralCode?: string): string {
    // Use your actual Lemon Squeezy store URL
    const baseUrl = `https://mypip.lemonsqueezy.com/checkout/buy/${productId}`
    
    if (referralCode) {
      return `${baseUrl}?aff=${referralCode}`
    }
    
    return baseUrl
  },

  // Get current affiliate ID from URL (Lemon Squeezy uses 'aff' parameter)
  getCurrentAffiliateId(): string | null {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('aff')
  },

  // Initialize referral tracking
  async initializeReferralTracking(token?: string): Promise<void> {
    const affiliateId = this.getCurrentAffiliateId()
    
    if (affiliateId) {
      console.log('Tracking referral visit for:', affiliateId)
      await this.trackReferralVisit(affiliateId)
    }
  },

  // Build referral link for sharing
  buildReferralLink(referralCode: string, baseUrl?: string): string {
    const url = baseUrl || window.location.origin
    return `${url}?aff=${referralCode}`
  },

  // Get Lemon Squeezy affiliate tracking ID (for advanced usage)
  getLemonSqueezyTrackingId(): string | null {
    // This would be available if Lemon Squeezy tracking script is loaded
    if (typeof window !== 'undefined' && (window as any).LemonSqueezy) {
      return (window as any).LemonSqueezy.Affiliate?.GetId?.() || null
    }
    return null
  },

  // Build checkout URL with Lemon Squeezy tracking (advanced usage)
  buildCheckoutUrlWithTracking(productId: string): string {
    const baseUrl = `https://mypip.lemonsqueezy.com/checkout/buy/${productId}`
    
    // If Lemon Squeezy tracking script is available, use it
    if (typeof window !== 'undefined' && (window as any).LemonSqueezy?.Url?.Build) {
      return (window as any).LemonSqueezy.Url.Build(baseUrl)
    }
    
    // Fallback to manual tracking
    const trackingId = this.getLemonSqueezyTrackingId()
    if (trackingId) {
      return `${baseUrl}?aff_ref=${trackingId}`
    }
    
    return baseUrl
  }
} 