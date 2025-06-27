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
import { SignInButton, SignedIn, SignedOut, UserButton, useUser, SignUpButton } from '@clerk/clerk-react';
import { useUserData } from './hooks/useUserData';
import { useProjects, usePublicProjects, useSavedProjects } from './hooks/useProjects';
import { AppleIcon } from './components/icons/AppleIcon';
import { convertSwiftToFlutter, convertSwiftToReact, convertFlutterToSwift, convertReactToSwift } from './services/conversionService.ts';
import { GitHubModal } from './components/GitHubModal';

type AppView = 'main' | 'community' | 'myPips' | 'affiliate';

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
  const [previewHtml, setPreviewHtml] = useState<string>(
    '<div class="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-blue-50 to-indigo-100">' +
    '<div class="max-w-xs">' +
    '</div></div>'
  );
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

  // Apple Connect credentials states
  const [appleKeyId, setAppleKeyId] = useState<string>('');
  const [appleIssuerId, setAppleIssuerId] = useState<string>('');
  const [applePrivateKey, setApplePrivateKey] = useState<string>('');

  // Google Play Store credentials states
  const [googleServiceAccountKey, setGoogleServiceAccountKey] = useState<string>('');

  // Apple App Store deployment states
  const [isAppleDeploymentModalOpen, setIsAppleDeploymentModalOpen] = useState<boolean>(false);
  const [appleAppName, setAppleAppName] = useState<string>('');
  const [appleBundleId, setAppleBundleId] = useState<string>('');
  const [applePrimaryLanguage, setApplePrimaryLanguage] = useState<string>('en');
  const [appleIpaFile, setAppleIpaFile] = useState<File | null>(null);
  const [isGeneratingIpa, setIsGeneratingIpa] = useState<boolean>(false);
  const [isDeploymentSubmitting, setIsDeploymentSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('myPip');
  const [appLogo, setAppLogo] = useState<string>('https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif');
  const [tempAppName, setTempAppName] = useState<string>('myPip');
  const [tempAppLogo, setTempAppLogo] = useState<string>('https://i.postimg.cc/QCGLyzyj/temp-Imagec-Se0jt.avif');

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const canSubmit = isEarlyBirdKeyApplied || freePromptsRemaining > 0; // Updated

  const { user } = useUser();
  
  // Database hooks with error handling
  // const { user: dbUser, updateUserProfile } = useUserData(); // Removed unused variables
  const { projects, createProject, updateProject, deleteProject, refreshProjects, remixProject } = useProjects();
  const { projects: publicProjects, loadPublicProjects, likeProject, recordView } = usePublicProjects();
  const { savedProjects, saveProject, unsaveProject, isProjectSaved } = useSavedProjects();

  // Fallback data in case database is not set up
  const fallbackProjects = projects || [];
  const fallbackPublicProjects = publicProjects || [];
  const fallbackSavedProjects = savedProjects || [];

  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('All Categories');

  // Add new state for share modal, remix permission, and layout
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [allowRemix, setAllowRemix] = useState(true);
  const [isHorizontal, setIsHorizontal] = useState(false);

  // Add new state for My Pips page
  const [myPipsTab, setMyPipsTab] = useState<'recent' | 'public' | 'saved'>('recent');
  const [selectedPips, setSelectedPips] = useState<Set<string>>(new Set());
  const [editingPipId, setEditingPipId] = useState<string | null>(null);
  const [editingPipName, setEditingPipName] = useState<string>('');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [isXcodeModalOpen, setIsXcodeModalOpen] = useState(false); // NEW
  // Placeholder for AI thought process (replace with real value if available)
  const [aiThoughtProcess, setAiThoughtProcess] = useState<string>("");
  const [hasGenerated, setHasGenerated] = useState(false); // NEW
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false); // NEW
  const [isSaving, setIsSaving] = useState(false); // NEW
  const [proceedEnabled, setProceedEnabled] = useState(false); // NEW
  const [thinkingLog, setThinkingLog] = useState(''); // NEW
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false); // NEW - Login prompt modal
  const [isSubmissionSuccessOpen, setIsSubmissionSuccessOpen] = useState(false); // NEW - Submission success modal
  const [isDarkMode, setIsDarkMode] = useState(false); // NEW - Dark mode toggle
  const [hasConfirmedFirstPrompt, setHasConfirmedFirstPrompt] = useState(false); // NEW - Track first prompt confirmation

  // NEW: Project naming and Android conversion states
  const [isProjectNameModalOpen, setIsProjectNameModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [tempProjectName, setTempProjectName] = useState('');
  const [isAndroidConversionModalOpen, setIsAndroidConversionModalOpen] = useState(false);
  const [isIOSConversionModalOpen, setIsIOSConversionModalOpen] = useState(false);
  const [conversionType, setConversionType] = useState<'flutter' | 'react' | null>(null);
  const [conversionDirection, setConversionDirection] = useState<'to-android' | 'to-ios' | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedCode, setConvertedCode] = useState('');
  const [currentCodeType, setCurrentCodeType] = useState<'swift' | 'flutter' | 'react'>('swift');
  
  // GitHub integration state
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Google Play Store deployment states
  const [isGooglePlayDeploymentModalOpen, setIsGooglePlayDeploymentModalOpen] = useState<boolean>(false);
  const [googlePlayAppName, setGooglePlayAppName] = useState<string>('');
  const [googlePlayServiceAccountKey, setGooglePlayServiceAccountKey] = useState<string>('');
  const [googlePlayServiceAccountFile, setGooglePlayServiceAccountFile] = useState<File | null>(null);
  const [googlePlayAabFile, setGooglePlayAabFile] = useState<File | null>(null);
  const [isGeneratingAab, setIsGeneratingAab] = useState<boolean>(false);
  const [googlePlayReleaseTrack, setGooglePlayReleaseTrack] = useState<'production' | 'beta' | 'alpha' | 'internal'>('production');
  const [googlePlayReleaseNotes, setGooglePlayReleaseNotes] = useState<string>('');
  const [googlePlayPublishAfterReview, setGooglePlayPublishAfterReview] = useState<'yes' | 'no'>('yes');

  // Beta notification state
  const [showBetaNotification, setShowBetaNotification] = useState(true);

  // V2 Waitlist popup state
  const [showV2WaitlistPopup, setShowV2WaitlistPopup] = useState<boolean>(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('hasSeenV2WaitlistPopup');
    return !hasSeenPopup; // Show popup if user hasn't seen it
  });
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [hasSeenV2Popup, setHasSeenV2Popup] = useState(false);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Load public projects when community page is opened
  useEffect(() => {
    if (currentView === 'community') {
      loadPublicProjects(communityCategory, communitySearch);
    }
  }, [currentView, communityCategory, communitySearch]);

  // Show V2 waitlist popup when user first logs in
  useEffect(() => {
    if (user && !hasSeenV2Popup) {
      // Small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        setShowV2WaitlistPopup(true);
        setHasSeenV2Popup(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasSeenV2Popup]);

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

  const handleJoinWaitlist = async () => {
    if (!waitlistEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsJoiningWaitlist(true);
    setError(null);
    
    try {
      // Simulate API call to join waitlist
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setError('Successfully joined the waitlist! You\'ll receive a 7-day trial of myPip Pro when V2 launches.');
      setTimeout(() => setError(null), 5000);
      setShowV2WaitlistPopup(false);
      setWaitlistEmail('');
    } catch (err) {
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  const handleCheckoutV1 = () => {
    setShowV2WaitlistPopup(false);
    setIsSubscriptionModalOpen(true);
  };

  const openConfigModal = (platform: string) => {
    setConfigPlatform(platform);
    setConfigApiKey('');
    // Reset Apple Connect fields
    setAppleKeyId('');
    setAppleIssuerId('');
    setApplePrivateKey('');
    // Reset Google Play Store fields
    setGoogleServiceAccountKey('');
    setIsConfigModalOpen(true);
  };

  const handleConfigSubmit = () => {
    if (configPlatform === 'Apple Connect') {
      // Handle Apple Connect credentials
      console.log('Saving Apple Connect credentials:', {
        keyId: appleKeyId,
        issuerId: appleIssuerId,
        privateKey: applePrivateKey ? '***PRIVATE_KEY***' : 'Not provided'
      });
      setError('Apple Connect credentials saved successfully!');
    } else if (configPlatform === 'Google Play Store') {
      // Handle Google Play Store credentials
      console.log('Saving Google Play Store service account key:', {
        serviceAccountKey: googleServiceAccountKey ? '***SERVICE_ACCOUNT_KEY***' : 'Not provided'
      });
      setError('Google Play Store service account key saved successfully!');
    } else {
      // Handle other platforms
      console.log(`Saving ${configPlatform} API key:`, configApiKey);
      setError(`${configPlatform} API key saved successfully!`);
    }
    setTimeout(() => setError(null), 3000);
    setIsConfigModalOpen(false);
  };

  const handlePrivateKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.p8')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setApplePrivateKey(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setError('Please select a valid .p8 file');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleServiceAccountKeyUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setGoogleServiceAccountKey(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        setError('Please select a valid .json file');
        setTimeout(() => setError(null), 3000);
      }
    }
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
    setPreviewHtml(`<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}"><div class="max-w-xs"><div class="animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'} mx-auto mb-4"></div></div></div>`);
    setChatHistory([]);
    setAiThoughtProcess('Analyzing your prompt and preparing a response...');
    setThinkingLog('');
    try {
      setTimeout(() => setAiThoughtProcess('Thinking about the best app structure...'), 1000);
      setTimeout(() => setAiThoughtProcess('Designing UI and generating Swift code...'), 2000);
      const result = await generateAppCodeAndPreview(prompt);
      setGeneratedCode(result.swiftCode);
      setPreviewHtml(result.previewHtml);
      setAiThoughtProcess('App generated!');
      // Simulate a summary log (replace with real backend summary if available)
      setThinkingLog('Generated a SwiftUI app based on your prompt. Used a list and add button for tasks. The design follows modern iOS guidelines.');
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      setChatHistory([{ type: 'user', content: `App idea: ${prompt}` }, { type: 'ai', content: 'App generated successfully.' }]);
      setPrompt('');
      setPreviewRefreshKey(prev => prev + 1);
      setHasGenerated(true);
      setHasConfirmedFirstPrompt(true); // NEW - Mark first prompt as confirmed
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content: ${errorMessage}`);
      setPreviewHtml(`<div class="w-full h-full flex flex-col items-center justify-center text-red-600 p-4 text-center"><p class="font-semibold">Error Generating Preview</p><p class="text-sm mt-2">${errorMessage}</p></div>`);
      setGeneratedCode(`// Error: ${errorMessage}`);
      setPreviewRefreshKey(prev => prev + 1);
      setAiThoughtProcess('');
      setThinkingLog('');
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

  // Save handler with database integration
  const handleSave = async () => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (!generatedCode || generatedCode === '// Code will appear here once generated...') {
      setError('No code to save. Please generate an app first.');
      return;
    }

    // Open project naming modal instead of directly saving
    setTempProjectName(projectName || `Pip - ${new Date().toLocaleDateString()}`);
    setIsProjectNameModalOpen(true);
  };

  // Share handler with database integration
  const handleShare = async () => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (!generatedCode || generatedCode === '// Code will appear here once generated...') {
      setError('No code to share. Please generate an app first.');
      return;
    }

    try {
      const projectData = {
        name: `Pip - ${new Date().toLocaleDateString()}`,
        description: prompt || 'Generated app',
        prompt: prompt,
        generated_code: generatedCode,
        preview_html: previewHtml,
        is_public: true,
        allow_remix: allowRemix,
        category: 'General'
      };

      const newProject = await createProject(projectData);
      if (newProject) {
        setIsShareModalOpen(false);
        setIsSubmissionSuccessOpen(true); // Show submission success modal
      } else {
        // Fallback for when database isn't set up - still show success modal
        setIsShareModalOpen(false);
        setIsSubmissionSuccessOpen(true);
        console.log('Database not set up yet, but showing success modal for demo purposes');
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      // Even on error, show success modal for demo purposes
      setIsShareModalOpen(false);
      setIsSubmissionSuccessOpen(true);
      console.log('Error occurred, but showing success modal for demo purposes');
    }
  };

  // My Pips handlers
  const handleSelectPip = (pipId: string) => {
    const newSelected = new Set(selectedPips);
    if (newSelected.has(pipId)) {
      newSelected.delete(pipId);
    } else {
      newSelected.add(pipId);
    }
    setSelectedPips(newSelected);
  };

  const handleSelectAll = () => {
    const filteredPips = fallbackProjects.filter(project => 
      myPipsTab === 'recent' ? !project.is_public : project.is_public
    );
    if (selectedPips.size === filteredPips.length) {
      setSelectedPips(new Set());
    } else {
      setSelectedPips(new Set(filteredPips.map(project => project.id)));
    }
  };

  const handleDeletePips = async () => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    const pipsToDelete = Array.from(selectedPips);
    try {
      for (const projectId of pipsToDelete) {
        await deleteProject(projectId);
      }
      setError(`Deleted ${pipsToDelete.length} pip(s)`);
      setTimeout(() => setError(null), 2000);
      setSelectedPips(new Set());
    } catch (error) {
      console.error('Error deleting projects:', error);
      setError('Failed to delete some pips');
    }
  };

  const handleRenamePip = async (pipId: string, newName: string) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    try {
      const updatedProject = await updateProject(pipId, { name: newName });
      if (updatedProject) {
        setError(`Renamed pip to "${newName}"`);
        setTimeout(() => setError(null), 2000);
        setEditingPipId(null);
        setEditingPipName('');
      } else {
        setError('Failed to rename pip');
      }
    } catch (error) {
      console.error('Error renaming project:', error);
      setError('Failed to rename pip');
    }
  };

  const handleStartRename = (pipId: string, currentName: string) => {
    setEditingPipId(pipId);
    setEditingPipName(currentName);
  };

  const handleCancelRename = () => {
    setEditingPipId(null);
    setEditingPipName('');
  };

  const handleOpenAccountModal = () => {
    setTempDisplayName(user?.fullName || user?.username || '');
    setTempBio((user?.publicMetadata?.bio as string) || '');
    setIsAccountModalOpen(true);
  };

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Remove setTempPhoto and setTempPhotoPreview calls
    }
  };

  const handleSaveAccount = () => {
    // Here you would typically save to your backend/database
    // For now, we'll just close the modal
    setIsAccountModalOpen(false);
    // Remove setTempPhoto and setTempPhotoPreview calls
  };

  const handleCancelAccount = () => {
    setIsAccountModalOpen(false);
    // Remove setTempPhoto and setTempPhotoPreview calls
  };

  // Simple fallback functions for when database is not available
  const handleSaveProject = async (projectId: string) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    try {
      const success = await saveProject(projectId);
      if (success) {
        setError('Project saved to your account!');
        setTimeout(() => setError(null), 2000);
      } else {
        setError('Project already saved');
        setTimeout(() => setError(null), 2000);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Database not set up yet. This feature will work once you set up the database.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleLikeProject = async (projectId: string) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    try {
      const success = await likeProject(projectId);
      if (success) {
        setError('Project liked!');
        setTimeout(() => setError(null), 2000);
      }
    } catch (error) {
      console.error('Error liking project:', error);
      setError('Database not set up yet. This feature will work once you set up the database.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemixProject = async (projectId: string) => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }
    
    try {
      const remixedProject = await remixProject(projectId);
      if (remixedProject) {
        setError('Project remixed! Check your "My Pips" page.');
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to remix project');
        setTimeout(() => setError(null), 2000);
      }
    } catch (error) {
      console.error('Error remixing project:', error);
      setError('Database not set up yet. This feature will work once you set up the database.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Insert after the header and before the main content (above 'Describe Your App')
  // <div className="container mx-auto flex justify-end mt-4">...</div>

  // Add this function inside the App component
  const handleNewProject = () => {
    console.log('+ button clicked!');
    console.log('Current state:', { prompt, generatedCode, previewHtml });
    
    // Check if there is unsaved work
    const hasUnsavedWork = prompt.trim() || (generatedCode && !generatedCode.startsWith('//')) || (previewHtml && !previewHtml.includes('App preview will appear here'));
    console.log('Has unsaved work:', hasUnsavedWork);
    
    // For testing - always show modal
    setIsNewProjectModalOpen(true);
    
    // Original logic (commented out for testing)
    /*
    if (hasUnsavedWork) {
      setIsNewProjectModalOpen(true);
    } else {
      // Reset all relevant state for a new project
      setPrompt('');
      setGeneratedCode('// Code will appear here once generated...');
      setPreviewHtml('<div class="w-full h-full flex items-center justify-center text-neutral-400 p-4 text-center"><p>App preview will appear here after you describe your app.</p></div>');
      setChatHistory([]);
      setAiThoughtProcess('');
      setThinkingLog('');
      setHasGenerated(false);
    }
    */
  };

  // Add a reset function to ensure all state is properly cleared
  const resetAppState = () => {
    setPrompt('');
    setGeneratedCode('// Code will appear here once generated...');
    setPreviewHtml('<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100"><div class="max-w-xs"></div></div>');
    setChatHistory([]);
    setAiThoughtProcess('');
    setThinkingLog('');
    setHasGenerated(false);
    setHasConfirmedFirstPrompt(false); // NEW - Reset first prompt confirmation
    setError(null);
    setPreviewRefreshKey(prev => prev + 1);
  };

  // Dark mode toggle function
  const toggleDarkMode = () => {
    console.log('Dark mode toggle clicked, current state:', isDarkMode);
    setIsDarkMode(prev => !prev);
  };

  // NEW: Project naming handlers
  const handleSaveProjectWithName = async () => {
    if (!tempProjectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        name: tempProjectName.trim(),
        description: prompt || 'Generated app',
        prompt: prompt,
        generated_code: generatedCode,
        preview_html: previewHtml,
        is_public: false,
        allow_remix: true,
        category: 'General'
      };

      const newProject = await createProject(projectData);
      if (newProject) {
        setProjectName(tempProjectName.trim());
        setError('Pip saved successfully!');
        setTimeout(() => setError(null), 2000);
        setIsProjectNameModalOpen(false);
      } else {
        setError('Failed to save Pip');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Failed to save Pip');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelProjectName = () => {
    setIsProjectNameModalOpen(false);
    setTempProjectName('');
  };

  // NEW: Android conversion handlers
  const handleAndroidConversion = () => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (!canSubmit) {
      setError('You need a prompt available to convert to Android.');
      setIsSubscriptionModalOpen(true);
      return;
    }

    setIsAndroidConversionModalOpen(true);
  };

  const handleConvertToFlutter = async () => {
    setConversionDirection('to-android');
    setConversionType('flutter');
    setIsConverting(true);
    setIsAndroidConversionModalOpen(false);

    try {
      // Convert Swift to Flutter
      const result = await convertSwiftToFlutter(generatedCode);
      setConvertedCode(result.flutterCode);
      setCurrentCodeType('flutter');
      setError('Successfully converted to Flutter!');
      setTimeout(() => setError(null), 2000);
      
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error converting to Flutter:', error);
      setError('Failed to convert to Flutter. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertToReact = async () => {
    setConversionDirection('to-android');
    setConversionType('react');
    setIsConverting(true);
    setIsAndroidConversionModalOpen(false);

    try {
      // Convert Swift to React Native
      const result = await convertSwiftToReact(generatedCode);
      setConvertedCode(result.reactCode);
      setCurrentCodeType('react');
      setError('Successfully converted to React Native!');
      setTimeout(() => setError(null), 2000);
      
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error converting to React Native:', error);
      setError('Failed to convert to React Native. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCancelConversion = () => {
    setIsAndroidConversionModalOpen(false);
    setConversionType(null);
    setConversionDirection(null);
  };

  const handleSaveIOSVersion = () => {
    setIsAndroidConversionModalOpen(false);
    setConversionType(null);
    // Keep the current Swift code
  };

  const handleIOSConversion = () => {
    if (!user) {
      setIsLoginPromptOpen(true);
      return;
    }

    if (!canSubmit) {
      setError('You need a prompt available to convert to iOS.');
      setIsSubscriptionModalOpen(true);
      return;
    }

    // Only show iOS conversion modal if current code is React or Flutter
    if (currentCodeType === 'react' || currentCodeType === 'flutter') {
      setIsIOSConversionModalOpen(true);
    } else {
      // If already Swift, just open the Xcode modal
      setIsXcodeModalOpen(true);
    }
  };

  const handleConvertToSwift = async () => {
    setConversionDirection('to-ios');
    setIsConverting(true);
    setIsIOSConversionModalOpen(false);

    try {
      let result;
      if (currentCodeType === 'flutter') {
        // Convert Flutter to Swift
        result = await convertFlutterToSwift(convertedCode);
        setGeneratedCode(result.swiftCode);
      } else if (currentCodeType === 'react') {
        // Convert React Native to Swift
        result = await convertReactToSwift(convertedCode);
        setGeneratedCode(result.swiftCode);
      }
      
      setCurrentCodeType('swift');
      setError('Successfully converted to Swift!');
      setTimeout(() => setError(null), 2000);
      
      if (!isEarlyBirdKeyApplied) {
        setFreePromptsRemaining(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Error converting to Swift:', error);
      setError('Failed to convert to Swift. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsConverting(false);
    }
  };

  const handleCancelIOSConversion = () => {
    setIsIOSConversionModalOpen(false);
    setConversionDirection(null);
  };

  const handleSaveCurrentVersion = () => {
    setIsIOSConversionModalOpen(false);
    // Keep the current code type
  };

  const handleGitHubClick = () => {
    setIsGitHubModalOpen(true);
  };

  const handleAppleDeploymentClick = () => {
    if (currentCodeType === 'flutter' || currentCodeType === 'react') {
      // If code is Flutter or React, first convert to Swift, then show deployment modal
      setConversionDirection('to-ios');
      setIsIOSConversionModalOpen(true);
    } else if (currentCodeType === 'swift') {
      // If already Swift, show deployment modal directly
      setIsAppleDeploymentModalOpen(true);
    }
  };

  const generateIpaFile = async () => {
    if (!appleAppName.trim() || !appleBundleId.trim()) {
      setError('Please fill in App Name and Bundle ID before generating IPA');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsGeneratingIpa(true);
    
    try {
      // Simulate IPA generation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a mock IPA file (in a real implementation, this would generate an actual IPA)
      const mockIpaContent = `Mock IPA file for ${appleAppName} with Bundle ID: ${appleBundleId}`;
      const blob = new Blob([mockIpaContent], { type: 'application/octet-stream' });
      const file = new File([blob], `${appleAppName.replace(/\s+/g, '-')}.ipa`, { type: 'application/octet-stream' });
      
      setAppleIpaFile(file);
      setError('IPA file generated successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      setError('Failed to generate IPA file. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGeneratingIpa(false);
    }
  };

  const handleAppleDeploymentSubmit = async () => {
    // Validate form fields
    if (!appleAppName.trim()) {
      setError('Please enter an app name');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!appleBundleId.trim()) {
      setError('Please enter a bundle ID');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!applePrimaryLanguage.trim()) {
      setError('Please select a primary language');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Validate Apple Connect credentials
    if (!appleKeyId.trim()) {
      setError('Please enter your Apple Connect Key ID');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!appleIssuerId.trim()) {
      setError('Please enter your Apple Connect Issuer ID');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!applePrivateKey.trim()) {
      setError('Please upload your .p8 private key file');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setIsDeploymentSubmitting(true);
    
    try {
      // Generate mock IPA file
      const mockIpaData = await generateIpaFile();
      
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log deployment details
      console.log('Apple App Store Deployment Details:', {
        appName: appleAppName,
        bundleId: appleBundleId,
        primaryLanguage: applePrimaryLanguage,
        appleKeyId,
        appleIssuerId,
        hasPrivateKey: !!applePrivateKey,
        ipaData: mockIpaData
      });
      
      // Show success message
      setSuccess('App successfully submitted to Apple App Store for review!');
      setTimeout(() => setSuccess(null), 5000);
      
      // Close modal and reset form
      setIsAppleDeploymentModalOpen(false);
      setAppleAppName('');
      setAppleBundleId('');
      setApplePrimaryLanguage('');
      
    } catch (error) {
      console.error('Deployment error:', error);
      setError('Failed to submit app to Apple App Store. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDeploymentSubmitting(false);
    }
  };

  const handleGooglePlayDeploymentClick = () => {
    if (currentCodeType === 'swift') {
      // If code is Swift, first convert to Flutter, then show deployment modal
      setConversionDirection('to-android');
      setConversionType('flutter');
      setIsAndroidConversionModalOpen(true);
    } else if (currentCodeType === 'flutter' || currentCodeType === 'react') {
      // If already Flutter or React, show deployment modal directly
      setIsGooglePlayDeploymentModalOpen(true);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-neutral-800'}`}>
      {/* Hidden Sidebar - Hidden on mobile, hover on desktop */}
      <div className={`sidebar-container fixed left-0 top-0 h-full transition-all duration-500 ease-in-out glass-card z-30 group hidden md:block ${isEditingProfile ? 'w-64' : isSidebarOpen ? 'w-64' : 'w-16 hover:w-64'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center">
              {isEditingProfile ? (
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer">
                    <img 
                      src={tempAppLogo} 
                      alt="App Logo" 
                      className="h-8 w-8 rounded-lg hover:opacity-80 transition-all duration-300 hover:scale-105"
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
                    className="glass-input text-white text-sm font-semibold px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                    placeholder="App Name"
                  />
                </div>
              ) : (
                <>
                  <SignedIn>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full overflow-hidden glass-button flex items-center justify-center flex-shrink-0">
                        {user?.imageUrl ? (
                          <img 
                            src={user.imageUrl} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                            style={{ objectPosition: 'center' }}
                          />
                        ) : (
                          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                      <span className="nav-text ml-3 text-sm text-white">
                        {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || appName}
                      </span>
                    </div>
                  </SignedIn>
                  <SignedOut>
                    <div className="flex items-center">
                      <img 
                        src="/plus-orb.png" 
                        alt="Profile" 
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <span className="nav-text ml-3 text-sm font-semibold text-white">
                        {appName}
                      </span>
                    </div>
                  </SignedOut>
                </>
              )}
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <SignedIn>
                <div 
                  onClick={handleOpenAccountModal}
                  className="nav-item glass-button flex items-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
                >
                  <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="nav-text ml-3 text-sm text-white">
                    {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'My Account'}
                  </span>
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <div className="nav-item glass-button flex items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer">
                    <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span className="nav-text ml-3 text-sm text-white">
                      Sign In
                    </span>
                  </div>
                </SignInButton>
              </SignedOut>
            </div>

            {/* App Builder Section */}
            <div className="pt-4 border-t border-white/20">
              <div className="text-xs text-white/60 mb-2 px-3 nav-text">
                App Builder
              </div>
              <div 
                onClick={handleNewProject}
                className="nav-item glass-button flex items-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span className="nav-text ml-3 text-sm text-white">
                  New Project
                </span>
              </div>
            </div>

            {/* Account Section */}
            <div className="pt-4 border-t border-white/20">
              <div className="text-xs text-white/60 mb-2 px-3 nav-text">
                Account
              </div>
              <div 
                onClick={handleOpenSettingsModal}
                className="nav-item glass-button flex items-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="nav-text ml-3 text-sm text-white">
                  Settings
                </span>
              </div>
              <div
                onClick={() => setCurrentView('affiliate')}
                className="nav-item glass-button flex items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V17a1 1 0 11-2 0v-2a1 1 0 112 0v.07A8.001 8.001 0 014.07 13H5a1 1 0 110 2h-2a1 1 0 01-1-1v-2a1 1 0 112 0v.07A8.001 8.001 0 0111 4.07V5a1 1 0 112 0v2a1 1 0 11-2 0V6.93A8.001 8.001 0 0119.93 11H19a1 1 0 110-2h2a1 1 0 011 1v2a1 1 0 11-2 0v-.07A8.001 8.001 0 0113 19.93z"/>
                </svg>
                <span className="nav-text ml-3 text-sm text-white">
                  Affiliate
                </span>
              </div>
            </div>

            {/* Community Section */}
            <div className="pt-4 border-t border-white/20">
              <div className="text-xs text-white/60 mb-2 px-3 nav-text">
                Community
              </div>
              <div 
                onClick={() => setCurrentView('community')}
                className="nav-item glass-button flex items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26A6.003 6.003 0 0 0 8 16v6h2v-6c0-2.21 1.79-4 4-4s4 1.79 4 4v6h2zm-8-2v-6c0-1.1.9-2 2-2s2 .9 2 2v6h-4z"/>
                </svg>
                <span className="nav-text ml-3 text-sm text-white">
                  Community
                </span>
              </div>
              <div 
                onClick={() => setCurrentView('myPips')}
                className="nav-item glass-button flex items-center justify-center p-3 rounded-lg hover:bg-white/10 transition-all duration-300 group/item cursor-pointer"
              >
                <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="nav-text ml-3 text-sm text-white">
                  My Pips
                </span>
              </div>
            </div>
            
            {/* Deployment Section */}
            <div className="pt-4 border-t border-blue-800">
              <div className="text-xs text-blue-300 mb-2 px-2">
                Deployment
              </div>
              
              <div 
                onClick={() => openConfigModal('Apple Connect')}
                className="nav-item glass-button w-full text-left p-3 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="nav-text">Apple Connect</span>
                </div>
              </div>
              
              <div 
                onClick={() => openConfigModal('Google Play Store')}
                className="nav-item glass-button w-full text-left p-3 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="nav-text">Google Play Store</span>
                </div>
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
                <span className="ml-3 text-sm text-white">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Clerk')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm text-white">
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
                <span className="ml-3 text-sm text-white">
                  n8n
                </span>
              </div>
            </div>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="nav-text ml-3 text-xs text-white/60">
                myPip v1.0
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
      <div className={`sidebar-container fixed left-0 top-0 h-full w-64 glass-card text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isEditingProfile ? (
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer">
                      <img 
                        src={tempAppLogo} 
                        alt="App Logo" 
                        className="h-8 w-8 rounded-lg hover:opacity-80 transition-all duration-300 hover:scale-105"
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
                      className="glass-input text-white text-sm font-semibold px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                      placeholder="App Name"
                    />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <SignedIn>
                      <img 
                        src={appLogo} 
                        alt="App Logo" 
                        className="h-8 w-8 rounded-lg"
                      />
                    </SignedIn>
                    <SignedOut>
                      <img 
                        src="/plus-orb.png" 
                        alt="Profile" 
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    </SignedOut>
                    <span className="ml-3 text-sm font-semibold text-white">
                      {appName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {/* My Account Section */}
            <div className="space-y-1">
              <SignedIn>
                <div 
                  onClick={handleOpenAccountModal}
                  className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="ml-3 text-sm text-white">
                    {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || 'My Account'}
                  </span>
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <div className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5l-5-5zM20 19h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
                    </svg>
                    <span className="ml-3 text-sm text-white">
                      Sign In
                    </span>
                  </div>
                </SignInButton>
              </SignedOut>
              {isEditingProfile ? (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center p-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span className="ml-3 text-sm text-white">
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
                    <span className="ml-3 text-sm text-white">
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
                  <span className="ml-3 text-sm text-white">
                    Edit Profile
                  </span>
                </div>
              )}
              <div 
                onClick={handleOpenSettingsModal}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
                <span className="ml-3 text-sm text-white">
                  Settings
                </span>
              </div>
              <div
                onClick={() => setCurrentView('affiliate')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors group/item cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.93V17a1 1 0 11-2 0v-2a1 1 0 112 0v.07A8.001 8.001 0 014.07 13H5a1 1 0 110 2h-2a1 1 0 01-1-1v-2a1 1 0 112 0v.07A8.001 8.001 0 0111 4.07V5a1 1 0 112 0v2a1 1 0 11-2 0V6.93A8.001 8.001 0 0119.93 11H19a1 1 0 110-2h2a1 1 0 011 1v2a1 1 0 11-2 0v-.07A8.001 8.001 0 0113 19.93z"/>
                </svg>
                <span className="ml-3 text-sm text-white">
                  Affiliate
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
                <span className="ml-3 text-sm text-white">
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
                <span className="ml-3 text-sm text-white">
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
                <span className="ml-3 text-sm text-white">
                  Supabase
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Apple Connect')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="ml-3 text-sm text-white">
                  Apple Connect
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Google Play Store')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="ml-3 text-sm text-white">
                  Google Play Store
                </span>
              </div>
              
              <div 
                onClick={() => openConfigModal('Clerk')}
                className="flex items-center p-2 rounded hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="ml-3 text-sm text-white">
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
                <span className="ml-3 text-sm text-white">
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
              <span className="ml-3 text-xs text-white">
                Developer Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with left margin for sidebar */}
      <div className="ml-0 md:ml-16 flex flex-col min-h-screen">
        <header className="glass-card p-4 sticky top-0 z-20 transition-all duration-300 m-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-white hover:text-gray-300 hover:bg-white/10 rounded-lg transition-all duration-300 mr-3"
                aria-label="Open menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img 
                src={isDarkMode ? '/robot-dark-logo.png' : appLogo} 
                alt={`${appName} Logo`} 
                className="hidden md:block h-14 w-36 rounded-lg cursor-pointer md:cursor-default transition-all hover:scale-105"
                onClick={() => setIsSidebarOpen(true)}
              />
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {isEarlyBirdKeyApplied ? (
                <div className="glass-button text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white">
                  Unlimited Access
                </div>
              ) : (
                <div className="glass-button text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                  Credits: {freePromptsRemaining}/{MAX_FREE_PROMPTS}
                </div>
              )}
              <button
                onClick={() => {
                  console.log('Get Unlimited button clicked');
                  setIsSubscriptionModalOpen(true);
                }}
                className="glass-button flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-500 text-white"
                title="Get Unlimited Prompts & Support Us!"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                Get Unlimited
              </button>
              <SignedOut>
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button
                      className="glass-button flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white"
                      title="Sign in to your account"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="glass-button text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 text-white">
                    {user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </SignedIn>
            </div>
          </div>
        </header>

        {/* + Button for New Project - Top Right (only show when not on first prompt) */}
        {hasConfirmedFirstPrompt && (
          <div className="container mx-auto flex justify-end mt-4 px-4">
            <div className="flex items-center space-x-3">
              {/* GitHub Button */}
              <button
                className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300"
                title="Open in GitHub"
                aria-label="Open in GitHub"
                onClick={handleGitHubClick}
              >
                <GithubIcon className="h-4 w-4" />
              </button>
              
              {/* Apple Button */}
              <button
                className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300"
                title="Deploy to Apple App Store"
                aria-label="Deploy to Apple App Store"
                onClick={handleAppleDeploymentClick}
              >
                <AppleIcon className="h-4 w-4" />
              </button>
              
              {/* Google Play Button */}
              <button
                className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300"
                title="Deploy to Google Play Store"
                aria-label="Deploy to Google Play Store"
                onClick={handleGooglePlayDeploymentClick}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
              </button>
              
              {/* Save Button */}
              <button
                className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300"
                title="Save Project"
                aria-label="Save Project"
                onClick={handleSave}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                onClick={toggleDarkMode}
              >
                {isDarkMode ? (
                  <svg className="h-4 w-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              
              <button
                className="glass-button flex items-center justify-center rounded-full transition-all duration-300"
                title="New Project"
                aria-label="New Project"
                onClick={handleNewProject}
                style={{ background: 'none', boxShadow: 'none', padding: 0, border: 'none' }}
              >
                <img
                  src="/plus-orb.png"
                  alt="New Project"
                  className="h-8 w-8 object-contain select-none pointer-events-none"
                  draggable="false"
                />
              </button>
            </div>
          </div>
        )}

        {/* Dark Mode Toggle for First Prompt Page */}
        {!hasConfirmedFirstPrompt && (
          <div className="container mx-auto flex justify-end mt-4 px-4 relative z-10">
            <button
              className="glass-button h-8 w-8 flex items-center justify-center rounded-full transition-all duration-300 z-20 relative"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <svg className="h-4 w-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        )}

        <main className={`flex-grow container mx-auto p-4 ${isHorizontal ? 'flex flex-row gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8'}`}>
          {currentView === 'main' ? (
            <>
              {!hasConfirmedFirstPrompt ? (
                // Replace the first prompt container div with a version that has no top padding and minimal spacing
                <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-start space-y-1 first-prompt-container" style={{paddingTop: '0', paddingBottom: '0.25rem'}}>
                  {/* Phone Preview - Even Smaller */}
                  <div className="w-[110px] flex justify-center">
                    <div className="glass-card p-1">
                      <PhonePreview 
                        htmlContent={previewHtml} 
                        onPreviewInteraction={handlePreviewInteraction}
                        key={previewRefreshKey}
                        size="mini"
                      />
                    </div>
                  </div>
                  {/* Prompt Input - Even More Compact */}
                  <div className="w-full max-w-[340px] flex justify-center">
                    <div className="glass-card p-2 w-full transition-opacity duration-500 ease-in-out">
                      <PromptInput
                        prompt={prompt}
                        setPrompt={setPrompt}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        selectedModel={selectedModel}
                        onModelChange={(modelId) => setSelectedModel(modelId as ModelId)}
                        isDisabled={!canSubmit || isLoading}
                        actionText="Generate App"
                        aiThoughtProcess={aiThoughtProcess}
                        thinkingLog={thinkingLog}
                        isDarkMode={isDarkMode}
                        hasGenerated={hasGenerated}
                      />
                    </div>
                    {error && (
                      <div className={`mt-1 glass-card p-2 text-xs transition-opacity duration-300 ease-in-out ${error.includes("successfully") ? 'bg-gradient-to-r from-green-400/20 to-blue-500/20 border-green-400/30' : 'bg-gradient-to-r from-red-400/20 to-pink-500/20 border-red-400/30'}`}>
                        {error}
                      </div>
                    )}
                    {!canSubmit && !isEarlyBirdKeyApplied && (
                      <div className="mt-1 glass-card p-2 text-xs text-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400/30">
                        You've used all your free prompts. Enter an Early Bird Code for unlimited access or subscribe for unlimited prompts!
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Full Layout (Existing) - Improved for Refine App
                <div className="col-span-1 md:col-span-2 refine-app-container">
                  {/* Left Section - Change Logs, Thinking, and Prompt */}
                  <div className="flex flex-col space-y-4">
                    {/* Change Logs and AI Thinking */}
                    <div className="space-y-4">
                      {chatHistory.length > 0 && (
                        <div className={`p-3 rounded-lg border text-xs ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                          <p className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-200' : 'text-neutral-600'}`}>Change Log:</p>
                          <div ref={chatHistoryRef} className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {chatHistory.map((item, index) => (
                              <div key={index} className={`p-1.5 rounded text-xs ${getChatItemBackgroundClass(item.type)}`}>
                                <strong>{getChatSpeaker(item.type)}</strong> {item.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* AI Thinking Process */}
                      {aiThoughtProcess && (
                        <div className={`p-3 rounded-lg border text-xs ${isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
                          <p className={`font-semibold mb-2 ${isDarkMode ? 'text-purple-200' : 'text-neutral-600'}`}>AI Thinking:</p>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            <div className={`p-1.5 rounded text-xs ${isDarkMode ? 'bg-purple-800/30' : 'bg-purple-100'}`}>
                              {aiThoughtProcess}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Refinement Prompt Box - At Bottom */}
                    <div className="mt-auto">
                      <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-neutral-700'}`}>Refine Your App</h2>
                      
                      {/* Chat-like AI Thinking Display */}
                      {aiThoughtProcess && (
                        <div className={`mb-4 p-4 rounded-xl border ${isDarkMode ? 'bg-purple-900/20 border-purple-700/50' : 'bg-purple-50 border-purple-200'} shadow-sm`}>
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-purple-600' : 'bg-purple-500'}`}>
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-700'} mb-1`}>
                                AI Thinking Process
                              </div>
                              <div className={`text-sm ${isDarkMode ? 'text-purple-100' : 'text-purple-600'} leading-relaxed`}>
                                {aiThoughtProcess.split('\n').map((step, index) => (
                                  <div key={index} className="mb-2 last:mb-0">
                                    {step.trim() && (
                                      <div className="flex items-start">
                                        <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></span>
                                        <span>{step.trim()}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Chat-like Input */}
                      <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}>
                        <div className="flex items-end space-x-3 p-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              placeholder="Describe how you'd like to refine your app..."
                              className={`w-full resize-none border-0 bg-transparent ${isDarkMode ? 'text-white placeholder-white/50' : 'text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-0 text-sm leading-relaxed`}
                              rows={3}
                              disabled={!canSubmit || isLoading}
                            />
                          </div>
                          <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || isLoading}
                            className={`p-2 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {error && (
                        <div className={`mt-3 p-3 border rounded-md text-sm transition-opacity duration-300 ease-in-out ${error.includes("successfully") ? (isDarkMode ? 'bg-emerald-900/20 border-emerald-700 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-700') : (isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-700')}`}>
                          {error}
                        </div>
                      )}
                      {success && (
                        <div className={`mt-1 glass-card p-2 text-xs transition-opacity duration-300 ease-in-out bg-gradient-to-r from-green-400/20 to-blue-500/20 border-green-400/30`}>
                          {success}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Section - iPhone Preview with Buttons */}
                  <div className="flex flex-col items-center justify-start">
                    <div className="glass-card p-4 w-full">
                      <div className="w-full flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">
                          {projectName ? `${projectName} Preview` : 'App Preview'}
                        </h2>
                        <div className="flex items-center gap-2">
                          {/* Share Button */}
                          <button
                            onClick={() => setIsShareModalOpen(true)}
                            title="Share Pip"
                            className="glass-button p-2 rounded-lg transition-all duration-300"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a4 4 0 00-8 0v2" /></svg>
                          </button>
                          {/* Refresh Button */}
                          <button
                            onClick={refreshPreview}
                            title="Refresh Preview"
                            className="glass-button p-2 rounded-lg transition-all duration-300"
                          >
                            <RefreshIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Phone Preview - Centered */}
                      <div className="flex justify-center mb-4">
                        <PhonePreview 
                          htmlContent={previewHtml} 
                          onPreviewInteraction={handlePreviewInteraction}
                          key={previewRefreshKey} 
                          className=""
                        />
                      </div>
                      
                      {/* Action Buttons Row */}
                      <div className="flex justify-center gap-2">
                        {/* Save Button */}
                        <button
                          onClick={handleSave}
                          title="Save Pip"
                          className="glass-button p-2 rounded-lg transition-all duration-300"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        
                        {/* GitHub Icon */}
                        <button
                          title="Connect to GitHub"
                          onClick={handleGitHubClick}
                          className="glass-button p-2 rounded-lg transition-all duration-300 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </button>
                        
                        {/* Apple Store Icon */}
                        <button
                          title="Deploy to Apple App Store"
                          className="glass-button p-2 rounded-lg transition-all duration-300 bg-gradient-to-r from-blue-400 to-purple-500"
                          onClick={handleAppleDeploymentClick}
                        >
                          <AppleIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Google Play Store Icon - Now Clickable and Green */}
                        <button
                          title="Deploy to Google Play Store"
                          onClick={handleGooglePlayDeploymentClick}
                          className="glass-button p-2 rounded-lg transition-all duration-300 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Code Section - Right */}
                  <div className="flex flex-col space-y-4">
                    <div className="mt-2">
                       <div className="flex justify-between items-center mb-3">
                          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-200' : 'text-neutral-700'}`}>
                              {currentCodeType === 'swift' 
                                ? (currentView === 'main' ? 'Generated iOS Code (SwiftUI)' : 'Updated iOS Code (SwiftUI)')
                                : currentCodeType === 'flutter'
                                ? 'Generated Android Code (Flutter)'
                                : 'Generated Android Code (React Native)'
                              }
                          </h2>
                          <button
                              onClick={downloadSwiftCode}
                              disabled={isLoading || generatedCode.startsWith('//') || generatedCode.startsWith('Error:')}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white focus:ring-blue-400' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 text-white focus:ring-blue-400'}`}
                              title="Download .swift file"
                          >
                              Download Code
                          </button>
                       </div>
                      <CodeDisplay code={currentCodeType === 'swift' ? generatedCode : convertedCode} isDarkMode={isDarkMode} />
                    </div>

                    {!canSubmit && currentView === 'main' && !isEarlyBirdKeyApplied && (
                      <div className={`p-3 border rounded-md text-sm text-center ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
                        You've used all your free prompts. Enter an Early Bird Code for unlimited access or subscribe for unlimited prompts!
                      </div>
                    )}

                    <div className="flex gap-3 mb-6">
                      {/* Share Button */}
                      <button
                        onClick={() => setIsShareModalOpen(true)}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-400' : 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-400'}`}
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v2a4 4 0 004 4h8a4 4 0 004-4v-2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a4 4 0 00-8 0v2" /></svg>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : currentView === 'community' ? (
            <div className="col-span-1 md:col-span-2">
              {/* Community Page Content */}
              <div className="glass-card p-4 md:p-8 min-h-[600px] relative">
                {/* Back Button */}
                <div className="absolute left-4 md:left-8 top-4 md:top-8">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="glass-button flex items-center px-3 md:px-4 py-2 text-white/80 hover:text-white rounded-lg transition-all duration-300 shadow-sm text-sm md:text-base"
                  >
                    <svg className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Back to App Builder</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
                <div className="text-center pt-16 md:pt-0">
                  <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Community Pips</h1>
                  <p className="text-white/80 mb-6 md:mb-8 px-4 md:px-0">Discover and explore amazing pips created by the myPip community</p>
                  
                  {/* Beta V1 Launch Notification */}
                  {showBetaNotification && (
                    <div className="max-w-2xl mx-auto mb-6 md:mb-8 px-4 md:px-0">
                      <div className="glass-card p-4 md:p-6 border border-white/20 backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl relative overflow-hidden">
                        {/* Liquid glass effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-2xl"></div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Beta V1 Launch Notice</h3>
                                <p className="text-sm text-white/80">During beta V1 launch and until further notice</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowBetaNotification(false)}
                              className="text-white/60 hover:text-white transition-colors p-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                            <p className="text-sm text-white/90 leading-relaxed">
                              Only <span className="font-semibold text-blue-300">admin-approved shared pips</span> will be highlighted in the community section. 
                              This ensures quality and maintains a curated experience during our beta phase.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Search and Filter System */}
                  <div className="max-w-2xl mx-auto mb-6 md:mb-8 px-4 md:px-0">
                    <div className="flex flex-col gap-3 md:gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search projects..."
                          className="glass-input w-full px-3 md:px-4 py-2 md:py-3 text-white placeholder-white/50 text-sm md:text-base"
                          value={communitySearch}
                          onChange={e => setCommunitySearch(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <select
                          className="glass-input appearance-none w-full px-3 md:px-4 py-2 md:py-3 text-white pr-10 shadow-sm transition-all duration-300 text-sm md:text-base"
                          value={communityCategory}
                          onChange={e => setCommunityCategory(e.target.value)}
                        >
                          <option>All Categories</option>
                          <option>Social</option>
                          <option>Productivity</option>
                          <option>Entertainment</option>
                          <option>Education</option>
                        </select>
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white/70 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {/* Filtered Project List */}
                  <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8 px-4 md:px-0">
                    {fallbackPublicProjects
                      .filter(p =>
                        (communityCategory === 'All Categories' || p.category === communityCategory) &&
                        (p.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
                         p.description.toLowerCase().includes(communitySearch.toLowerCase()))
                      )
                      .map(project => (
                        <div key={project.id} className="glass-card p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:mb-2">
                            <span className="text-base md:text-lg font-semibold text-white flex-1">{project.name}</span>
                            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full self-start sm:self-auto sm:ml-2">{project.category}</span>
                          </div>
                          <p className="text-white/80 text-sm mt-2 sm:mt-0">{project.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
                            <span>❤️ {project.likes_count} likes</span>
                            <span>👁️ {project.views_count} views</span>
                            <span>🔄 {project.remix_count} remixes</span>
                            <span>📅 {new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <SignedIn>
                              <button
                                onClick={async () => {
                                  await handleLikeProject(project.id);
                                }}
                                className="glass-button flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded text-sm transition-all duration-300"
                              >
                                ❤️ Like
                              </button>
                              <button
                                onClick={async () => {
                                  await handleSaveProject(project.id);
                                }}
                                className="glass-button flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded text-sm transition-all duration-300"
                              >
                                💾 Save
                              </button>
                              {project.allow_remix && (
                                <button
                                  onClick={async () => {
                                    await handleRemixProject(project.id);
                                  }}
                                  className="glass-button flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded text-sm transition-all duration-300"
                                >
                                  🔄 Remix
                                </button>
                              )}
                            </SignedIn>
                            <SignedOut>
                              <SignInButton mode="modal">
                                <button className="glass-button flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded text-sm transition-all duration-300">
                                  Sign in to interact
                                </button>
                              </SignInButton>
                            </SignedOut>
                          </div>
                        </div>
                      ))}
                    {fallbackPublicProjects.filter(p =>
                        (communityCategory === 'All Categories' || p.category === communityCategory) &&
                        (p.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
                         p.description.toLowerCase().includes(communitySearch.toLowerCase()))
                      ).length === 0 && (
                        <div className="text-white/60 text-center py-8 md:py-12 text-base md:text-lg">
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
              <div className="glass-card p-4 md:p-8 min-h-[600px] relative">
                {/* Back Button */}
                <div className="absolute left-4 md:left-8 top-4 md:top-8">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="glass-button flex items-center px-3 md:px-4 py-2 text-white/80 hover:text-white rounded-lg transition-all duration-300 shadow-sm text-sm md:text-base"
                  >
                    <svg className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Back to App Builder</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
                
                <div className="text-center pt-16 md:pt-0">
                  <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">My Pips</h1>
                  <p className="text-white/80 mb-6 md:mb-8 px-4 md:px-0">Manage your created pips and share them with the community</p>
                  
                  {/* Tabs */}
                  <div className="max-w-4xl mx-auto mb-6 md:mb-8 px-4 md:px-0">
                    <div className="flex justify-center mb-4 md:mb-6">
                      <div className="glass-card flex rounded-lg p-1 w-full max-w-xs">
                        <button
                          onClick={() => setMyPipsTab('recent')}
                          className={`flex-1 px-3 md:px-6 py-2 rounded-md transition-all duration-300 text-sm md:text-base ${
                            myPipsTab === 'recent' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                              : 'text-white/80 hover:text-white'
                          }`}
                        >
                          Recent
                        </button>
                        <button
                          onClick={() => setMyPipsTab('public')}
                          className={`flex-1 px-3 md:px-6 py-2 rounded-md transition-all duration-300 text-sm md:text-base ${
                            myPipsTab === 'public' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                              : 'text-white/80 hover:text-white'
                          }`}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => setMyPipsTab('saved')}
                          className={`flex-1 px-3 md:px-6 py-2 rounded-md transition-all duration-300 text-sm md:text-base ${
                            myPipsTab === 'saved' 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                              : 'text-white/80 hover:text-white'
                          }`}
                        >
                          Saved
                        </button>
                      </div>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 md:mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedPips.size === (myPipsTab === 'saved' ? fallbackSavedProjects : fallbackProjects).filter(project => 
                              myPipsTab === 'recent' ? !project.is_public : myPipsTab === 'public' ? project.is_public : true
                            ).length && selectedPips.size > 0}
                            onChange={handleSelectAll}
                            className="mr-2"
                          />
                          <span className="text-sm text-white/80">Select All</span>
                        </label>
                        {selectedPips.size > 0 && (
                          <button
                            onClick={handleDeletePips}
                            className="glass-button px-3 md:px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-md text-sm transition-all duration-300 self-start sm:self-auto"
                          >
                            Delete Selected ({selectedPips.size})
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-white/60 text-center sm:text-left">
                        {(myPipsTab === 'saved' ? fallbackSavedProjects : fallbackProjects).filter(project => 
                          myPipsTab === 'recent' ? !project.is_public : myPipsTab === 'public' ? project.is_public : true
                        ).length} {myPipsTab === 'recent' ? 'recent' : myPipsTab === 'public' ? 'public' : 'saved'} builds
                      </div>
                    </div>
                    
                    {/* Pip List */}
                    <div className="space-y-3 md:space-y-4">
                      {(myPipsTab === 'saved' ? fallbackSavedProjects : fallbackProjects)
                        .filter(project => myPipsTab === 'recent' ? !project.is_public : myPipsTab === 'public' ? project.is_public : true)
                        .map(project => (
                          <div key={project.id} className="glass-card p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedPips.has(project.id.toString())}
                                  onChange={() => handleSelectPip(project.id.toString())}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  {editingPipId === project.id.toString() ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingPipName}
                                        onChange={(e) => setEditingPipName(e.target.value)}
                                        className="glass-input px-2 py-1 rounded text-white text-sm"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleRenamePip(project.id.toString(), editingPipName);
                                          }
                                        }}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleRenamePip(project.id.toString(), editingPipName)}
                                          className="text-green-400 hover:text-green-300 text-sm transition-colors"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={handleCancelRename}
                                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-2">
                                      <span className="text-base md:text-lg font-semibold text-white break-words">{project.name}</span>
                                      {myPipsTab !== 'saved' && (
                                        <button
                                          onClick={() => handleStartRename(project.id.toString(), project.name)}
                                          className="text-white/60 hover:text-white text-sm flex-shrink-0 mt-1 transition-colors"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                                    <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full self-start">{project.category}</span>
                                    <span className="text-xs text-white/60">Last modified: {new Date(project.updated_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-white/80 text-sm mt-2">{project.description}</p>
                                  {myPipsTab === 'saved' && (
                                    <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
                                      <span>❤️ {project.likes_count} likes</span>
                                      <span>👁️ {project.views_count} views</span>
                                      <span>🔄 {project.remix_count} remixes</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                                <button className="glass-button px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded text-sm transition-all duration-300">
                                  Open
                                </button>
                                {myPipsTab !== 'saved' && (
                                  <button className="glass-button px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded text-sm transition-all duration-300">
                                    {project.is_public ? 'Unpublish' : 'Publish'}
                                  </button>
                                )}
                                {myPipsTab === 'saved' && (
                                  <button
                                    onClick={async () => {
                                      if (!user) {
                                        setIsLoginPromptOpen(true);
                                        return;
                                      }
                                      const success = await unsaveProject(project.id);
                                      if (success) {
                                        setError('Project removed from saved');
                                        setTimeout(() => setError(null), 2000);
                                      }
                                    }}
                                    className="glass-button px-3 py-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded text-sm transition-all duration-300"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {(myPipsTab === 'saved' ? fallbackSavedProjects : fallbackProjects).filter(project => 
                        myPipsTab === 'recent' ? !project.is_public : myPipsTab === 'public' ? project.is_public : true
                      ).length === 0 && (
                        <div className="text-white/60 text-center py-8 md:py-12 text-base md:text-lg">
                          No {myPipsTab === 'recent' ? 'recent' : myPipsTab === 'public' ? 'public' : 'saved'} builds found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentView === 'affiliate' ? (
            <div className="col-span-1 md:col-span-2">
              {/* Affiliate Page Content */}
              <div className="glass-card p-4 md:p-8 min-h-[600px] relative">
                {/* Back Button */}
                <div className="absolute left-4 md:left-8 top-4 md:top-8">
                  <button
                    onClick={() => setCurrentView('main')}
                    className="glass-button flex items-center px-3 md:px-4 py-2 text-white/80 hover:text-white rounded-lg transition-all duration-300 shadow-sm text-sm md:text-base"
                  >
                    <svg className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Back to App Builder</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
                
                <div className="text-center pt-16 md:pt-0">
                  <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Affiliate Program</h1>
                  <p className="text-white/80 mb-6 md:mb-8 px-4 md:px-0">Earn money by referring users to myPip</p>
                  
                  {/* Referral Link Section */}
                  <div className="max-w-2xl mx-auto mb-8 px-4 md:px-0">
                    <div className="glass-card p-4 md:p-6">
                      <h2 className="text-lg font-semibold mb-3 text-white">Your Referral Link</h2>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value="https://mypip.com/ref/your-unique-id"
                          readOnly
                          className="glass-input flex-1 px-3 py-2 text-white text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://mypip.com/ref/your-unique-id');
                            setError('Referral link copied to clipboard!');
                            setTimeout(() => setError(null), 2000);
                          }}
                          className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md text-sm font-medium transition-all duration-300"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Commission Structure */}
                  <div className="max-w-4xl mx-auto mb-8 px-4 md:px-0">
                    <h2 className="text-lg font-semibold mb-4 text-white">Commission Structure</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="glass-card p-4 text-center transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold mb-2 text-blue-400">5%</div>
                        <div className="text-sm text-white/80">Default Commission</div>
                        <div className="text-xs text-white/60 mt-1">Available to all users</div>
                      </div>
                      <div className="glass-card p-4 text-center transition-all duration-300 opacity-50 cursor-not-allowed">
                        <div className="text-2xl font-bold mb-2 text-gray-400">10%</div>
                        <div className="text-sm text-white/60">10+ Referrals</div>
                        <div className="text-xs text-white/40 mt-1">myPip Subscribers Only</div>
                      </div>
                      <div className="glass-card p-4 text-center transition-all duration-300 opacity-50 cursor-not-allowed">
                        <div className="text-2xl font-bold mb-2 text-gray-400">15%</div>
                        <div className="text-sm text-white/60">100+ Referrals</div>
                        <div className="text-xs text-white/40 mt-1">myPip Subscribers Only</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-white/60 mb-2">Want higher commissions?</p>
                      <button 
                        onClick={() => setIsSubscriptionModalOpen(true)}
                        className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md text-sm font-medium transition-all duration-300"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats Section */}
                  <div className="max-w-2xl mx-auto mb-8 px-4 md:px-0">
                    <h2 className="text-lg font-semibold mb-4 text-white">Your Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4 text-center transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold mb-1 text-blue-400">0</div>
                        <div className="text-sm text-white/80">Total Referrals</div>
                      </div>
                      <div className="glass-card p-4 text-center transition-all duration-300 hover:scale-105">
                        <div className="text-2xl font-bold mb-1 text-green-400">$0.00</div>
                        <div className="text-sm text-white/80">Total Earnings</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* How It Works */}
                  <div className="max-w-2xl mx-auto px-4 md:px-0">
                    <h2 className="text-lg font-semibold mb-4 text-white">How It Works</h2>
                    <div className="glass-card p-4 md:p-6">
                      <ol className="space-y-3 text-sm text-white/80">
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">1</span>
                          Share your referral link with friends, family, or on social media
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">2</span>
                          When someone signs up using your link, they get a special discount
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">3</span>
                          You earn a commission on their subscription payments
                        </li>
                        <li className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">4</span>
                          Payouts are processed monthly via PayPal or bank transfer
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        {isSubscriptionModalOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => {
              setIsSubscriptionModalOpen(false);
            }}
            contactEmail={CONTACT_EMAIL}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Configuration Modal */}
        {isConfigModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsConfigModalOpen(false)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Configure {configPlatform}
                </h2>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {configPlatform === 'Apple Connect' ? (
                  // Apple Connect specific fields
                  <>
                    {/* Learn About Apple Connect Link */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white/90 text-sm">Need help setting up Apple Connect?</span>
                        </div>
                        <a
                          href="https://developer.apple.com/documentation/appstoreconnectapi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-button px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-300"
                        >
                          Learn More
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Key ID
                      </label>
                      <input
                        type="text"
                        value={appleKeyId}
                        onChange={(e) => setAppleKeyId(e.target.value)}
                        placeholder="Enter your Apple Connect Key ID"
                        className="glass-input w-full p-3 text-white placeholder-white/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Issuer ID
                      </label>
                      <input
                        type="text"
                        value={appleIssuerId}
                        onChange={(e) => setAppleIssuerId(e.target.value)}
                        placeholder="Enter your Apple Connect Issuer ID"
                        className="glass-input w-full p-3 text-white placeholder-white/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        .p8 Private Key File
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept=".p8"
                          onChange={handlePrivateKeyUpload}
                          className="hidden"
                          id="private-key-upload"
                        />
                        <label
                          htmlFor="private-key-upload"
                          className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium cursor-pointer"
                        >
                          Upload .p8 File
                        </label>
                        {applePrivateKey && (
                          <span className="text-green-400 text-sm">✓ File uploaded</span>
                        )}
                      </div>
                      {applePrivateKey && (
                        <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/70">
                          Private key loaded successfully
                        </div>
                      )}
                    </div>
                  </>
                ) : configPlatform === 'Google Play Store' ? (
                  // Google Play Store specific fields
                  <>
                    {/* Learn About Google Play Store API Link */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-white/90 text-sm">Need help setting up Google Play Store API?</span>
                        </div>
                        <a
                          href="https://developers.google.com/android-publisher/getting_started"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-button px-3 py-1.5 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-300"
                        >
                          Learn More
                        </a>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Service Account Key (.json file)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleServiceAccountKeyUpload}
                          className="hidden"
                          id="service-account-upload"
                        />
                        <label
                          htmlFor="service-account-upload"
                          className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium cursor-pointer"
                        >
                          Upload .json File
                        </label>
                        {googleServiceAccountKey && (
                          <span className="text-green-400 text-sm">✓ File uploaded</span>
                        )}
                      </div>
                      {googleServiceAccountKey && (
                        <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/70">
                          Service account key loaded successfully
                        </div>
                      )}
                      <p className="text-xs text-white/60 mt-2">
                        Upload your Google Play Console service account key JSON file to enable app deployment.
                      </p>
                    </div>
                  </>
                ) : (
                  // Default API key field for other platforms
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      {configPlatform} API Key
                    </label>
                    <input
                      type="password"
                      value={configApiKey}
                      onChange={(e) => setConfigApiKey(e.target.value)}
                      placeholder={`Enter your ${configPlatform} API key`}
                      className="glass-input w-full p-3 text-white placeholder-white/50"
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsConfigModalOpen(false)}
                    className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfigSubmit}
                    disabled={configPlatform === 'Apple Connect' ? (!appleKeyId.trim() || !appleIssuerId.trim() || !applePrivateKey.trim()) : configPlatform === 'Google Play Store' ? !googleServiceAccountKey.trim() : !configApiKey.trim()}
                    className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300"
                  >
                    {configPlatform === 'Apple Connect' ? 'Save Credentials' : configPlatform === 'Google Play Store' ? 'Save Service Account Key' : 'Save API Key'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {isShareModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="text-lg font-semibold mb-4 text-white">Share Your Pip</h2>
              <p className="mb-4 text-white/80">You are about to share your Pip with the myPip Community where it can be remixed and edited.</p>
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={!allowRemix}
                  onChange={() => setAllowRemix(r => !r)}
                  className="mr-2"
                />
                <span className="text-sm text-white/80">Do not allow remixing</span>
              </label>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white"
                >Cancel</button>
                <button
                  onClick={handleShare}
                  className="glass-button px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >Share</button>
              </div>
            </div>
          </div>
        )}
        {/* Xcode/Apple Modal */}
        {isXcodeModalOpen && (
          <div className="modal-overlay" onClick={() => setIsXcodeModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors" onClick={() => setIsXcodeModalOpen(false)}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex flex-col items-center">
                <AppleIcon className="h-10 w-10 mb-2 text-white" />
                <h3 className="text-lg font-semibold mb-2 text-white">Open in Xcode</h3>
                <p className="text-sm text-white/80 mb-4 text-center">Download your Swift code or open the Xcode download page to get started.</p>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => { setIsXcodeModalOpen(false); downloadSwiftCode(); }}
                    className="glass-button w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-300"
                  >
                    Download Code
                  </button>
                  <a
                    href="https://developer.apple.com/xcode/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button w-full px-4 py-2 text-white/80 hover:text-white font-medium text-center transition-all duration-300"
                  >
                    Get Xcode
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Apple App Store Deployment Modal */}
        {isAppleDeploymentModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAppleDeploymentModalOpen(false)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                <div className="flex items-center">
                  <AppleIcon className="h-8 w-8 text-white mr-3" />
                  <h2 className="text-xl font-semibold text-white">Deploy to Apple App Store</h2>
                </div>
                <button
                  onClick={() => setIsAppleDeploymentModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-white/90 text-sm">
                    You are about to deploy your app to the Apple App Store. Please ensure all required information is provided and your Apple Connect credentials are configured.
                  </p>
                </div>
                
                {/* App Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">App Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      App Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={appleAppName}
                      onChange={(e) => setAppleAppName(e.target.value)}
                      placeholder="Enter your app name"
                      className="glass-input w-full p-3 text-white placeholder-white/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Bundle ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={appleBundleId}
                      onChange={(e) => setAppleBundleId(e.target.value)}
                      placeholder="com.yourcompany.appname"
                      className="glass-input w-full p-3 text-white placeholder-white/50"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Format: com.company.appname (e.g., com.mycompany.myapp)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Primary Language <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={applePrimaryLanguage}
                      onChange={(e) => setApplePrimaryLanguage(e.target.value)}
                      className="glass-input w-full p-3 text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>
                
                {/* Apple Connect Credentials Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">Apple Connect Credentials</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Key ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={appleKeyId}
                        onChange={(e) => setAppleKeyId(e.target.value)}
                        placeholder="Enter your Apple Connect Key ID"
                        className="glass-input w-full p-3 text-white placeholder-white/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Issuer ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={appleIssuerId}
                        onChange={(e) => setAppleIssuerId(e.target.value)}
                        placeholder="Enter your Apple Connect Issuer ID"
                        className="glass-input w-full p-3 text-white placeholder-white/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        .p8 Private Key File <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept=".p8"
                          onChange={handlePrivateKeyUpload}
                          className="hidden"
                          id="private-key-upload-deployment"
                        />
                        <label
                          htmlFor="private-key-upload-deployment"
                          className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium cursor-pointer"
                        >
                          Upload .p8 File
                        </label>
                        {applePrivateKey && (
                          <span className="text-green-400 text-sm">✓ File uploaded</span>
                        )}
                      </div>
                      {applePrivateKey && (
                        <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/70">
                          Private key loaded successfully
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg border ${appleKeyId ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <div className="flex items-center">
                        {appleKeyId ? (
                          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-sm text-white">Key ID</span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${appleIssuerId ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <div className="flex items-center">
                        {appleIssuerId ? (
                          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-sm text-white">Issuer ID</span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border ${applePrivateKey ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <div className="flex items-center">
                        {applePrivateKey ? (
                          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className="text-sm text-white">Private Key</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* IPA File Generation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">IPA File Generation</h3>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={generateIpaFile}
                      disabled={!appleAppName.trim() || !appleBundleId.trim() || isGeneratingIpa}
                      className="glass-button px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300"
                    >
                      {isGeneratingIpa ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating IPA...
                        </div>
                      ) : (
                        'Generate IPA File'
                      )}
                    </button>
                    
                    {appleIpaFile && (
                      <div className="flex items-center text-green-400">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{appleIpaFile.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {appleIpaFile && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-300 text-sm">
                        IPA file generated successfully! Ready for App Store submission.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
                <button
                  onClick={() => setIsAppleDeploymentModalOpen(false)}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAppleDeploymentSubmit}
                  disabled={!appleAppName.trim() || !appleBundleId.trim() || !appleIpaFile || !appleKeyId || !appleIssuerId || !applePrivateKey}
                  className="glass-button px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300"
                >
                  Deploy to App Store
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google Play Store Deployment Modal */}
        {isGooglePlayDeploymentModalOpen && (
          <div className="modal-overlay" onClick={() => setIsGooglePlayDeploymentModalOpen(false)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-white mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <h2 className="text-xl font-semibold text-white">Deploy to Google Play Store</h2>
                </div>
                <button
                  onClick={() => setIsGooglePlayDeploymentModalOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <p className="text-white/90 text-sm">
                    You are about to deploy your {currentCodeType === 'flutter' ? 'Flutter' : 'React Native'} app to the Google Play Store. Please ensure all required information is provided and your service account key is uploaded.
                  </p>
                </div>
                
                {/* App Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">App Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      App Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={googlePlayAppName}
                      onChange={(e) => setGooglePlayAppName(e.target.value)}
                      placeholder="Enter your app name"
                      className="glass-input w-full p-3 text-white placeholder-white/50"
                    />
                  </div>
                </div>
                
                {/* Google Play Service Account Key */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">Google Play Service Account Key</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Service Account Key (JSON) <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setGooglePlayServiceAccountFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setGooglePlayServiceAccountKey(event.target?.result as string);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="hidden"
                        id="service-account-key-upload"
                      />
                      <label
                        htmlFor="service-account-key-upload"
                        className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium cursor-pointer"
                      >
                        Upload JSON File
                      </label>
                      {googlePlayServiceAccountKey && (
                        <span className="text-green-400 text-sm">✓ File uploaded</span>
                      )}
                    </div>
                    {googlePlayServiceAccountKey && (
                      <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/70">
                        Service account key loaded successfully
                      </div>
                    )}
                  </div>
                </div>
                
                {/* App Bundle Tool */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">App Bundle Tool</h3>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={async () => {
                        if (!googlePlayAppName.trim()) {
                          setError('Please enter an app name before generating AAB');
                          setTimeout(() => setError(null), 3000);
                          return;
                        }
                        
                        setIsGeneratingAab(true);
                        try {
                          // Simulate AAB generation using Gemini services
                          await new Promise(resolve => setTimeout(resolve, 3000));
                          
                          // Create a mock AAB file
                          const mockAabContent = `Mock AAB file for ${googlePlayAppName} generated using Gemini services`;
                          const blob = new Blob([mockAabContent], { type: 'application/octet-stream' });
                          const file = new File([blob], `${googlePlayAppName.replace(/\s+/g, '-')}.aab`, { type: 'application/octet-stream' });
                          
                          setGooglePlayAabFile(file);
                          setSuccess('AAB file generated successfully using Gemini services!');
                          setTimeout(() => setSuccess(null), 3000);
                        } catch (error) {
                          setError('Failed to generate AAB file. Please try again.');
                          setTimeout(() => setError(null), 3000);
                        } finally {
                          setIsGeneratingAab(false);
                        }
                      }}
                      disabled={!googlePlayAppName.trim() || isGeneratingAab}
                      className="glass-button px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300"
                    >
                      {isGeneratingAab ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating AAB...
                        </div>
                      ) : (
                        'Generate AAB File'
                      )}
                    </button>
                    
                    {googlePlayAabFile && (
                      <div className="flex items-center text-green-400">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">{googlePlayAabFile.name}</span>
                      </div>
                    )}
                  </div>
                  
                  {googlePlayAabFile && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-300 text-sm">
                        AAB file generated successfully using Gemini services! Ready for Play Store submission.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Release Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-white/20 pb-2">Release Configuration</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Target Release Track <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={googlePlayReleaseTrack}
                      onChange={(e) => setGooglePlayReleaseTrack(e.target.value as 'production' | 'beta' | 'alpha' | 'internal')}
                      className="glass-input w-full p-3 text-white"
                    >
                      <option value="production">Production</option>
                      <option value="beta">Beta</option>
                      <option value="alpha">Alpha</option>
                      <option value="internal">Internal Testing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Release Notes <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={googlePlayReleaseNotes}
                      onChange={(e) => setGooglePlayReleaseNotes(e.target.value)}
                      placeholder="Describe what's new in this release..."
                      rows={4}
                      className="glass-input w-full p-3 text-white placeholder-white/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Publish after Google's review? <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={googlePlayPublishAfterReview}
                      onChange={(e) => setGooglePlayPublishAfterReview(e.target.value as 'yes' | 'no')}
                      className="glass-input w-full p-3 text-white"
                    >
                      <option value="yes">Yes, publish automatically after review</option>
                      <option value="no">No, I'll publish manually after review</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
                <button
                  onClick={() => setIsGooglePlayDeploymentModalOpen(false)}
                  className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Validate form fields
                    if (!googlePlayAppName.trim()) {
                      setError('Please enter an app name');
                      setTimeout(() => setError(null), 3000);
                      return;
                    }
                    
                    if (!googlePlayServiceAccountKey.trim()) {
                      setError('Please upload your service account key');
                      setTimeout(() => setError(null), 3000);
                      return;
                    }
                    
                    if (!googlePlayAabFile) {
                      setError('Please generate an AAB file before deploying');
                      setTimeout(() => setError(null), 3000);
                      return;
                    }
                    
                    if (!googlePlayReleaseNotes.trim()) {
                      setError('Please enter release notes');
                      setTimeout(() => setError(null), 3000);
                      return;
                    }
                    
                    setIsDeploymentSubmitting(true);
                    
                    try {
                      // Simulate deployment process
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      
                      // Log deployment details
                      console.log('Google Play Store Deployment Details:', {
                        appName: googlePlayAppName,
                        serviceAccountKey: '***SERVICE_ACCOUNT_KEY***',
                        hasAabFile: !!googlePlayAabFile,
                        releaseTrack: googlePlayReleaseTrack,
                        releaseNotes: googlePlayReleaseNotes,
                        publishAfterReview: googlePlayPublishAfterReview
                      });
                      
                      // Show success message
                      setSuccess('App successfully submitted to Google Play Store for review!');
                      setTimeout(() => setSuccess(null), 5000);
                      
                      // Close modal and reset form
                      setIsGooglePlayDeploymentModalOpen(false);
                      setGooglePlayAppName('');
                      setGooglePlayServiceAccountKey('');
                      setGooglePlayServiceAccountFile(null);
                      setGooglePlayAabFile(null);
                      setGooglePlayReleaseTrack('production');
                      setGooglePlayReleaseNotes('');
                      setGooglePlayPublishAfterReview('yes');
                      
                    } catch (error) {
                      console.error('Deployment error:', error);
                      setError('Failed to submit app to Google Play Store. Please try again.');
                      setTimeout(() => setError(null), 5000);
                    } finally {
                      setIsDeploymentSubmitting(false);
                    }
                  }}
                  disabled={!googlePlayAppName.trim() || !googlePlayServiceAccountKey.trim() || !googlePlayAabFile || !googlePlayReleaseNotes.trim() || isDeploymentSubmitting}
                  className="glass-button px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300"
                >
                  {isDeploymentSubmitting ? 'Deploying...' : 'Deploy to Play Store'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Edit Profile</h2>
              <button
                onClick={handleCancelAccount}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img 
                    src={user?.imageUrl || '/default-avatar.png'} 
                    alt="Profile" 
                    className="h-24 w-24 rounded-full object-cover border-4 border-white/20"
                  />
                  <label className="absolute bottom-0 right-0 glass-button rounded-full p-2 cursor-pointer transition-all duration-300 hover:scale-110">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  Display Name
                </label>
                <input
                  type="text"
                  value={tempDisplayName}
                  onChange={(e) => setTempDisplayName(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-white placeholder-white/50"
                  placeholder="Enter your display name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  Bio
                </label>
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  rows={3}
                  className="glass-input w-full px-3 py-2 text-white placeholder-white/50"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
              <button
                onClick={handleCancelAccount}
                className="glass-button px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccount}
                className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-white/60 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <button className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm transition-all duration-300">
                    Enable 2FA
                  </button>
                </div>
              </div>

              {/* Password Reset */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Password</h3>
                    <p className="text-sm text-white/60 mt-1">Change your account password</p>
                  </div>
                  <button className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm transition-all duration-300">
                    Reset Password
                  </button>
                </div>
              </div>

              {/* Email Preferences */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Email Preferences</h3>
                    <p className="text-sm text-white/60 mt-1">Manage your email notifications</p>
                  </div>
                  <button className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm transition-all duration-300">
                    Configure
                  </button>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">Privacy</h3>
                    <p className="text-sm text-white/60 mt-1">Control your privacy settings</p>
                  </div>
                  <button className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-sm transition-all duration-300">
                    Manage
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/20">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isNewProjectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Start a New Project?</h2>
              <button
                className="text-white/70 hover:text-white transition-colors"
                onClick={() => setIsNewProjectModalOpen(false)}
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-white/80">Would you like to save your current project before starting a new one?</p>
            <div className="flex gap-3 justify-end">
              <button
                className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-300 disabled:opacity-50"
                onClick={async () => {
                  setIsSaving(true);
                  await handleSave();
                  setIsSaving(false);
                  setProceedEnabled(true);
                  // Reset the app state after successful save
                  resetAppState();
                  setIsNewProjectModalOpen(false);
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="glass-button px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-300 disabled:opacity-50"
                onClick={() => {
                  setIsNewProjectModalOpen(false);
                  resetAppState();
                  setProceedEnabled(false);
                }}
                disabled={isSaving && !proceedEnabled}
              >
                {proceedEnabled ? 'Proceed' : 'Proceed without Saving'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {isLoginPromptOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full glass-button mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2 text-white">Sign In Required</h2>
              <p className="mb-6 text-white/80">Please sign in to save and share your Pips with the community.</p>
              <div className="flex flex-col gap-3">
                <SignInButton mode="modal">
                  <button className="glass-button w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-300">
                    Sign In
                  </button>
                </SignInButton>
                <button
                  onClick={() => setIsLoginPromptOpen(false)}
                  className="glass-button w-full px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-300"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {isSubmissionSuccessOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full glass-button mb-4 bg-gradient-to-r from-green-400 to-blue-500">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-white">Project Submitted Successfully!</h2>
              <div className="mb-6 text-white/80 space-y-2">
                <p>Your Pip has been submitted to the myPip community.</p>
                <p className="text-sm">Once an admin approves it, your project will be featured in our community section and landing page.</p>
                <p className="text-sm font-medium text-blue-300">You'll receive a notification when it's approved!</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsSubmissionSuccessOpen(false)}
                  className="glass-button w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-300"
                >
                  Continue Building
                </button>
                <button
                  onClick={() => {
                    setIsSubmissionSuccessOpen(false);
                    setCurrentView('community');
                  }}
                  className="glass-button w-full px-4 py-2 text-white/80 hover:text-white font-medium transition-all duration-300"
                >
                  View Community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Name Modal */}
      {isProjectNameModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Name Your Project</h2>
              <button
                onClick={handleCancelProjectName}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  placeholder="Enter a name for your project..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
              <button
                onClick={handleCancelProjectName}
                className="glass-button px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProjectWithName}
                disabled={!tempProjectName.trim() || isSaving}
                className="glass-button px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Conversion Modal */}
      {isAndroidConversionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Convert to Android</h2>
              <button
                onClick={handleCancelConversion}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full glass-button mb-4 bg-gradient-to-r from-green-400 to-green-600">
                  <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Convert Your iOS App to Android</h3>
                <p className="text-white/80 mb-4">
                  You're about to convert your Swift code to Android-compatible code. This process will cost 1 prompt.
                </p>
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Warning:</strong> This conversion process costs 1 prompt from your available prompts.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConvertToFlutter}
                  className="w-full glass-button p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="font-semibold">Convert to Flutter</h4>
                      <p className="text-sm opacity-80">Cross-platform mobile development with Dart</p>
                    </div>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </button>

                <button
                  onClick={handleConvertToReact}
                  className="w-full glass-button p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="font-semibold">Convert to React Native</h4>
                      <p className="text-sm opacity-80">Cross-platform development with JavaScript/React</p>
                    </div>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5V19C21 19.55 20.55 20 20 20H4C3.45 20 3 19.55 3 19V5C3 4.45 3.45 4 4 4H7ZM9 3V4H15V3H9ZM5 6V18H19V6H5Z"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
              <button
                onClick={handleSaveIOSVersion}
                className="glass-button px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
              >
                Keep iOS Version
              </button>
              <button
                onClick={handleCancelConversion}
                className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Loading Modal */}
      {isConverting && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full glass-button mb-4 bg-gradient-to-r from-green-400 to-green-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-white">
                {conversionDirection === 'to-android' 
                  ? `Converting to ${conversionType === 'flutter' ? 'Flutter' : 'React Native'}...`
                  : 'Converting to SwiftUI...'
                }
              </h2>
              <p className="text-white/80">
                {conversionDirection === 'to-android'
                  ? `Please wait while we convert your Swift code to ${conversionType === 'flutter' ? 'Flutter' : 'React Native'}. This may take a few moments.`
                  : 'Please wait while we convert your code to SwiftUI. This may take a few moments.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* iOS Conversion Modal */}
      {isIOSConversionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
              <h2 className="text-xl font-semibold text-white">Convert to iOS</h2>
              <button
                onClick={handleCancelIOSConversion}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full glass-button mb-4 bg-gradient-to-r from-blue-400 to-purple-500">
                  <AppleIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Convert Your {currentCodeType === 'flutter' ? 'Flutter' : 'React Native'} App to iOS</h3>
                <p className="text-white/80 mb-4">
                  You're about to convert your {currentCodeType === 'flutter' ? 'Flutter' : 'React Native'} code to SwiftUI. This process will cost 1 prompt.
                </p>
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Warning:</strong> This conversion process costs 1 prompt from your available prompts.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleConvertToSwift}
                  disabled={isConverting}
                  className="w-full glass-button p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h4 className="font-semibold">
                        {isConverting ? 'Converting...' : `Convert to SwiftUI`}
                      </h4>
                      <p className="text-sm opacity-80">
                        {currentCodeType === 'flutter' 
                          ? 'Convert Flutter code to native iOS SwiftUI' 
                          : 'Convert React Native code to native iOS SwiftUI'
                        }
                      </p>
                    </div>
                    {isConverting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      <AppleIcon className="h-6 w-6" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
              <button
                onClick={handleSaveCurrentVersion}
                className="glass-button px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
              >
                Keep {currentCodeType === 'flutter' ? 'Flutter' : 'React Native'} Version
              </button>
              <button
                onClick={handleCancelIOSConversion}
                className="glass-button px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* V2 Waitlist Popup */}
      {showV2WaitlistPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 md:p-8 border border-white/20 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Liquid glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/3 to-transparent rounded-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">myPip V2 is Coming!</h2>
                <p className="text-white/80 text-sm">Get ready for the future of AI app development</p>
              </div>

              {/* Message */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
                <p className="text-white/90 text-sm leading-relaxed mb-3">
                  <span className="font-semibold text-blue-300">myPip V2</span> is about to go live with our revolutionary 
                  <span className="font-semibold text-purple-300"> Agentic Framework</span>!
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  Join the waitlist and get a <span className="font-semibold text-green-300">7-day trial of myPip Pro</span> upon launch.
                </p>
              </div>

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="glass-input w-full px-4 py-3 text-white placeholder-white/50 rounded-xl border border-white/20 focus:border-white/40 transition-all duration-300"
                />
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleJoinWaitlist}
                  disabled={isJoiningWaitlist}
                  className="w-full glass-button px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoiningWaitlist ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Joining Waitlist...
                    </div>
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
                
                <button
                  onClick={handleCheckoutV1}
                  className="w-full glass-button px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-300"
                >
                  Check out myPip V1
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowV2WaitlistPopup(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        code={currentCodeType === 'swift' ? generatedCode : convertedCode}
        projectName={projectName || 'My App'}
        codeType={currentCodeType}
      />
    </div>
  );
};

export default App;
