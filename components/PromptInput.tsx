import React, { useState, useRef, useEffect } from 'react';
import { ModelId, ModelOption } from '../types';
import { AI_MODELS } from '../constants';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedModel: ModelId;
  onModelChange: (modelId: string) => void;
  isDisabled?: boolean;
  actionText?: string;
  aiThoughtProcess?: string;
  thinkingLog?: string;
  isDarkMode?: boolean;
  hasGenerated?: boolean;
  fullWidth?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  selectedModel,
  onModelChange,
  isDisabled = false,
  actionText = "Generate App",
  aiThoughtProcess = "",
  thinkingLog = "",
  isDarkMode = false,
  hasGenerated = false,
  fullWidth = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [typedLog, setTypedLog] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading && !isDisabled) {
        onSubmit();
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Typing effect for thinking log
  useEffect(() => {
    if (isThinkingExpanded && thinkingLog) {
      setTypedLog('');
      let i = 0;
      const interval = setInterval(() => {
        setTypedLog(thinkingLog.slice(0, i + 1));
        i++;
        if (i >= thinkingLog.length) clearInterval(interval);
      }, 24);
      return () => clearInterval(interval);
    } else {
      setTypedLog('');
    }
  }, [isThinkingExpanded, thinkingLog]);

  const getModelConfig = (modelId: ModelId) => {
    switch (modelId) {
      case ModelId.GEMINI_FLASH:
        return {
          bgColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
          borderColor: 'border-blue-400',
          textColor: 'text-white',
          icon: '🤖',
          description: 'Fast & Powerful'
        };
      case ModelId.CLAUDE:
        return {
          bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
          borderColor: 'border-orange-400',
          textColor: 'text-white',
          icon: '🧠',
          description: 'Coming Soon'
        };
      case ModelId.CHATGPT:
        return {
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
          borderColor: 'border-green-400',
          textColor: 'text-white',
          icon: '💬',
          description: 'Coming Soon'
        };
      default:
        return {
          bgColor: 'bg-gray-500',
          borderColor: 'border-gray-400',
          textColor: 'text-white',
          icon: '❓',
          description: 'Unknown'
        };
    }
  };

  const selectedModelConfig = getModelConfig(selectedModel);
  const selectedModelData = AI_MODELS.find(model => model.id === selectedModel);

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasGenerated ? "e.g., Change the background to green, add a paperclip icon for file uploads, make the text larger..." : "e.g., A simple todo list app with a button to add tasks..."}
          className={`${fullWidth ? 'w-full' : 'w-[500px]'} p-3 pb-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-neutral-400 min-h-[120px] resize-none disabled:opacity-70 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-blue-50 border-blue-200 text-neutral-800 placeholder-neutral-400'}`}
          rows={5}
          disabled={isLoading || isDisabled}
          aria-label="App description prompt"
        />
        
        {/* Bottom controls overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {/* Model selector - bottom left */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading || isDisabled}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70 disabled:cursor-not-allowed ${selectedModelConfig.bgColor} ${selectedModelConfig.borderColor} ${selectedModelConfig.textColor} hover:shadow-md text-xs mb-2`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="text-sm">{selectedModelConfig.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-xs">{selectedModelData?.name}</div>
                </div>
              </div>
              <svg 
                className={`w-3 h-3 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={`absolute bottom-full left-0 mb-2 w-48 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-xl overflow-hidden z-50`}>
                {AI_MODELS.map((model) => {
                  const modelConfig = getModelConfig(model.id);
                  const isSelected = model.id === selectedModel;
                  const isAvailable = model.available;
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        if (isAvailable) {
                          onModelChange(model.id);
                          setIsDropdownOpen(false);
                        }
                      }}
                      disabled={!isAvailable}
                      className={`w-full p-2 flex items-center space-x-2 transition-all duration-150 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${
                        isSelected ? `${isDarkMode ? 'bg-blue-900/50 border-l-4 border-blue-400' : 'bg-blue-50 border-l-4 border-blue-500'}` : ''
                      } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm">{modelConfig.icon}</span>
                      <div className="text-left flex-1">
                        <div className={`font-semibold text-xs ${isSelected ? (isDarkMode ? 'text-blue-300' : 'text-blue-700') : (isDarkMode ? 'text-gray-200' : 'text-gray-800')}`}>
                          {model.name}
                        </div>
                        <div className={`text-xs ${isSelected ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : (isDarkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                          {modelConfig.description}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!isAvailable && (
                        <span className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'} px-1.5 py-0.5 rounded-full`}>
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thinking component - between model selector and generate button */}
          {isLoading && (
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                className={`flex items-center px-3 py-1.5 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-blue-300 hover:bg-gray-600' : 'bg-neutral-100 border-blue-200 text-blue-700 hover:bg-blue-50'} border rounded-md text-xs font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400`}
                onClick={() => setIsThinkingExpanded((v) => !v)}
                aria-expanded={isThinkingExpanded}
                style={{ minWidth: 100 }}
              >
                <LoadingSpinner className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                Thinking
                <svg className={`h-3 w-3 ml-2 transition-transform ${isThinkingExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isThinkingExpanded && (
                <div className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 max-w-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-blue-200 text-neutral-700'} border rounded-lg shadow-lg p-3 z-50 text-xs whitespace-pre-line`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>AI's Thought Process</span>
                    <button onClick={() => setIsThinkingExpanded(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-neutral-400 hover:text-neutral-700'} p-1`}><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>{aiThoughtProcess || 'The AI is analyzing your prompt and preparing a response...'}</div>
                  {/* Thinking Log typing effect */}
                  {thinkingLog && (
                    <div className={`mt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-blue-200'} pt-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} font-mono`}>
                      <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} block mb-1`}>Thinking Log</span>
                      <span aria-live="polite">{typedLog}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate button - bottom right */}
          <button
            onClick={onSubmit}
            disabled={isLoading || isDisabled || !prompt.trim()}
            className="flex items-center justify-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-400 disabled:text-neutral-100 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 text-xs"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-3 w-3 mr-1 text-white" />
                Generating...
              </>
            ) : (
              <>
                <SendIcon className="h-3 w-3 mr-1" />
                {actionText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
