# 🚀 Deploy to Railway in 5 Minutes

This is the easiest way to deploy your myPip backend server!

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

## Step 2: Create New Project
1. Click "Deploy from GitHub repo"
2. Select your myPip repository
3. Railway will detect it's a Node.js project

## Step 3: Configure Environment Variables
1. Go to your project dashboard
2. Click "Variables" tab
3. Add these environment variables:

```env
GITHUB_CLIENT_ID=Ov23liiDXv1qIPEGgOg4
GITHUB_CLIENT_SECRET=92312095f05395118cdb1983e7d0d23e3b4346a0
GITHUB_REDIRECT_URI=https://www.mypip.dev/auth/github/callback
NODE_ENV=production
PRODUCTION_DOMAIN=https://www.mypip.dev
ALLOWED_ORIGINS=https://www.mypip.dev,https://mypip.dev
SESSION_SECRET=your-super-secret-session-key-change-this
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Step 4: Configure Build Settings
1. Go to "Settings" tab
2. Set "Root Directory" to: `server`
3. Set "Build Command" to: `npm install`
4. Set "Start Command" to: `node server.js`

## Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy Now" to deploy immediately
3. Wait 2-3 minutes for deployment

## Step 6: Get Your Backend URL
1. Go to "Deployments" tab
2. Copy the generated URL (e.g., `https://your-app-name.railway.app`)
3. Your API will be available at: `https://your-app-name.railway.app/api`

## Step 7: Update Frontend
Update your `services/githubService.ts` file:

```typescript
const BACKEND_API_BASE = 'https://your-app-name.railway.app/api';
```

Replace `your-app-name` with your actual Railway app name.

## Step 8: Test
1. Visit your frontend app
2. Try the GitHub integration
3. Check the health endpoint: `https://your-app-name.railway.app/health`

## 🎉 Done!

Your backend is now live and ready to handle GitHub OAuth!

## Troubleshooting

**If deployment fails:**
1. Check the build logs in Railway dashboard
2. Make sure all environment variables are set
3. Verify the root directory is set to `server`

**If GitHub OAuth doesn't work:**
1. Update your GitHub OAuth app callback URL to: `https://your-app-name.railway.app/api/github/callback`
2. Make sure the frontend is using the correct backend URL

**Need help?**
- Check Railway logs in the dashboard
- Railway has great documentation and support 