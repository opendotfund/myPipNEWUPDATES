# 🚀 Deploy to Render in 10 Minutes

Render is another great option for deploying your myPip backend server!

## Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub (recommended)

## Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your myPip repository

## Step 3: Configure Service Settings
1. **Name**: `mypip-backend` (or any name you like)
2. **Root Directory**: `server`
3. **Runtime**: `Node`
4. **Build Command**: `npm install`
5. **Start Command**: `node server.js`
6. **Plan**: Free (or choose paid for more resources)

## Step 4: Add Environment Variables
Click "Environment" and add these variables:

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

## Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically deploy your app
3. Wait 3-5 minutes for the first deployment

## Step 6: Get Your Backend URL
1. Once deployed, you'll get a URL like: `https://your-app-name.onrender.com`
2. Your API will be available at: `https://your-app-name.onrender.com/api`

## Step 7: Update Frontend
Update your `services/githubService.ts` file:

```typescript
const BACKEND_API_BASE = 'https://your-app-name.onrender.com/api';
```

Replace `your-app-name` with your actual Render app name.

## Step 8: Test
1. Visit your frontend app
2. Try the GitHub integration
3. Check the health endpoint: `https://your-app-name.onrender.com/health`

## 🎉 Done!

Your backend is now live on Render!

## Render vs Railway

**Render Pros:**
- Free tier available
- Automatic HTTPS
- Good documentation
- Reliable service

**Railway Pros:**
- Faster deployments
- Better free tier limits
- More intuitive interface

## Troubleshooting

**If deployment fails:**
1. Check the build logs in Render dashboard
2. Make sure all environment variables are set
3. Verify the root directory is set to `server`

**If GitHub OAuth doesn't work:**
1. Update your GitHub OAuth app callback URL to: `https://your-app-name.onrender.com/api/github/callback`
2. Make sure the frontend is using the correct backend URL

**Free tier limitations:**
- Render free tier has cold starts (first request might be slow)
- Railway free tier is generally faster 