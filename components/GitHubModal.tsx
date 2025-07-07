import React, { useState, useEffect } from 'react';
import { 
  initiateGitHubAuth, 
  getGitHubUser, 
  getUserRepositories, 
  createRepository, 
  pushCodeToRepository, 
  isGitHubAuthenticated, 
  logoutGitHub,
  getRepositoryUrl,
  type GitHubUser,
  type GitHubRepository,
  type CreateRepositoryRequest,
  type PushCodeRequest
} from '../services/githubService';
import { simulateGitHubAuth } from '../services/githubProxy';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  projectName: string;
  codeType: 'swift' | 'flutter' | 'react';
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  code,
  projectName,
  codeType
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Repository creation state
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Repository selection state
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
      // Set default values
      setFileName(getDefaultFileName());
      setCommitMessage(getDefaultCommitMessage());
    }
  }, [isOpen, projectName, codeType]);

  const checkAuthStatus = async () => {
    const authenticated = isGitHubAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      try {
        const userData = await getGitHubUser();
        setUser(userData);
        await loadRepositories();
      } catch (error) {
        console.error('Failed to load GitHub data:', error);
        logoutGitHub();
        setIsAuthenticated(false);
      }
    }
  };

  const loadRepositories = async () => {
    try {
      setIsLoading(true);
      const repos = await getUserRepositories();
      setRepositories(repos);
    } catch (error) {
      console.error('Failed to load repositories:', error);
      setError('Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    // For development, we'll simulate the OAuth flow
    // In production, this would open the actual GitHub OAuth URL
    if (process.env.NODE_ENV === 'development') {
      // Simulate successful authentication for development
      setTimeout(async () => {
        try {
          const authData = await simulateGitHubAuth();
          localStorage.setItem('github_access_token', authData.access_token);
          await checkAuthStatus();
        } catch (error) {
          console.error('Failed to simulate GitHub auth:', error);
          setError('Failed to authenticate with GitHub');
        }
      }, 1000);
    } else {
      // Production OAuth flow
      initiateGitHubAuth();
      // Set up a listener for the OAuth callback
      const checkAuth = setInterval(async () => {
        if (isGitHubAuthenticated()) {
          clearInterval(checkAuth);
          await checkAuthStatus();
        }
      }, 1000);
    }
  };

  const handleLogout = () => {
    logoutGitHub();
    setIsAuthenticated(false);
    setUser(null);
    setRepositories([]);
    setError(null);
  };

  const handleCreateRepository = async () => {
    if (!newRepoName.trim()) {
      setError('Repository name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const request: CreateRepositoryRequest = {
        name: newRepoName,
        description: newRepoDescription,
        private: isPrivate,
        auto_init: true,
      };
      
      const newRepo = await createRepository(request);
      setRepositories(prev => [newRepo, ...prev]);
      setSelectedRepo(newRepo.full_name);
      setShowCreateRepo(false);
      setNewRepoName('');
      setNewRepoDescription('');
      setSuccess(`Repository "${newRepo.name}" created successfully!`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to create repository:', error);
      setError(error instanceof Error ? error.message : 'Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushCode = async () => {
    if (!selectedRepo) {
      setError('Please select a repository');
      return;
    }

    if (!fileName.trim()) {
      setError('File name is required');
      return;
    }

    if (!commitMessage.trim()) {
      setError('Commit message is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const request: PushCodeRequest = {
        repositoryName: selectedRepo,
        code,
        fileName,
        commitMessage,
      };
      
      await pushCodeToRepository(request);
      setSuccess('Code pushed to GitHub successfully!');
      
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to push code:', error);
      setError(error instanceof Error ? error.message : 'Failed to push code to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultFileName = (): string => {
    switch (codeType) {
      case 'swift':
        return 'ContentView.swift';
      case 'flutter':
        return 'main.dart';
      case 'react':
        return 'App.js';
      default:
        return 'app.js';
    }
  };

  const getDefaultCommitMessage = (): string => {
    return `Add ${projectName} ${codeType.toUpperCase()} code`;
  };

  const getFileExtension = (): string => {
    switch (codeType) {
      case 'swift':
        return '.swift';
      case 'flutter':
        return '.dart';
      case 'react':
        return '.js';
      default:
        return '.js';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
          <h2 className="text-xl font-semibold text-white">Connect to GitHub</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center space-y-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full glass-button mb-4 bg-gradient-to-r from-gray-600 to-gray-800">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Connect Your GitHub Account</h3>
            <p className="text-white/80 mb-6">
              Connect your GitHub account to push your {projectName} {codeType.toUpperCase()} code to a repository.
            </p>
            <button
              onClick={handleGitHubLogin}
              className="glass-button w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-semibold transition-all duration-300"
            >
              <svg className="h-5 w-5 mr-2 inline" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.avatar_url} 
                  alt={user?.name || user?.login} 
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{user?.name || user?.login}</p>
                  <p className="text-white/60 text-sm">@{user?.login}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-white/60 hover:text-white transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>

            {/* Repository Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Select Repository</h3>
                <button
                  onClick={() => setShowCreateRepo(!showCreateRepo)}
                  className="glass-button px-3 py-1.5 text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300"
                >
                  {showCreateRepo ? 'Cancel' : 'Create New'}
                </button>
              </div>

              {showCreateRepo ? (
                <div className="space-y-4 p-4 bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Repository Name</label>
                    <input
                      type="text"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-white"
                      placeholder="my-awesome-app"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description (optional)</label>
                    <input
                      type="text"
                      value={newRepoDescription}
                      onChange={(e) => setNewRepoDescription(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-white"
                      placeholder={`${projectName} ${codeType.toUpperCase()} app`}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="private-repo"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="private-repo" className="text-white text-sm">
                      Make this repository private
                    </label>
                  </div>
                  <button
                    onClick={handleCreateRepository}
                    disabled={isLoading || !newRepoName.trim()}
                    className="glass-button w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Repository'}
                  </button>
                </div>
              ) : (
                <div>
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-white"
                  >
                    <option value="">Select a repository...</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* File Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">File Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-white mb-2">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-white"
                  placeholder={getDefaultFileName()}
                />
                <p className="text-white/60 text-xs mt-1">
                  Recommended: {getDefaultFileName()} (with {getFileExtension()} extension)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-white"
                  placeholder={getDefaultCommitMessage()}
                />
              </div>
            </div>

            {/* Push Button */}
            <button
              onClick={handlePushCode}
              disabled={isLoading || !selectedRepo || !fileName.trim() || !commitMessage.trim()}
              className="glass-button w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Pushing to GitHub...' : 'Push to GitHub'}
            </button>

            {selectedRepo && (
              <div className="text-center">
                <a
                  href={getRepositoryUrl(selectedRepo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  View repository on GitHub →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 