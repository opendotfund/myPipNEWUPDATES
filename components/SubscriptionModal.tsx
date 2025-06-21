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
}

interface CheckoutOverlayProps {
  checkoutUrl: string;
  onClose: () => void;
}

const CheckoutOverlay: React.FC<CheckoutOverlayProps> = ({ checkoutUrl, onClose }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] h-[90vh] max-w-4xl relative">
        <div className="flex justify-between items-center p-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800">Complete Your Purchase</h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
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
  contactEmail
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
          className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id="subscription-modal-title" className="text-2xl font-semibold text-blue-600 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-blue-500" />
              Get Unlimited Access
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-700"
              aria-label="Close modal"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* myPip Pro - Left */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-blue-700 mb-2">myPip Pro</h3>
                <p className="text-3xl font-bold text-blue-600 mb-1">$31.00</p>
                <p className="text-sm text-neutral-600 mb-4">billed every month</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10 App Morphs Daily
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  1000 Build Credits Monthly
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  20 Community Remixes Monthly
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/61780121-1aa0-418d-a300-67e81fe60513')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  Buy myPip Pro
                </button>
              </div>
            </div>

            {/* myPip Enterprise - Middle */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-purple-700 mb-2">myPip Enterprise</h3>
                <p className="text-3xl font-bold text-purple-600 mb-1">$62.50</p>
                <p className="text-sm text-neutral-600 mb-4">billed every month</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 App Morphs a Day
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10,000 Monthly Build Credits
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 Monthly Community Remixes
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/3bbb65ba-61db-47e1-8d6d-09bf008233f5')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  Buy myPip Enterprise
                </button>
              </div>
            </div>

            {/* myPip Enterprise Plus - Right */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-emerald-700 mb-2">myPip Enterprise Plus</h3>
                <p className="text-3xl font-bold text-emerald-600 mb-1">$110.00</p>
                <p className="text-sm text-neutral-600 mb-4">base monthly + $0.01 per prompt</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited App Morphs
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited Build Credits
                </div>
                <div className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited usage potential
                </div>
              </div>

              <div className="bg-emerald-100 p-3 rounded-md mb-4">
                <p className="text-xs text-emerald-800">
                  <strong>Pricing Model:</strong> CA$110 base monthly + CA$0.01 per prompt after included credits. 
                  Perfect for high-volume users who want to pay only for what they use.
                </p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => handleCheckout('https://mypip.lemonsqueezy.com/buy/5aba50ab-154a-4d32-a978-97e928a0c893')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  Buy myPip Enterprise Plus
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-neutral-500 mt-6 pt-4 border-t border-neutral-200">
            <p>For any questions regarding subscriptions or support, please contact us at:</p>
            <a href={`mailto:${contactEmail}`} className="font-medium text-blue-600 hover:text-blue-700">
              {contactEmail}
            </a>
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutOverlay 
          checkoutUrl={checkoutUrl} 
          onClose={handleCloseCheckout} 
        />
      )}
    </>,
    document.getElementById('modal-root')!
  );
};