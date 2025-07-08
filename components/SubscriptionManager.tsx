import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { lemonSqueezyService, SubscriptionTier } from '../services/lemonSqueezyService';

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface UserSubscription {
  id: number;
  user_id: string;
  tier_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_tiers: SubscriptionTier;
}

interface UserUsage {
  builds_used: number;
  remixes_used: number;
  month: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  isOpen,
  onClose,
  isDarkMode = false
}) => {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadSubscriptionData();
    }
  }, [isOpen, user]);

  const loadSubscriptionData = async () => {
    if (!user) {
      setError('You must be logged in to view subscription information');
      setLoading(false);
      return;
    }

    if (!user.primaryEmailAddress?.emailAddress) {
      setError('A valid email address is required to view subscription information');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [subscriptionData, usageData, tiersData] = await Promise.all([
        lemonSqueezyService.getUserSubscription(user.id),
        lemonSqueezyService.getUserUsage(user.id),
        lemonSqueezyService.getSubscriptionTiers()
      ]);

      setSubscription(subscriptionData);
      setUsage(usageData);
      setTiers(tiersData);
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: number) => {
    if (!user) {
      setError('You must be logged in to purchase a subscription');
      return;
    }

    if (!user.primaryEmailAddress?.emailAddress) {
      setError('A valid email address is required to purchase a subscription');
      return;
    }

    try {
      const checkoutUrl = lemonSqueezyService.createCheckoutUrl(
        tierId,
        user.id,
        user.primaryEmailAddress.emailAddress
      );
      window.open(checkoutUrl, '_blank');
    } catch (err) {
      console.error('Error creating checkout URL:', err);
      setError('Failed to create checkout link');
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) {
      setError('You must be logged in to manage your subscription');
      return;
    }

    if (!subscription) return;

    // Redirect to Lemon Squeezy customer portal
    const portalUrl = `https://mypip.lemonsqueezy.com/billing?checkout[custom][user_id]=${user.id}`;
    window.open(portalUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      case 'past_due':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div 
          className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} max-w-md w-full p-6 rounded-2xl border shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Sign In Required
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You must be logged in to manage your subscription and purchase plans.
            </p>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} max-w-4xl w-full p-6 rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Subscription & Usage
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
            <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Subscription */}
            {subscription ? (
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Current Plan: {subscription.subscription_tiers.tier_name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                    <p className={`font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Next Billing</p>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
                    <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                      Your subscription will be cancelled at the end of the current billing period.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCancelSubscription}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No Active Subscription
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Subscribe to unlock unlimited app building and remixing capabilities.
                </p>
              </div>
            )}

            {/* Usage Tracking */}
            {usage && (
              <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Usage This Month
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        App Builds
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {usage.builds_used} / {subscription?.subscription_tiers.builds_per_month || '∞'}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${getUsagePercentage(usage.builds_used, subscription?.subscription_tiers.builds_per_month || 0)}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Community Remixes
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {usage.remixes_used} / {subscription?.subscription_tiers.remixes_per_month === -1 ? '∞' : subscription?.subscription_tiers.remixes_per_month || 0}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${getUsagePercentage(usage.remixes_used, subscription?.subscription_tiers.remixes_per_month || 0)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Plans */}
            <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Available Plans
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tiers.map((tier) => (
                  <div 
                    key={tier.id}
                    className={`p-4 rounded-lg border transition-all ${
                      subscription?.tier_id === tier.id
                        ? isDarkMode 
                          ? 'bg-blue-900/20 border-blue-600' 
                          : 'bg-blue-50 border-blue-200'
                        : isDarkMode 
                          ? 'bg-gray-600 border-gray-500 hover:border-gray-400' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tier.tier_name}
                    </h4>
                    <p className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      ${tier.price_monthly}
                    </p>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      per month
                    </p>
                    
                    <div className="space-y-1 mb-4">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {tier.builds_per_month === -1 ? '∞' : tier.builds_per_month} builds/month
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {tier.remixes_per_month === -1 ? '∞' : tier.remixes_per_month} remixes/month
                      </p>
                    </div>

                    {subscription?.tier_id === tier.id ? (
                      <div className={`text-center py-2 px-3 rounded text-sm font-medium ${
                        isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(tier.id)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        {subscription ? 'Upgrade' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 