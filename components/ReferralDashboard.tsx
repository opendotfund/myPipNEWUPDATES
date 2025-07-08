import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { referralService } from '../services/referralService'
import { lemonSqueezyService } from '../services/lemonSqueezyService'

interface ReferralStats {
  totalVisits: number
  totalConversions: number
  totalEarnings: number
}

const ReferralDashboard: React.FC = () => {
  const { user } = useUser()
  const [referralCode, setReferralCode] = useState<string>('')
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalVisits: 0,
    totalConversions: 0,
    totalEarnings: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [affiliateStatus, setAffiliateStatus] = useState<any>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Get user's referral code
      const code = await referralService.getUserReferralCode(user.id)
      setReferralCode(code)

      // Get referral statistics
      const stats = await referralService.getUserReferralStats(user.id)
      setReferralStats(stats)

      // Get affiliate status
      try {
        const status = await lemonSqueezyService.getAffiliateStatus(user.id)
        setAffiliateStatus(status)
      } catch (error) {
        console.log('No affiliate status found, user not yet an affiliate')
      }
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (!referralCode) return

    const referralLink = referralService.buildReferralLink(referralCode)
    
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const getReferralLink = () => {
    if (!referralCode) return ''
    return referralService.buildReferralLink(referralCode)
  }

  const handleAffiliateSignup = async () => {
    if (!user) return

    try {
      setIsSigningUp(true)
      
      const result = await lemonSqueezyService.signupAffiliate(
        user.id,
        user.primaryEmailAddress?.emailAddress || '',
        user.fullName || user.username || 'User'
      )

      // Reload affiliate status
      await loadReferralData()
      
      alert(result.message)
    } catch (error) {
      console.error('Error signing up for affiliate program:', error)
      alert('Failed to sign up for affiliate program. Please try again.')
    } finally {
      setIsSigningUp(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Referral Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Share myPip with others and earn rewards for every successful referral!
        </p>
      </div>

      {/* Affiliate Signup Section */}
      {!affiliateStatus && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg shadow-lg p-6 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                🍋 Become a Lemon Squeezy Affiliate
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                Join our affiliate program to earn commissions on every sale you refer! 
                Get access to exclusive tracking tools and higher commission rates.
              </p>
            </div>
            <button
              onClick={handleAffiliateSignup}
              disabled={isSigningUp}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningUp ? 'Signing Up...' : 'Join Affiliate Program'}
            </button>
          </div>
        </div>
      )}

      {/* Affiliate Status Section */}
      {affiliateStatus && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Affiliate Status: {affiliateStatus.status}
              </h3>
              <p className="text-green-800 dark:text-green-200 text-sm">
                {affiliateStatus.status === 'pending' && 'Your affiliate application is being reviewed. You\'ll receive an email once approved!'}
                {affiliateStatus.status === 'approved' && 'Congratulations! You\'re an approved affiliate. Start sharing your links to earn commissions!'}
                {affiliateStatus.status === 'active' && 'You\'re an active affiliate! Track your earnings and performance below.'}
                {affiliateStatus.status === 'rejected' && 'Your affiliate application was not approved. Please contact support for more information.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${affiliateStatus.total_earnings || 0}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Total Earnings
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Link Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Referral Link
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <code className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {getReferralLink()}
              </code>
            </div>
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            This link will automatically track referrals when people visit myPip through it.
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {referralStats.totalVisits}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Visits</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {referralStats.totalConversions}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Conversions</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
            ${referralStats.totalEarnings}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Earnings</div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          How It Works
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Share Your Link</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Share your referral link with friends, family, or on social media.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">They Sign Up</h4>
              <p className="text-gray-600 dark:text-gray-400">
                When someone clicks your link and signs up for myPip, we track the referral.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Earn Rewards</h4>
              <p className="text-gray-600 dark:text-gray-400">
                When they make a purchase, you earn rewards! Track your progress here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lemon Squeezy Integration Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🍋 Powered by Lemon Squeezy
        </h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Our referral system is integrated with Lemon Squeezy's affiliate tracking. 
          All referrals are automatically tracked when visitors use your link and make purchases.
        </p>
      </div>
    </div>
  )
}

export default ReferralDashboard 