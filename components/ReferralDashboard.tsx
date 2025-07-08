import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { lemonSqueezyService } from '../services/lemonSqueezyService';
import { supabase } from '../services/supabaseClient';

interface AffiliateStats {
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

interface ReferralDashboardProps {
  isDarkMode: boolean;
}

export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ isDarkMode }) => {
  const { user } = useUser();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [affiliateStatus, setAffiliateStatus] = useState<any>(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get affiliate status
      const status = await lemonSqueezyService.getAffiliateStatus(user.id);
      setAffiliateStatus(status);

      if (status && status.status === 'active') {
        // Get referral code
        const code = await lemonSqueezyService.generateUserReferralCode(user.id);
        setReferralCode(code);
        
        // Generate referral link
        const link = lemonSqueezyService.buildReferralLink(code);
        setReferralLink(link);
        
        // Get affiliate stats
        const affiliateStats = await lemonSqueezyService.getAffiliateStats(user.id);
        setStats(affiliateStats);
      }
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupAffiliate = async () => {
    if (!user || !signupForm.name || !signupForm.email) return;

    try {
      setIsSigningUp(true);
      const result = await lemonSqueezyService.signupAffiliate(
        user.id,
        signupForm.email,
        signupForm.name
      );
      
      if (result.success) {
        setShowSignupForm(false);
        await loadAffiliateData(); // Reload data
      }
    } catch (error) {
      console.error('Error signing up affiliate:', error);
    } finally {
      setIsSigningUp(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="animate-pulse">
          <div className={`h-4 bg-gray-300 rounded w-1/4 mb-4 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          <div className={`h-8 bg-gray-300 rounded w-1/2 mb-6 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-4 bg-gray-300 rounded ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!affiliateStatus || affiliateStatus.status !== 'active') {
    return (
      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Become an Affiliate
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Join our affiliate program and earn commissions for every successful referral!
        </p>
        
        {!showSignupForm ? (
          <button
            onClick={() => setShowSignupForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign Up as Affiliate
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSignupAffiliate}
                disabled={isSigningUp || !signupForm.name || !signupForm.email}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isSigningUp ? 'Signing Up...' : 'Submit Application'}
              </button>
              <button
                onClick={() => setShowSignupForm(false)}
                className={`px-6 py-2 border rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Affiliate Dashboard
      </h2>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalVisits}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Visits
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.totalConversions}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Conversions
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {stats.conversionRate.toFixed(1)}%
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Conversion Rate
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ${stats.totalEarnings.toFixed(2)}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Earnings
            </div>
          </div>
        </div>
      )}

      {/* Referral Link Section */}
      <div className={`p-4 rounded-lg border mb-6 ${
        isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your Referral Link
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
              isDarkMode 
                ? 'bg-gray-600 border-gray-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <button
            onClick={() => copyToClipboard(referralLink)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Copy
          </button>
        </div>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Share this link with your audience to start earning commissions!
        </p>
      </div>

      {/* Referral Code Section */}
      <div className={`p-4 rounded-lg border mb-6 ${
        isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your Referral Code
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={referralCode}
            readOnly
            className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono ${
              isDarkMode 
                ? 'bg-gray-600 border-gray-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <button
            onClick={() => copyToClipboard(referralCode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Copy
          </button>
        </div>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Use this code when promoting myPip to track your referrals.
        </p>
      </div>

      {/* Recent Conversions */}
      {stats && stats.recentConversions.length > 0 && (
        <div className={`p-4 rounded-lg border ${
          isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Conversions
          </h3>
          <div className="space-y-2">
            {stats.recentConversions.map((conversion) => (
              <div key={conversion.id} className={`flex justify-between items-center p-2 rounded ${
                isDarkMode ? 'bg-gray-600' : 'bg-white'
              }`}>
                <div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${conversion.order_value.toFixed(2)} Order
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(conversion.converted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    +${conversion.commission_amount.toFixed(2)}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {conversion.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission Info */}
      <div className={`mt-6 p-4 rounded-lg border ${
        isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Commission Structure
        </h3>
        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <p className="mb-2">• Earn 10% commission on all successful referrals</p>
          <p className="mb-2">• Commissions are paid monthly via PayPal</p>
          <p className="mb-2">• Minimum payout threshold: $50</p>
          <p>• Track your performance in real-time</p>
        </div>
      </div>
    </div>
  );
}; 