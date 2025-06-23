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
          className="glass-input w-full p-4 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 placeholder-white/50 min-h-[120px] resize-none disabled:opacity-70 disabled:cursor-not-allowed text-white"
          rows={5}
          disabled={isLoading || isDisabled}
          aria-label="App description prompt"
          style={{ position: 'relative', backgroundClip: 'padding-box' }}
        />
        {/* Overlay for thinking log and spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{background: 'rgba(30,30,40,0.55)', borderRadius: '0.75rem'}}>
            <div className="flex items-center gap-2 mb-1">
              <LoadingSpinner className="h-4 w-4 text-white animate-spin" />
              <span className="text-white text-xs font-medium opacity-90">Generating App...</span>
            </div>
            {thinkingLog && (
              <div className="text-xs text-white/80 font-mono text-center max-w-[90%] break-words" style={{lineHeight: '1.3'}}>
                {typedLog}
              </div>
            )}
          </div>
        )}
        {/* Bottom controls overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          {/* Model selector - bottom left */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isLoading || isDisabled}
              className="glass-button flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">{selectedModelConfig.icon}</span>
                <div className="text-left">
                  <div className="font-semibold text-xs">{selectedModelData?.name}</div>
                </div>
              </div>
              <svg 
                className={`w-3 h-3 ml-1 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 glass-card border border-white/20 rounded-xl shadow-xl overflow-hidden z-50">
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
                      className={`w-full p-3 flex items-center space-x-2 transition-all duration-300 hover:bg-white/10 text-white ${
                        isSelected ? 'bg-white/20 border-l-4 border-white/50' : ''
                      } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm">{modelConfig.icon}</span>
                      <div className="text-left flex-1">
                        <div className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-white/80'}`}>{model.name}</div>
                        <div className={`text-xs ${isSelected ? 'text-white/70' : 'text-white/60'}`}>{modelConfig.description}</div>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!isAvailable && (
                        <span className="text-xs bg-white/20 text-white/70 px-2 py-1 rounded-full">Soon</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Generate button - bottom right */}
          <button
            onClick={onSubmit}
            disabled={isLoading || isDisabled || !prompt.trim()}
            className="glass-button flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 disabled:text-white/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 text-xs"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-3 w-3 mr-2 text-white" />
                Generating...
              </>
            ) : (
              <>
                <SendIcon className="h-3 w-3 mr-2" />
                {actionText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
