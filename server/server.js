// Railway deployment trigger - GitHub OAuth endpoints included
// DEBUG: This should be the latest server with GitHub endpoints
// FORCE DEPLOYMENT: Adding timestamp to ensure latest code is deployed
console.log('🚀 Server starting with GitHub OAuth endpoints...');
console.log('📁 Current directory:', __dirname);
console.log('📄 Server file loaded successfully');
console.log('🕐 Deployment timestamp:', new Date().toISOString());
console.log('🔧 GitHub endpoints should be available at:');
console.log('   - POST /api/github/callback');
console.log('   - GET /api/github/user');
console.log('   - GET /api/github/repos');
console.log('   - POST /api/github/repos');
console.log('   - POST /api/github/push');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy for production (if behind nginx/reverse proxy)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "https://js.stripe.com", "https://esm.sh"],
      imgSrc: ["'self'", "data:", "https:", "https://i.postimg.cc"],
      connectSrc: ["'self'", "https://api.github.com", "https://www.mypip.dev"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
}));

app.use(compression());

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://www.mypip.dev', 'https://mypip.dev'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware for production
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${ip} - ${userAgent}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    domain: process.env.PRODUCTION_DOMAIN || 'https://www.mypip.dev',
  });
});

// Test endpoint to verify GitHub endpoints are available
app.get('/api/test', (req, res) => {
  res.status(200).json({
    message: 'GitHub OAuth server is working!',
    endpoints: {
      github_callback: '/api/github/callback',
      github_user: '/api/github/user',
      github_repos: '/api/github/repos',
      github_push: '/api/github/push'
    },
    timestamp: new Date().toISOString()
  });
});

// GitHub OAuth callback endpoint
app.post('/api/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    // Validate required parameters
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required',
        code: 'MISSING_CODE'
      });
    }

    if (!state) {
      return res.status(400).json({
        error: 'State parameter is required for security',
        code: 'MISSING_STATE'
      });
    }

    console.log(`Processing GitHub OAuth callback for code: ${code.substring(0, 10)}...`);

    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000, // 10 second timeout
    });

    const tokenData = tokenResponse.data;

    // Check for GitHub API errors
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error,
        code: 'GITHUB_OAUTH_ERROR',
        details: tokenData
      });
    }

    if (!tokenData.access_token) {
      console.error('No access token received from GitHub');
      return res.status(500).json({
        error: 'Failed to obtain access token from GitHub',
        code: 'NO_ACCESS_TOKEN'
      });
    }

    // Get user information to validate the token
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    const userData = userResponse.data;

    console.log(`Successfully authenticated GitHub user: ${userData.login} (ID: ${userData.id})`);

    // Return the token and user data
    res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer',
      scope: tokenData.scope,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
      },
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);

    if (error.response) {
      // GitHub API error
      console.error('GitHub API error response:', error.response.data);
      return res.status(error.response.status).json({
        error: 'GitHub API error',
        code: 'GITHUB_API_ERROR',
        details: error.response.data,
      });
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      return res.status(503).json({
        error: 'Unable to reach GitHub servers',
        code: 'NETWORK_ERROR',
      });
    } else {
      // Other error
      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error.message,
      });
    }
  }
});

// GitHub API proxy endpoints
app.get('/api/github/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).json({
        error: 'Authorization header with GitHub token required',
        code: 'MISSING_AUTH'
      });
    }

    const token = authHeader.replace('token ', '');
    
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('GitHub user API error:', error);
    handleGitHubApiError(error, res);
  }
});

app.get('/api/github/repos', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).json({
        error: 'Authorization header with GitHub token required',
        code: 'MISSING_AUTH'
      });
    }

    const token = authHeader.replace('token ', '');
    const { sort = 'updated', per_page = 100, page = 1 } = req.query;
    
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      params: {
        sort,
        per_page,
        page,
      },
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('GitHub repos API error:', error);
    handleGitHubApiError(error, res);
  }
});

// GitHub repository creation endpoint
app.post('/api/github/repos', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).json({
        error: 'Authorization header with GitHub token required',
        code: 'MISSING_AUTH'
      });
    }

    const token = authHeader.replace('token ', '');
    const { name, description, private: isPrivate, auto_init = true } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Repository name is required',
        code: 'MISSING_REPO_NAME'
      });
    }

    const response = await axios.post('https://api.github.com/user/repos', {
      name,
      description,
      private: isPrivate,
      auto_init,
    }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error('GitHub create repo API error:', error);
    handleGitHubApiError(error, res);
  }
});

// GitHub code push endpoint
app.post('/api/github/push', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('token ')) {
      return res.status(401).json({
        error: 'Authorization header with GitHub token required',
        code: 'MISSING_AUTH'
      });
    }

    const token = authHeader.replace('token ', '');
    const { repositoryName, code, fileName, commitMessage } = req.body;

    if (!repositoryName || !code || !fileName || !commitMessage) {
      return res.status(400).json({
        error: 'Repository name, code, file name, and commit message are required',
        code: 'MISSING_PARAMETERS'
      });
    }

    // Get repository info
    const repoResponse = await axios.get(`https://api.github.com/repos/${repositoryName}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    const repo = repoResponse.data;
    const defaultBranch = repo.default_branch;

    // Get the latest commit SHA
    const branchResponse = await axios.get(`https://api.github.com/repos/${repositoryName}/branches/${defaultBranch}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    const branch = branchResponse.data;
    const baseTreeSha = branch.commit.sha;

    // Create a new tree with the file
    const treeResponse = await axios.post(`https://api.github.com/repos/${repositoryName}/git/trees`, {
      base_tree: baseTreeSha,
      tree: [
        {
          path: fileName,
          mode: '100644',
          type: 'blob',
          content: code,
        },
      ],
    }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    const tree = treeResponse.data;

    // Create a new commit
    const commitResponse = await axios.post(`https://api.github.com/repos/${repositoryName}/git/commits`, {
      message: commitMessage,
      tree: tree.sha,
      parents: [baseTreeSha],
    }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    const commit = commitResponse.data;

    // Update the branch reference
    await axios.patch(`https://api.github.com/repos/${repositoryName}/git/refs/heads/${defaultBranch}`, {
      sha: commit.sha,
    }, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'myPip-OAuth-Server/1.0.0',
      },
      timeout: 10000,
    });

    res.json({
      success: true,
      message: 'Code pushed successfully',
      commit: {
        sha: commit.sha,
        message: commit.message,
        url: commit.url,
      },
      file: {
        name: fileName,
        url: `https://github.com/${repositoryName}/blob/${defaultBranch}/${fileName}`,
      },
    });

  } catch (error) {
    console.error('GitHub push API error:', error);
    handleGitHubApiError(error, res);
  }
});

// Helper function to handle GitHub API errors
function handleGitHubApiError(error, res) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      return res.status(401).json({
        error: 'Invalid or expired GitHub token',
        code: 'INVALID_TOKEN'
      });
    } else if (status === 403) {
      return res.status(403).json({
        error: 'Rate limit exceeded or insufficient permissions',
        code: 'RATE_LIMIT_OR_PERMISSION_DENIED'
      });
    } else {
      return res.status(status).json({
        error: 'GitHub API error',
        code: 'GITHUB_API_ERROR',
        details: data
      });
    }
  } else if (error.request) {
    return res.status(503).json({
      error: 'Unable to reach GitHub servers',
      code: 'NETWORK_ERROR'
    });
  } else {
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error.message
    });
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 myPip Backend Server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔐 GitHub OAuth callback: http://${HOST}:${PORT}/api/github/callback`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`🏠 Production domain: ${process.env.PRODUCTION_DOMAIN || 'https://www.mypip.dev'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app; 