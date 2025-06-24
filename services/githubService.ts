import { simulateGitHubAuth } from './githubProxy';

// GitHub OAuth and API Service
const GITHUB_CLIENT_ID = 'Ov23liiDXv1qIPEGgOg4';
const GITHUB_REDIRECT_URI = 'https://mypipnewupdates-production.up.railway.app/api/github/callback';
const GITHUB_API_BASE = 'https://api.github.com';
const BACKEND_API_BASE = 'https://mypipnewupdates-production.up.railway.app/api';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubAuthResponse {
  access_token: string;
  token_type: string;
  scope: string;
  user: GitHubUser;
  expires_in?: number;
  refresh_token?: string;
}

export interface CreateRepositoryRequest {
  name: string;
  description: string;
  private: boolean;
  auto_init: boolean;
}

export interface PushCodeRequest {
  repositoryName: string;
  code: string;
  fileName: string;
  commitMessage: string;
}

// Initialize GitHub OAuth flow
export const initiateGitHubAuth = (): void => {
  const state = generateRandomState();
  localStorage.setItem('github_oauth_state', state);
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo,user&state=${state}`;
  
  window.open(authUrl, '_blank', 'width=600,height=700');
};

// Generate random state for OAuth security
const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Handle OAuth callback using production backend
export const handleGitHubCallback = async (code: string, state: string): Promise<GitHubAuthResponse> => {
  const storedState = localStorage.getItem('github_oauth_state');
  
  if (state !== storedState) {
    throw new Error('Invalid OAuth state');
  }
  
  try {
    const response = await fetch(`${BACKEND_API_BASE}/github/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }
    
    const authData = await response.json();
    localStorage.setItem('github_access_token', authData.access_token);
    localStorage.removeItem('github_oauth_state');
    
    return authData;
  } catch (error) {
    console.error('Failed to exchange code for token:', error);
    throw error;
  }
};

// Get current user info via backend proxy
export const getGitHubUser = async (): Promise<GitHubUser> => {
  const token = localStorage.getItem('github_access_token');
  if (!token) {
    throw new Error('No GitHub access token found');
  }
  
  const response = await fetch(`${BACKEND_API_BASE}/github/user`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch GitHub user');
  }
  
  return response.json();
};

// Get user repositories via backend proxy
export const getUserRepositories = async (): Promise<GitHubRepository[]> => {
  const token = localStorage.getItem('github_access_token');
  if (!token) {
    throw new Error('No GitHub access token found');
  }
  
  const response = await fetch(`${BACKEND_API_BASE}/github/repos?sort=updated&per_page=100`, {
    headers: {
      'Authorization': `token ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch repositories');
  }
  
  return response.json();
};

// Create a new repository via backend proxy
export const createRepository = async (request: CreateRepositoryRequest): Promise<GitHubRepository> => {
  const token = localStorage.getItem('github_access_token');
  if (!token) {
    throw new Error('No GitHub access token found');
  }
  
  const response = await fetch(`${BACKEND_API_BASE}/github/repos`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create repository');
  }
  
  return response.json();
};

// Push code to repository via backend proxy
export const pushCodeToRepository = async (request: PushCodeRequest): Promise<void> => {
  const token = localStorage.getItem('github_access_token');
  if (!token) {
    throw new Error('No GitHub access token found');
  }
  
  const response = await fetch(`${BACKEND_API_BASE}/github/push`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to push code to repository');
  }
  
  return response.json();
};

// Check if user is authenticated
export const isGitHubAuthenticated = (): boolean => {
  return !!localStorage.getItem('github_access_token');
};

// Logout from GitHub
export const logoutGitHub = (): void => {
  localStorage.removeItem('github_access_token');
  localStorage.removeItem('github_oauth_state');
};

// Get repository URL for display
export const getRepositoryUrl = (repositoryName: string): string => {
  return `https://github.com/${repositoryName}`;
}; 