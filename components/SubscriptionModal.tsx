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
  const [showCreditInfo, setShowCreditInfo] = useState<boolean>(false);

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
                  100 Build Credits Monthly
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
                  500 Monthly Build Credits
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
                <p className="text-xs text-gray-300 mb-1">Base monthly + $0.10 per prompt</p>
                <p className="text-xs text-gray-400 mb-2">Perfect for high-volume users who want to pay only for what they use.</p>
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/5aba50ab-154a-4d32-a978-97e928a0c893')}
                  className="w-full flex items-center justify-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs"
                >
                  Buy Pro Plus
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
                  1500 Monthly Build Credits
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
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/71593e62-d3d4-4dcf-8dc9-54ee3fae8ee2')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                >
                  Buy myPip Enterprise
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl"></div>
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
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} mb-2`}>🚀 One Prompt = One Complete Build</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>
                      Unlike other platforms that require multiple prompts for refining and editing, myPip's custom Agentic Framework handles most of the work in a single prompt. This means each build credit gives you a complete, production-ready app.
                    </p>
                  </div>

                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-pink-300' : 'text-pink-600'} mb-2`}>💡 Credit Efficiency</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>
                      While other platforms might require 3-5 prompts to get a polished app, myPip's Agentic Framework delivers the same quality in just 1 prompt. This means your build credits go much further with us.
                    </p>
                  </div>

                  <div className={`${isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} mb-2`}>🎯 Build Credits Include:</h4>
                    <ul className={`${isDarkMode ? 'text-blue-200' : 'text-blue-800'} text-sm space-y-1`}>
                      <li>• Complete app generation with full functionality</li>
                      <li>• Automatic code optimization and refactoring</li>
                      <li>• UI/UX enhancements and accessibility features</li>
                      <li>• Cross-platform compatibility setup</li>
                      <li>• Production-ready deployment configurations</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <div className="text-center">
                <button
                  onClick={() => setShowCreditInfo(false)}
                  className={`px-6 py-3 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold rounded-xl transition-all duration-300`}
                >
                  Got it!
                </button>
              </div>

              {/* Close button (X) */}
              <button
                onClick={() => setShowCreditInfo(false)}
                className={`absolute top-4 right-4 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors p-2`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.getElementById('modal-root')!
  );
};