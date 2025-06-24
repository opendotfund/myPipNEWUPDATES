// GitHub OAuth Proxy Service
// This service handles the OAuth token exchange with GitHub
// In a production environment, this should be handled by your backend server

const GITHUB_CLIENT_ID = 'Ov23liiDXv1qIPEGgOg4';
const GITHUB_CLIENT_SECRET = '92312095f05395118cdb1983e7d0d23e3b4346a0';

// For development, we'll use a simple proxy approach
// In production, this should be handled by your backend server
export const exchangeCodeForToken = async (code: string): Promise<any> => {
  // Note: In a real application, this should be handled by your backend server
  // to keep the client secret secure. This is a simplified version for development.
  
  try {
    // For now, we'll simulate the token exchange
    // In production, this would be a call to your backend API
    const response = await fetch('https://api.github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// Alternative approach using a public OAuth proxy (for development only)
export const exchangeCodeForTokenViaProxy = async (code: string): Promise<any> => {
  try {
    // Using a public OAuth proxy for development
    // In production, use your own backend server
    const response = await fetch(`https://cors-anywhere.herokuapp.com/https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data;
  } catch (error) {
    console.error('Error exchanging code for token via proxy:', error);
    throw error;
  }
};

// Development fallback - simulate successful authentication
export const simulateGitHubAuth = async (): Promise<any> => {
  // This is for development/testing purposes only
  // In production, remove this and use proper OAuth flow
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        access_token: 'simulated_token_for_development',
        token_type: 'bearer',
        scope: 'repo,user',
      });
    }, 1000);
  });
}; 