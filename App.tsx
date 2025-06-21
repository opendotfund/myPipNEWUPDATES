import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PhonePreview } from './components/PhonePreview';
import { PromptInput } from './components/PromptInput';
import { CodeDisplay } from './components/CodeDisplay';
import { generateAppCodeAndPreview, refineAppCodeAndPreview, handleInteractionAndUpdateCodeAndPreview, setExternalApiKey } from './services/geminiService';
import { ModelId } from './types';
import { APP_TITLE, MAX_FREE_PROMPTS, CONTACT_EMAIL } from './constants';
import { GithubIcon } from './components/icons/GithubIcon';
import { ChatInput } from './components/ChatInput';
import { SubscriptionModal } from './components/SubscriptionModal';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { EarlyBirdApiInput } from './components/EarlyBirdApiInput'; // Added
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';

type AppView = 'main' | 'community' | 'myPips';

const sampleProjects = [
  { id: 1, name: 'Todo List', category: 'Productivity', description: 'A simple todo list app.' },
  { id: 2, name: 'Study Buddy', category: 'Education', description: 'Collaborative study sessions.' },
  { id: 3, name: 'Movie Night', category: 'Entertainment', description: 'Plan and vote on movies with friends.' },
  { id: 4, name: 'Habit Tracker', category: 'Productivity', description: 'Track your daily habits.' },
  { id: 5, name: 'Language Learner', category: 'Education', description: 'Practice new languages.' },
  { id: 6, name: 'Photo Share', category: 'Social', description: 'Share photos with your community.' },
];

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelId>(ModelId.GEMINI_FLASH);
  const [generatedCode, setGeneratedCode] = useState<string>('// Code will appear here once generated...');
  const [previewHtml, setPreviewHtml] = useState<string>('<div class="w-full h-full flex items-center justify-center text-neutral-400 p-4 text-center"><p>App preview will appear here after you describe your app.</p></div>');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('main');
  const [freePromptsRemaining, setFreePromptsRemaining] = useState<number>(MAX_FREE_PROMPTS);
  const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'ai' | 'interaction'; content: string }[]>([]);
  
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Added for mobile sidebar

  const [userProvidedApiKey, setUserProvidedApiKey] = useState<string | null>(null); // Added
  const [isEarlyBirdKeyApplied, setIsEarlyBirdKeyApplied] = useState<boolean>(false); // Added

  // Configuration modal states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configPlatform, setConfigPlatform] = useState<string>('');
  const [configApiKey, setConfigApiKey] = useState<string>('');

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('myPip');
  const [appLogo, setAppLogo] = useState<string>('https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif');
  const [tempAppName, setTempAppName] = useState<string>('myPip');
  const [tempAppLogo, setTempAppLogo] = useState<string>('https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif');

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const canSubmit = isEarlyBirdKeyApplied || freePromptsRemaining > 0; // Updated

  const { user } = useUser();

  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('All Categories');

  // Add new state for share modal, remix permission, and layout
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [allowRemix, setAllowRemix] = useState(true);
  const [isHorizontal, setIsHorizontal] = useState(false);

  // Add new state for My Pips page
  const [myPipsTab, setMyPipsTab] = useState<'recent' | 'public'>('recent');
  const [selectedPips, setSelectedPips] = useState<Set<number>>(new Set());
  const [editingPipId, setEditingPipId] = useState<number | null>(null);
  const [editingPipName, setEditingPipName] = useState<string>('');

  // Sample data for My Pips
  const sampleMyPips = [
    { id: 1, name: 'Todo List App', category: 'Productivity', description: 'A simple todo list app.', isPublic: false, lastModified: '2024-01-15' },
    { id: 2, name: 'Study Buddy', category: 'Education', description: 'Collaborative study sessions.', isPublic: true, lastModified: '2024-01-14' },
    { id: 3, name: 'Movie Night Planner', category: 'Entertainment', description: 'Plan and vote on movies with friends.', isPublic: false, lastModified: '2024-01-13' },
    { id: 4, name: 'Habit Tracker', category: 'Productivity', description: 'Track your daily habits.', isPublic: true, lastModified: '2024-01-12' },
    { id: 5, name: 'Language Learner', category: 'Education', description: 'Practice new languages.', isPublic: false, lastModified: '2024-01-11' },
  ];

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleApplyApiKey = useCallback(async (apiKey: string) => {
    setIsLoading(true);
    setError(null);
    
    // Check if this is an early bird access grant
    if (apiKey === 'EARLY_BIRD_ACCESS_GRANTED') {
      setUserProvidedApiKey(apiKey);
      setIsEarlyBirdKeyApplied(true);
      setError("Early Bird Code applied successfully! You now have unlimited access."); // Temporary success message
      setTimeout(() => setError(null), 3000);
    } else {
      setError("Invalid Early Bird Code. Please check your code and try again.");
      setIsEarlyBirdKeyApplied(false);
    }
    
    setIsLoading(false);
  }, []);

  const openConfigModal = (platform: string) => {
    setConfigPlatform(platform);
    setConfigApiKey('');
    setIsConfigModalOpen(true);
  };

  const handleConfigSubmit = () => {
    // Here you would typically save the API key to your backend
    console.log(`Saving ${configPlatform} API key:`, configApiKey);
    setError(`${configPlatform} API key saved successfully!`);
    setTimeout(() => setError(null), 3000);
    setIsConfigModalOpen(false);
  };

  // Profile editing functions
  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setTempAppName(appName);
    setTempAppLogo(appLogo);
  };

  const handleSaveProfile = () => {
    setAppName(tempAppName);
    setAppLogo(tempAppLogo);
    setIsEditingProfile(false);
  };

  const handleCancelProfile = () => {
    setTempAppName(appName);
    setTempAppLogo(appLogo);
    setIsEditingProfile(false);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempAppLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !canSubmit) {
      if (!canSubmit) {
        if (isEarlyBirdKeyApplied) {
          setError('Error with Early Bird access.');
        } else {
          setError('You have used all your free prompts.');
          // Show subscription modal when user runs out of prompts
          setIsSubscriptionModalOpen(true);
        }
      } else {
        setError('Prompt cannot be empty.');
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedCode('// Generating Swift code...');
    setPreviewHtml('<div class="w-full h-full flex items-center justify-center text-neutral-500"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div><p class="ml-3 text-neutral-600">Generating app & preview...</p></div>');
    setChatHistory([]);

    try {
      const result = await generateAppCodeAndPreview(prompt);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory([{ type: 'user', content: `App idea: ${prompt}` }, { type: 'ai', content: 'App generated successfully.' }]);
      setPrompt(''); 
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content: ${errorMessage}`);
      setPreviewHtml(`<div class="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 text-center"><p class="font-semibold">Error Generating Preview</p><p class="text-sm mt-2">${errorMessage}</p></div>`);
      setGeneratedCode(`// Error: ${errorMessage}`);
      setPreviewRefreshKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, canSubmit, isEarlyBirdKeyApplied]);

  const handlePreviewInteraction = useCallback(async (actionId: string, actionDescription: string) => {
    if (!canSubmit) {
      if (isEarlyBirdKeyApplied) {
        setError('Error with Early Bird access.');
      } else {
        setError('You have used all your free prompts for interaction-based refinement.');
        // Show subscription modal when user runs out of prompts
        setIsSubscriptionModalOpen(true);
      }
      return;
    }
    setIsLoading(true);
    setError(null);
    const oldCode = generatedCode;
    const oldPreview = previewHtml;

    const interactionLog = `User clicked "${actionDescription || actionId}" in preview.`;
    setChatHistory(prev => [...prev, { type: 'interaction', content: interactionLog }]);
    
    try {
      const result = await handleInteractionAndUpdateCodeAndPreview(generatedCode, previewHtml, actionId, actionDescription);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory(prev => [...prev, { type: 'ai', content: 'App updated based on preview interaction.' }]);
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to update based on interaction: ${errorMessage}`);
      setGeneratedCode(oldCode);
      setPreviewHtml(oldPreview);
      setChatHistory(prev => [...prev, { type: 'ai', content: `Error processing interaction: ${errorMessage}` }]);
      setPreviewRefreshKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [generatedCode, previewHtml, canSubmit, isEarlyBirdKeyApplied]);
  
  const downloadSwiftCode = () => {
    if (!generatedCode || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')) {
      setError("No valid code to download.");
      return;
    }
    const blob = new Blob([generatedCode], { type: 'text/swift' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MyPipApp.swift';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChatItemBackgroundClass = (type: 'user' | 'ai' | 'interaction') => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'ai': return 'bg-neutral-100 text-neutral-700';
      case 'interaction': return 'bg-sky-100 text-sky-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
   const getChatSpeaker = (type: 'user' | 'ai' | 'interaction') => {
    switch (type) {
      case 'user': return 'You:';
      case 'ai': return 'AI:';
      case 'interaction': return 'Preview Interaction:';
      default: return 'Log:';
    }
  };

  const refreshPreview = () => {
    setPreviewRefreshKey(prev => prev + 1);
  };

  // Dummy save handler
  const handleSave = () => {
    setError('Pip saved!');
    setTimeout(() => setError(null), 2000);
  };

  // Dummy share handler
  const handleShare = () => {
    setIsShareModalOpen(false);
    setError(allowRemix ? 'Pip shared with remixing allowed!' : 'Pip shared (remixing not allowed)!');
    setTimeout(() => setError(null), 2000);
  };

  // My Pips handlers
  const handleSelectPip = (pipId: number) => {
    const newSelected = new Set(selectedPips);
    if (newSelected.has(pipId)) {
      newSelected.delete(pipId);
    } else {
      newSelected.add(pipId);
    }
    setSelectedPips(newSelected);
  };

  const handleSelectAll = () => {
    const filteredPips = sampleMyPips.filter(pip => 
      myPipsTab === 'recent' ? !pip.isPublic : pip.isPublic
    );
    if (selectedPips.size === filteredPips.length) {
      setSelectedPips(new Set());
    } else {
      setSelectedPips(new Set(filteredPips.map(pip => pip.id)));
    }
  };

  const handleDeletePips = () => {
    // Remove selected pips from the list
    const pipsToDelete = Array.from(selectedPips);
    setError(`Deleted ${pipsToDelete.length} pip(s)`);
    setTimeout(() => setError(null), 2000);
    setSelectedPips(new Set());
  };

  const handleRenamePip = (pipId: number, newName: string) => {
    setError(`Renamed pip to "${newName}"`);
    setTimeout(() => setError(null), 2000);
    setEditingPipId(null);
    setEditingPipName('');
  };

  const handleStartRename = (pipId: number, currentName: string) => {
    setEditingPipId(pipId);
    setEditingPipName(currentName);
  };

  const handleCancelRename = () => {
    setEditingPipId(null);
    setEditingPipName('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-800 font-sans">
      {/* Hidden Sidebar - Hidden on mobile, hover on desktop */}
      <div className={`sidebar-container fixed left-0 top-0 h-full transition-all duration-300 ease-in-out bg-blue-900 text-white z-30 group hidden md:block ${isSidebarOpen ? 'w-64' : 'w-16 hover:w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-blue-800">
            <div className="flex items-center">
              {isEditingProfile ? (
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer">
                    <img 
                      src={tempAppLogo} 
                      alt="App Logo" 
                      className="h-8 w-8 rounded hover:opacity-80 transition-opacity"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={tempAppName}
                    onChange={(e) => setTempAppName(e.target.value)}
                    className="bg-blue-800 text-white text-sm font-semibold px-2 py-1 rounded border border-blue-600 focus:outline-none focus:border-blue-400"
                    placeholder="App Name"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <img 
                    src={appLogo} 
                    alt="App Logo" 
                    className="h-8 w-8 rounded"
                  />
                  <span className="ml-3 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {appName}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  My Account
                </span>
              </div>
              {isEditingProfile ? (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center p-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span className="ml-3 text-sm">
                      Done
                    </span>
                  </button>
                  <button
                    onClick={handleCancelProfile}
                    className="flex items-center p-2 rounded bg-blue-800 hover:bg-blue-900 transition-colors cursor-pointer flex-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    <span className="ml-3 text-sm">
                      Cancel
                    </span>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleEditProfile}
                  className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Edit Profile
                  </span>
                </div>
              )}
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Settings
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="pt-4 border-t border-blue-800">
              <div 
                onClick={() => setCurrentView('community')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26A6.003 6.003 0 0 0 8 16v6h2v-6c0-2.21 1.79-4 4-4s4 1.79 4 4v6h2zm-8-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6h-4z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Community
                </span>
              </div>
              <div 
                onClick={() => setCurrentView('myPips')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  My Pips
                </span>
              </div>
            </div>
            
            {/* Configuration Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="text-xs text-blue-300 mb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Configuration
              </div>
              <div 
                onClick={() => openConfigModal('Supabase')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.29 12.29a1 1 0 0 0-1.42 0L15 16.17V4a1 1 0 0 0-2 0v12.17l-3.88-3.88a1 1 0 0 0-1.41 1.41l5.59 5.59a1 1 0 0 0 1.41 0l5.59-5.59a1 1 0 0 0 0-1.41z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('StoreKit 2')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  StoreKit 2
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Clerk')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Clerk
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('n8n')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  n8n
                </span>
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="ml-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Developer Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`sidebar-container fixed left-0 top-0 h-full w-64 bg-blue-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isEditingProfile ? (
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer">
                      <img 
                        src={tempAppLogo} 
                        alt="App Logo" 
                        className="h-8 w-8 rounded hover:opacity-80 transition-opacity"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={tempAppName}
                      onChange={(e) => setTempAppName(e.target.value)}
                      className="bg-blue-800 text-white text-sm font-semibold px-2 py-1 rounded border border-blue-600 focus:outline-none focus:border-blue-400"
                      placeholder="App Name"
                    />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <img 
                      src={appLogo} 
                      alt="App Logo" 
                      className="h-8 w-8 rounded"
                    />
                    <span className="ml-3 text-sm font-semibold">
                      {appName}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                disabled={isEditingProfile}
                className={`p-1 text-white hover:text-gray-300 ${isEditingProfile ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="ml-3 text-sm">
                  My Account
                </span>
              </div>
              {isEditingProfile ? (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center p-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span className="ml-3 text-sm">
                      Done
                    </span>
                  </button>
                  <button
                    onClick={handleCancelProfile}
                    className="flex items-center p-2 rounded bg-blue-800 hover:bg-blue-900 transition-colors cursor-pointer flex-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    <span className="ml-3 text-sm">
                      Cancel
                    </span>
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleEditProfile}
                  className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  <span className="ml-3 text-sm">
                    Edit Profile
                  </span>
                </div>
              )}
              <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Settings
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="pt-4 border-t border-blue-800">
              <div 
                onClick={() => setCurrentView('community')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26A6.003 6.003 0 0 0 8 16v6h2v-6c0-2.21 1.79-4 4-4s4 1.79 4 4v6h2zm-8-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6h-4z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Community
                </span>
              </div>
              <div 
                onClick={() => setCurrentView('myPips')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  My Pips
                </span>
              </div>
            </div>
            
            {/* Configuration Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="text-xs text-blue-300 mb-2 px-2">
                Configuration
              </div>
              <div 
                onClick={() => openConfigModal('Supabase')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.29 12.29a1 1 0 0 0-1.42 0L15 16.17V4a1 1 0 0 0-2 0v12.17l-3.88-3.88a1 1 0 0 0-1.41 1.41l5.59 5.59a1 1 0 0 0 1.41 0l5.59-5.59a1 1 0 0 0 0-1.41z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('StoreKit 2')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span className="ml-3 text-sm">
                  StoreKit 2
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Clerk')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm">
                  Clerk
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('n8n')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                <span className="ml-3 text-sm">
                  n8n
                </span>
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="ml-3 text-xs">
                Developer Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with left margin for sidebar */}
      <div className="ml-0 md:ml-16">
        <header className="p-4 border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src={appLogo} 
                alt={`${appName} Logo`} 
                className="h-14 w-36 rounded cursor-pointer md:cursor-default"
                onClick={() => setIsSidebarOpen(true)}
              />
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {isEarlyBirdKeyApplied ? (
                <div className="text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-100 px-2 sm:px-3 py-1 rounded-full">
                  Unlimited Access
                </div>
              ) : (
                <div className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
                  Prompts: {freePromptsRemaining}/{MAX_FREE_PROMPTS}
                </div>
              )}
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium transition-colors"
                title="Get Unlimited Prompts & Support Us!"
              >
                <SparklesIcon className="h-4 w-4 mr-1 sm:mr-2" />
                Get Unlimited
              </button>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    className="flex items-center px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    title="Sign in to your account"
                  >
                    <svg className="h-4 w-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
                    {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        <main className={`flex-grow container mx-auto p-4 ${isHorizontal ? 'flex flex-row gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8'}`}>
          {currentView === 'main' ? (
            <>
              {/* Preview Section */}
              <div className={`${isHorizontal ? 'w-1/3' : 'flex flex-col items-center justify-start md:sticky md:top-28 h-full md:h-[calc(100vh-8rem)]'}`}>
                <div className="w-full flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-neutral-700">App Preview</h2>
                  <div className="flex items-center gap-2">
                    {/* Share Button */}
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      title="Share Pip"
                      className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a4 4 0 00-8 0v2" /></svg>
                    </button>
                    {/* Refresh Button */}
                    <button
                      onClick={refreshPreview}
                      title="Refresh Preview"
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <RefreshIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="w-full flex justify-end mb-3">
                  <div className="flex flex-col gap-2">
                    {/* Save Button */}
                    <button
                      onClick={handleSave}
                      title="Save Pip"
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                  </div>
                </div>
                <PhonePreview 
                  htmlContent={previewHtml} 
                  onPreviewInteraction={handlePreviewInteraction}
                  key={previewRefreshKey} 
                />
              </div>

              {/* Code/Prompt Section */}
              <div className={`${isHorizontal ? 'w-2/3 pl-6 flex flex-col space-y-6' : 'flex flex-col space-y-6'}`}>
                <div className="transition-opacity duration-500 ease-in-out">
                  <h2 className="text-xl font-semibold mb-3 text-neutral-700">Describe Your App</h2>
                  <PromptInput
                    prompt={prompt}
                    setPrompt={setPrompt}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    selectedModel={selectedModel}
                    onModelChange={(modelId) => setSelectedModel(modelId as ModelId)}
                    isDisabled={!canSubmit || isLoading}
                    actionText="Generate App"
                  />
                  
                  {chatHistory.length > 0 && (
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
                      <p className="font-semibold text-neutral-600 mb-2">Activity Log:</p>
                      <div ref={chatHistoryRef} className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {chatHistory.map((item, index) => (
                          <div key={index} className={`p-1.5 rounded text-xs ${getChatItemBackgroundClass(item.type)}`}>
                            <strong>{getChatSpeaker(item.type)}</strong> {item.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {error && <div className={`p-3 border rounded-md text-sm transition-opacity duration-300 ease-in-out ${error.includes("successfully") ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-red-100 border-red-300 text-red-700'}`}>{error}</div>}
                
                <div className="mt-2">
                   <div className="flex justify-between items-center mb-3">
                      <h2 className="text-xl font-semibold text-neutral-700">
                          {currentView === 'main' ? 'Generated iOS Code (SwiftUI)' : 'Updated iOS Code (SwiftUI)'}
                      </h2>
                      <button
                          onClick={downloadSwiftCode}
                          disabled={isLoading || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 text-white text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                          title="Download .swift file"
                      >
                          Download Code
                      </button>
                   </div>
                  <CodeDisplay code={generatedCode} />
                </div>

                {!canSubmit && currentView === 'main' && !isEarlyBirdKeyApplied && (
                  <div className="p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md text-sm text-center">
                    You've used all your free prompts. Enter an Early Bird Code for unlimited access or subscribe for unlimited prompts!
                  </div>
                )}

                <div className="flex gap-3 mb-6">
                  {/* Share Button */}
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a4 4 0 00-8 0v2" /></svg>
                    Share
                  </button>
                </div>
              </div>
            </>
          ) : currentView === 'community' ? (
            <div className="col-span-1 md:col-span-2">
              {/* Community Page Content */}
              <div className="bg-white border border-neutral-200 rounded-lg p-8 min-h-[600px] relative shadow-sm">
                {/* Back Button */}
                <div className="absolute left-8 top-8">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="flex items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to App Builder
                  </button>
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4 text-neutral-800">Community Pips</h1>
                  <p className="text-neutral-600 mb-8">Discover and explore amazing pips created by the myPip community</p>
                  {/* Search and Filter System */}
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search projects..."
                          className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          value={communitySearch}
                          onChange={e => setCommunitySearch(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <select
                          className="appearance-none px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 pr-10 shadow-sm hover:bg-neutral-100 transition-colors"
                          value={communityCategory}
                          onChange={e => setCommunityCategory(e.target.value)}
                        >
                          <option>All Categories</option>
                          <option>Social</option>
                          <option>Productivity</option>
                          <option>Entertainment</option>
                          <option>Education</option>
                        </select>
                        <svg className="w-5 h-5 text-neutral-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Filtered Project List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {sampleProjects
                      .filter(p =>
                        (communityCategory === 'All Categories' || p.category === communityCategory) &&
                        (p.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
                         p.description.toLowerCase().includes(communitySearch.toLowerCase()))
                      )
                      .map(project => (
                        <div key={project.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center mb-2">
                            <span className="text-lg font-semibold text-neutral-800 flex-1">{project.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">{project.category}</span>
                          </div>
                          <p className="text-neutral-600 text-sm">{project.description}</p>
                        </div>
                      ))}
                    {sampleProjects.filter(p =>
                        (communityCategory === 'All Categories' || p.category === communityCategory) &&
                        (p.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
                         p.description.toLowerCase().includes(communitySearch.toLowerCase()))
                      ).length === 0 && (
                        <div className="col-span-2 text-neutral-500 text-center py-12 text-lg">
                          No projects found.
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : currentView === 'myPips' ? (
            <div className="col-span-1 md:col-span-2">
              {/* My Pips Page Content */}
              <div className="bg-white border border-neutral-200 rounded-lg p-8 min-h-[600px] relative shadow-sm">
                {/* Back Button */}
                <div className="absolute left-8 top-8">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="flex items-center px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to App Builder
                  </button>
                </div>
                
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-4 text-neutral-800">My Pips</h1>
                  <p className="text-neutral-600 mb-8">Manage your created pips and share them with the community</p>
                  
                  {/* Tabs */}
                  <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex justify-center mb-6">
                      <div className="flex bg-neutral-100 rounded-lg p-1">
                        <button
                          onClick={() => setMyPipsTab('recent')}
                          className={`px-6 py-2 rounded-md transition-colors ${
                            myPipsTab === 'recent' 
                              ? 'bg-white text-neutral-800 shadow-sm' 
                              : 'text-neutral-600 hover:text-neutral-800'
                          }`}
                        >
                          Recent Builds
                        </button>
                        <button
                          onClick={() => setMyPipsTab('public')}
                          className={`px-6 py-2 rounded-md transition-colors ${
                            myPipsTab === 'public' 
                              ? 'bg-white text-neutral-800 shadow-sm' 
                              : 'text-neutral-600 hover:text-neutral-800'
                          }`}
                        >
                          Public Builds
                        </button>
                      </div>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPips.size === sampleMyPips.filter(pip => 
                              myPipsTab === 'recent' ? !pip.isPublic : pip.isPublic
                            ).length && selectedPips.size > 0}
                            onChange={handleSelectAll}
                            className="mr-2"
                          />
                          <span className="text-sm text-neutral-700">Select All</span>
                        </label>
                        {selectedPips.size > 0 && (
                          <button
                            onClick={handleDeletePips}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
                          >
                            Delete Selected ({selectedPips.size})
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {sampleMyPips.filter(pip => 
                          myPipsTab === 'recent' ? !pip.isPublic : pip.isPublic
                        ).length} {myPipsTab === 'recent' ? 'recent' : 'public'} builds
                      </div>
                    </div>
                    
                    {/* Pip List */}
                    <div className="space-y-4">
                      {sampleMyPips
                        .filter(pip => myPipsTab === 'recent' ? !pip.isPublic : pip.isPublic)
                        .map(pip => (
                          <div key={pip.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedPips.has(pip.id)}
                                  onChange={() => handleSelectPip(pip.id)}
                                  className="mr-2"
                                />
                                <div className="flex-1">
                                  {editingPipId === pip.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={editingPipName}
                                        onChange={(e) => setEditingPipName(e.target.value)}
                                        className="bg-white text-neutral-800 px-2 py-1 rounded border border-neutral-300 focus:outline-none focus:border-blue-400"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleRenamePip(pip.id, editingPipName);
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => handleRenamePip(pip.id, editingPipName)}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={handleCancelRename}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg font-semibold text-neutral-800">{pip.name}</span>
                                      <button
                                        onClick={() => handleStartRename(pip.id, pip.name)}
                                        className="text-neutral-500 hover:text-neutral-700 text-sm"
                                      >
                                        ✏️
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-4 mt-2">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{pip.category}</span>
                                    <span className="text-xs text-neutral-500">Last modified: {pip.lastModified}</span>
                                  </div>
                                  <p className="text-neutral-600 text-sm mt-2">{pip.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors">
                                  Open
                                </button>
                                <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">
                                  {pip.isPublic ? 'Unpublish' : 'Publish'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {sampleMyPips.filter(pip => 
                        myPipsTab === 'recent' ? !pip.isPublic : pip.isPublic
                      ).length === 0 && (
                        <div className="text-neutral-500 text-center py-12 text-lg">
                          No {myPipsTab === 'recent' ? 'recent' : 'public'} builds found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>
        <footer className="p-4 text-center text-sm text-neutral-500 border-t border-neutral-200">
          &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
        </footer>

        {isSubscriptionModalOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
            }}
            contactEmail={CONTACT_EMAIL}
          />
        )}

        {/* Configuration Modal */}
        {isConfigModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsConfigModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-neutral-800">
                  Configure {configPlatform}
                </h2>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {configPlatform} API Key
                  </label>
                  <input
                    type="password"
                    value={configApiKey}
                    onChange={(e) => setConfigApiKey(e.target.value)}
                    placeholder={`Enter your ${configPlatform} API key`}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfigSubmit}
                    disabled={!configApiKey.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 text-white font-medium rounded-lg transition-colors"
                  >
                    Save API Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-neutral-800">Share Your Pip</h2>
              <p className="mb-4 text-neutral-700">You are about to share your Pip with the myPip Community where it can be remixed and edited.</p>
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={!allowRemix}
                  onChange={() => setAllowRemix(r => !r)}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-700">Do not allow remixing</span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md"
                >Cancel</button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md"
                >Share</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
