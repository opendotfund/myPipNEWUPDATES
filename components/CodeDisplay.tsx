import React, { useState, useEffect } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CodeDisplayProps {
  code: string;
  isDarkMode?: boolean;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, isDarkMode = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code || code.startsWith('//') || code.startsWith('Error:')) return; // Don't copy placeholder or error messages
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (err) { 
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <div className={`rounded-lg shadow relative group border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy code'}
        className={`absolute top-2 right-2 p-1.5 rounded text-neutral-600 hover:text-neutral-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-gray-100' : 'bg-neutral-200 hover:bg-neutral-300'}`}
        disabled={!code || code.startsWith('//') || code.startsWith('Error:') || copied}
        aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
      >
        {copied ? <CheckIcon className="h-5 w-5 text-emerald-600" /> : <CopyIcon className="h-5 w-5" />}
      </button>
      <pre className="p-4 pt-8 overflow-auto max-h-[500px] text-sm language-swift rounded-lg" aria-live="polite">
        <code className={`whitespace-pre-wrap break-all ${isDarkMode ? 'text-gray-200' : 'text-neutral-700'} ${code.startsWith('//') || code.startsWith('Error:') ? 'opacity-70' : ''}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};
