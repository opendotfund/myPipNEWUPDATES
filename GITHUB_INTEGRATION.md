# GitHub Integration for myPip

This document explains how the GitHub integration works in myPip and how to set it up for production use.

## Features

The GitHub integration allows users to:

1. **Connect their GitHub account** using OAuth authentication
2. **Create new repositories** directly from myPip
3. **Push generated code** to existing or new repositories
4. **Manage repository settings** (public/private, description, etc.)

## Current Implementation

### Development Mode
- Uses simulated authentication for testing
- Bypasses actual OAuth flow for easier development
- All GitHub API calls are simulated

### Production Mode
- Full OAuth 2.0 flow with GitHub
- Secure token exchange via backend server
- Real GitHub API integration

## Setup Instructions

### 1. GitHub OAuth App Configuration

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: myPip
   - **Homepage URL**: `https://www.mypip.dev`
   - **Authorization callback URL**: `https://www.mypip.dev/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables

Create a `.env` file in your project root:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=https://www.mypip.dev/auth/github/callback
```

### 3. Backend Server Setup (Required for Production)

You'll need a backend server to handle the OAuth token exchange securely. Here's a simple Express.js example:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/api/github/callback', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

### 4. Update GitHub Service

Update `services/githubService.ts` to use your backend server:

```typescript
// Replace the simulateGitHubAuth call with:
const response = await fetch('/api/github/callback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ code, state }),
});
```

## Usage

### For Users

1. **Click the GitHub button** in the app preview section
2. **Sign in with GitHub** (or connect if already signed in)
3. **Select an existing repository** or create a new one
4. **Configure file settings** (filename, commit message)
5. **Push code to GitHub**

### For Developers

The integration includes:

- **OAuth Authentication**: Secure GitHub account connection
- **Repository Management**: Create and select repositories
- **Code Pushing**: Push generated code with proper Git commits
- **Error Handling**: Comprehensive error messages and fallbacks
- **Loading States**: Visual feedback during operations

## Security Considerations

1. **Never expose client secrets** in frontend code
2. **Use HTTPS** for all OAuth callbacks
3. **Validate OAuth state** to prevent CSRF attacks
4. **Store tokens securely** (use httpOnly cookies in production)
5. **Implement proper error handling** for failed authentications

## API Endpoints Used

- `GET /user` - Get authenticated user info
- `GET /user/repos` - List user repositories
- `POST /user/repos` - Create new repository
- `GET /repos/{owner}/{repo}` - Get repository info
- `GET /repos/{owner}/{repo}/branches/{branch}` - Get branch info
- `POST /repos/{owner}/{repo}/git/trees` - Create tree
- `POST /repos/{owner}/{repo}/git/commits` - Create commit
- `PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}` - Update branch

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend server handles CORS properly
2. **Invalid State**: Check that OAuth state validation is working
3. **Token Expiry**: Implement token refresh logic for long-lived sessions
4. **Rate Limiting**: Handle GitHub API rate limits gracefully

### Development vs Production

- **Development**: Uses simulated authentication for easier testing
- **Production**: Requires proper backend server and OAuth flow

## Future Enhancements

- [ ] Repository templates
- [ ] Branch management
- [ ] Pull request creation
- [ ] Issue creation
- [ ] GitHub Actions integration
- [ ] Repository analytics 