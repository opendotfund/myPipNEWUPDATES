/// <reference path="../stripe.d.ts" />

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './icons/CloseIcon';
import { SparklesIcon } from './icons/SparklesIcon';
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
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState<boolean>(false);

  const handleCheckout = (url: string) => {
    setCheckoutUrl(url);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setCheckoutUrl('');
  };

  if (!isOpen) return null;

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
          <div className="flex justify-between items-center mb-6">
            <h2 id="subscription-modal-title" className={`text-2xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center`}>
              <SparklesIcon className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              Get Unlimited Access
            </h2>
            <button
              onClick={onClose}
              className={`p-1 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-neutral-500 hover:text-neutral-700'}`}
              aria-label="Close modal"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

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
                  10 App Morphs Daily
                </div>
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  1000 Build Credits Monthly
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
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/61780121-1aa0-418d-a300-67e81fe60513')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Buy myPip Basic
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
                  100 App Morphs a Day
                </div>
                <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10,000 Monthly Build Credits
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
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/3bbb65ba-61db-47e1-8d6d-09bf008233f5')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Buy myPip Pro
                </button>
              </div>

              {/* Pro Plus Section */}
              <div className={`${isDarkMode ? 'bg-slate-800' : 'backdrop-blur-xl bg-white/40 border border-white/30'} p-3 rounded-xl mb-2 mt-2 border border-dashed ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}> 
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-yellow-400">Pro Plus</span>
                  <span className="text-sm font-bold text-yellow-400">$39.99</span>
                </div>
                <p className="text-xs text-gray-300 mb-1">Base monthly + $0.01 per prompt</p>
                <p className="text-xs text-gray-400 mb-2">Perfect for high-volume users who want to pay only for what they use.</p>
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/5aba50ab-154a-4d32-a978-97e928a0c893')}
                  className="w-full flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                >
                  Buy Pro Plus
                </button>
              </div>
            </div>

            {/* Unlimited - Right */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-amber-500 border-blue-400' : 'backdrop-blur-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-amber-400 border border-white/40 shadow-2xl'} p-6 rounded-2xl border transition-all duration-300`}> 
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">Unlimited</h3>
                <p className="text-3xl font-bold text-white mb-1">$199.99</p>
                <p className="text-sm text-white/90 mb-2">billed every month</p>
                <p className="text-xs text-white/80 mb-4">Up to 25 users, then $10 per user</p>
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
                  Unlimited Build Credits
                </div>
                <div className="flex items-center text-sm text-white">
                  <svg className="h-4 w-4 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited usage potential
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
                  <span className="font-semibold text-amber-300">Exclusive:</span> Only Unlimited plans unlock advanced organization efficiency features for team productivity.
                </p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/71593e62-d3d4-4dcf-8dc9-54ee3fae8ee2')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                >
                  Buy Unlimited
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
    </>,
    document.getElementById('modal-root')!
  );
};