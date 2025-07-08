# Environment Variables Setup

Create a `.env` file in your project root with the following variables:

## Supabase Configuration
```env
VITE_SUPABASE_URL=https://lrkimhssimcmzvhliqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Lemon Squeezy Configuration
```env
VITE_LEMON_SQUEEZY_API_KEY=your_lemonsqueezy_api_key_here
LEMON_SQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret_here
```

## Clerk Configuration
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## GitHub OAuth Configuration
```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_REDIRECT_URI=https://your-domain.com/api/github/callback
```

## AI Service API Keys
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

## Server Configuration
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
TRUST_PROXY=true
```

## CORS Configuration
```env
ALLOWED_ORIGINS=https://www.mypip.dev,https://mypip.dev
```

## Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Production Domain
```env
PRODUCTION_DOMAIN=https://www.mypip.dev
```

## Contact Email
```env
VITE_CONTACT_EMAIL=contact@mypip.dev
```

# Lemon Squeezy Setup Instructions

## 1. Create Lemon Squeezy Account
1. Go to [lemonsqueezy.com](https://lemonsqueezy.com) and create an account
2. Set up your store

## 2. Create Products
Create the following products in Lemon Squeezy:

### Basic Plan ($19.99/month)
- Product Name: "myPip Basic"
- Price: $19.99/month
- Product ID: Note this for mapping

### Pro Plan ($33.99/month)
- Product Name: "myPip Pro"
- Price: $33.99/month
- Product ID: Note this for mapping

### Pro Plus Plan ($39.99/month)
- Product Name: "myPip Pro Plus"
- Price: $39.99/month
- Product ID: Note this for mapping

### Enterprise Plan ($199.99/month)
- Product Name: "myPip Enterprise"
- Price: $199.99/month
- Product ID: Note this for mapping

## 3. Configure Webhooks
1. Go to your Lemon Squeezy dashboard
2. Navigate to Settings > Webhooks
3. Add a new webhook with URL: `https://your-domain.com/api/webhooks/lemon-squeezy`
4. Select these events:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `order_created`
5. Copy the webhook secret and add it to your environment variables

## 4. Update Product Mapping
Update the `PRODUCT_TO_TIER_MAPPING` in `server/webhooks/lemonSqueezy.js` with your actual product IDs:

```javascript
const PRODUCT_TO_TIER_MAPPING = {
  YOUR_BASIC_PRODUCT_ID: 1,    // Basic tier
  YOUR_PRO_PRODUCT_ID: 2,      // Pro tier
  YOUR_PRO_PLUS_PRODUCT_ID: 3, // Pro Plus tier
  YOUR_ENTERPRISE_PRODUCT_ID: 4, // Enterprise tier
};
```

## 5. Update Checkout URLs
Update the checkout URLs in `services/lemonSqueezyService.ts` with your actual Lemon Squeezy checkout URLs:

```typescript
const tierMapping: { [key: number]: string } = {
  1: 'https://your-store.lemonsqueezy.com/buy/YOUR_BASIC_CHECKOUT_ID',
  2: 'https://your-store.lemonsqueezy.com/buy/YOUR_PRO_CHECKOUT_ID',
  3: 'https://your-store.lemonsqueezy.com/buy/YOUR_PRO_PLUS_CHECKOUT_ID',
  4: 'https://your-store.lemonsqueezy.com/buy/YOUR_ENTERPRISE_CHECKOUT_ID',
};
```

## 6. Test the Integration
1. Start your development server
2. Sign in with a test user
3. Click the "Subscription" button in the header
4. Try upgrading to a plan
5. Verify webhooks are working by checking your server logs 