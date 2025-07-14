/// <reference path="../stripe.d.ts" />

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { useUserData } from '../hooks/useUserData';
// LoadingSpinner is not directly used by stripe-buy-button but kept if needed for other parts or future UI elements.

// The global JSX.IntrinsicElements declaration has been moved to stripe.d.ts

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactEmail: string;
  isDarkMode?: boolean;
}

interface CheckoutOverlayProps {
  checkoutUrl: string;
  onClose: () => void;
  isDarkMode?: boolean;
}

const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({ checkoutUrl, onClose, isDarkMode = false }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'} rounded-lg shadow-2xl w-[95vw] h-[90vh] max-w-4xl relative`}>
        <div className={`flex justify-between items-center p-4 ${isDarkMode ? 'border-gray-600' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-neutral-800'}`}>Complete Your Purchase</h3>
          <button
            onClick={onClose}
            className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'} rounded-lg transition-colors`}
            aria-label="Close checkout"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <iframe
          src={checkoutUrl}
          className="w-full h-[calc(90vh-80px)] rounded-b-lg"
          frameBorder="0"
          allow="payment"
          title="Checkout"
        />
      </div>
    </div>,
    document.body
  );
};

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  contactEmail,
  isDarkMode = false
}) => {
  const { user } = useUser();
  const { userData, refetch } = useUserData();
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState('');
  const [error, setError] = useState<string>('');

  // Refresh user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      refetch();
    }
  }, [isOpen, user, refetch]);

  // Check for pending checkout URL after sign-in
  useEffect(() => {
    if (user && pendingCheckoutUrl) {
      handleCheckout(pendingCheckoutUrl);
      setPendingCheckoutUrl('');
    }
  }, [user, pendingCheckoutUrl]);

  const handleCheckout = (url: string) => {
    if (!user) {
      setError('You must be logged in to purchase a subscription');
      return;
    }

    if (!user.primaryEmailAddress?.emailAddress) {
      setError('A valid email address is required to purchase a subscription');
      return;
    }

    // Add user data to checkout URL
    const checkoutUrlWithUser = new URL(url);
    checkoutUrlWithUser.searchParams.set('checkout[custom][user_id]', user.id);
    checkoutUrlWithUser.searchParams.set('checkout[custom][email]', user.primaryEmailAddress.emailAddress);

    setCheckoutUrl(checkoutUrlWithUser.toString());
    setShowCheckout(true);
    setError('');
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setCheckoutUrl('');
  };

  if (!isOpen) return null;

  // Ensure document.body is available before creating portal
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return ReactDOM.createPortal(
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-modal-title"
      >
        <div
          className={`modal-content ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'backdrop-blur-xl bg-white/70 border border-white/40 shadow-2xl'} p-6 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {error && (
            <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border`}>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 id="subscription-modal-title" className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center`}>
                <SparklesIcon className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                Get Unlimited Access
              </h2>
              <button
                onClick={() => setShowCreditInfo(true)}
                className={`ml-3 p-2 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'} transition-colors relative group`}
                title="Learn about our credit system"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                
                {/* Hover Preview */}
                <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                  <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl p-4 w-64 backdrop-blur-xl`}>
                    {/* Animated Sparkle */}
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mr-2 animate-pulse">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Revolutionary Credit System</span>
                    </div>
                    
                    {/* Preview Content */}
                    <div className="space-y-2">
                      <div className="flex items-center text-xs">
                        <span className="text-green-500 mr-1">⚡</span>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>1 Prompt = 1 Complete Build</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="text-purple-500 mr-1">🚀</span>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agentic Framework</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="text-pink-500 mr-1">💡</span>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>3-5x More Efficient</span>
                      </div>
                    </div>
                    
                    {/* Animated Arrow */}
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 dark:border-r-gray-800"></div>
                  </div>
                </div>
              </button>
            </div>
            <button
              onClick={onClose}
              className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-neutral-500 hover:text-neutral-700'}`}
              aria-label="Close modal"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Current Subscription Status */}
          {userData && (
            <div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'} border`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-blue-800'}`}>
                  Current Subscription: {userData.subscription_tier?.charAt(0).toUpperCase() + userData.subscription_tier?.slice(1) || 'Free'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={refetch}
                    className={`p-2 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}
                    title="Refresh subscription data"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    userData.subscription_status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {userData.subscription_status || 'Active'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    {userData.builds_used || 0}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    Builds Used
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    {userData.builds_limit || 5}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    Build Limit
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    {userData.remixes_used || 0}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`}>
                    Remixes Used
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    {userData.remixes_limit || 3}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`}>
                    Remix Limit
                  </div>
                </div>
              </div>
              
              {/* Progress bars */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Builds Remaining</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {userData.builds_limit || 5} - {userData.builds_used || 0}
                    </span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(((userData.builds_limit || 5) - (userData.builds_used || 0)) / (userData.builds_limit || 5) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Remixes Remaining</span>
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {userData.remixes_limit || 3} - {userData.remixes_used || 0}
                    </span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(
                          ((userData.remixes_limit || 3) - (userData.remixes_used || 0)) / (userData.remixes_limit || 3) * 100, 
                          100
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* myPip Basic - Left */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' : 'backdrop-blur-xl bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 shadow-2xl'} p-6 rounded-2xl border transition-all duration-300`}>
              <div className="text-center mb-4">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-blue-800'} mb-2`}>myPip Basic</h3>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} mb-1`}>$19.99</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-blue-600'} mb-4`}>billed every month</p>
                <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-blue-200/80'} p-2 rounded-md mb-4`}>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-blue-800'} font-medium`}>Best for casual creators and hobbyists</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  3 App Morphs Daily
                </div>
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 Build Credits + 90 Free Daily Credits
                </div>
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  20 Community Remixes Monthly
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    if (!user) {
                      // Show sign-in modal first, then redirect to checkout
                      setShowSignInModal(true);
                      setPendingCheckoutUrl('https://mypip.lemonsqueezy.com/buy/e210a879-e5ce-4682-8dd6-b00dd56312f2');
                    } else {
                      handleCheckout('https://mypip.lemonsqueezy.com/buy/e210a879-e5ce-4682-8dd6-b00dd56312f2');
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {user ? 'Buy myPip Basic' : 'Sign In to Buy'}
                </button>
              </div>
            </div>

            {/* myPip Pro - Middle */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-700' : 'backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl'} p-6 rounded-2xl border transition-all duration-300 relative`}>
              {/* Most Popular Badge */}
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 ${isDarkMode ? 'bg-yellow-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'} text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg`}>
                MOST POPULAR
              </div>
              
              <div className="text-center mb-4">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>myPip Pro</h3>
                <p className={`text-3xl font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-600'} mb-1`}>$33.99</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-neutral-600'} mb-4`}>billed every month</p>
                <div className={`${isDarkMode ? 'bg-blue-800' : 'bg-blue-100/80'} p-2 rounded-md mb-4`}>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-200' : 'text-blue-800'} font-medium`}>Best for committed builders shipping production-ready apps</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  500 Build Credits + 90 Free Daily Credits
                </div>
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 Monthly Community Remixes
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <button 
                  onClick={() => {
                    if (!user) {
                      // Show sign-in modal first, then redirect to checkout
                      setShowSignInModal(true);
                      setPendingCheckoutUrl('https://mypip.lemonsqueezy.com/buy/b0e37f2f-9385-471f-a4cb-ca24b1ff7108');
                    } else {
                      handleCheckout('https://mypip.lemonsqueezy.com/buy/b0e37f2f-9385-471f-a4cb-ca24b1ff7108');
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {user ? 'Buy myPip Pro' : 'Sign In to Buy'}
                </button>
              </div>

              {/* Pro Plus Section */}
              <div className={`${isDarkMode ? 'bg-slate-800' : 'backdrop-blur-xl bg-white/40 border border-white/30'} p-3 rounded-xl mb-2 mt-2 border border-dashed ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}> 
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-yellow-400">Pro Plus</span>
                  <span className="text-sm font-bold text-yellow-400">$39.99</span>
                </div>
                <p className="text-xs text-gray-300 mb-1">Base monthly + $0.10 per prompt</p>
                <p className="text-xs text-gray-400 mb-2">Perfect for high-volume users who want to pay only for what they use.</p>
                <button 
                  onClick={() => {
                    if (!user) {
                      // Show sign-in modal first, then redirect to checkout
                      setShowSignInModal(true);
                      setPendingCheckoutUrl('https://mypip.lemonsqueezy.com/buy/570daf7c-d83f-4f80-8844-8c295955af16');
                    } else {
                      handleCheckout('https://mypip.lemonsqueezy.com/buy/570daf7c-d83f-4f80-8844-8c295955af16');
                    }
                  }}
                  className="w-full flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                >
                  {user ? 'Buy Pro Plus' : 'Sign In to Buy'}
                </button>
              </div>
            </div>

            {/* myPip Enterprise - Right */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-amber-500 border-blue-400' : 'backdrop-blur-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-amber-400 border border-white/40 shadow-2xl'} p-6 rounded-2xl border transition-all duration-300`}> 
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">myPip Enterprise</h3>
                <p className="text-3xl font-bold text-white mb-1">$199.99</p>
                <p className="text-sm text-white/90 mb-2">billed every month</p>
                <p className="text-xs text-white/80 mb-4">For 5 team members then $10 per user and $0.10 per extra build credit</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-white">
                  <svg className="h-4 w-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited App Morphs
                </div>
                <div className="flex items-center text-sm text-white">
                  <svg className="h-4 w-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  1500 Build Credits + 90 Free Daily Credits
                </div>
                <div className="flex items-center text-sm text-white">
                  <svg className="h-4 w-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited Community Remixes
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl mb-4 border border-white/30">
                <p className="text-xs text-white font-semibold mb-1">
                  <span className="text-yellow-300">Unlimited Usage:</span> No limits on app morphs, build credits, or remixes.
                </p>
                <p className="text-xs text-white mb-1">
                  <span className="font-semibold text-blue-200">Best for Teams:</span> Unlimited remixing enables seamless collaboration and rapid iteration for organizations.
                </p>
                <p className="text-xs text-white">
                  <span className="font-semibold text-amber-300">Exclusive:</span> Only Enterprise plans unlock advanced organization efficiency features for team productivity.
                </p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    if (!user) {
                      // Show sign-in modal first, then redirect to checkout
                      setShowSignInModal(true);
                      setPendingCheckoutUrl('https://mypip.lemonsqueezy.com/buy/96500a66-befe-4016-be3b-ae691ad87b3f');
                    } else {
                      handleCheckout('https://mypip.lemonsqueezy.com/buy/96500a66-befe-4016-be3b-ae691ad87b3f');
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                >
                  {user ? 'Buy myPip Enterprise' : 'Sign In to Buy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutOverlay 
          checkoutUrl={checkoutUrl} 
          onClose={handleCloseCheckout}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Credit System Info Popup */}
      {showCreditInfo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreditInfo(false)}
        >
          <div 
            className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'backdrop-blur-xl bg-white/90 border border-white/40'} max-w-2xl w-full p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Liquid glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-gray-800/10 to-gray-700/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Our Revolutionary Credit System</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>How myPip's Agentic Framework changes everything</p>
              </div>

              {/* Main Content */}
              <div className={`${isDarkMode ? 'bg-gray-700/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl p-6 mb-6 border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <div className="space-y-4">
                  <div>
                    <h3 className={`${isDarkMode ? 'text-white' : 'text-gray-800'} font-semibold mb-2`}>
                      🚀 Agentic Framework Benefits
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed`}>
                      {/* Add your content here or close the tag if empty */}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSignInModal(false)}
        >
          <div 
            className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'backdrop-blur-xl bg-white/90 border border-white/40'} max-w-md w-full p-6 rounded-3xl shadow-2xl relative overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Liquid glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-gray-800/10 to-gray-700/10 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Sign In Required</h2>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Please sign in to continue with your purchase</p>
              </div>

              {/* Sign In Button */}
              <div className="flex flex-col space-y-3">
                <SignInButton mode="modal">
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                    Sign In to Continue
                  </button>
                </SignInButton>
                
                <button 
                  onClick={() => setShowSignInModal(false)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default SubscriptionModal;
