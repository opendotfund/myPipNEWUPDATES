# myPip Referral System Documentation

## Overview

myPip now features a comprehensive in-house referral system that integrates with Lemon Squeezy's affiliate program. This system allows users to become affiliates, generate unique referral codes, track visits and conversions, and earn commissions.

## Features

### 🔗 Unique Referral Codes
- Each user gets a unique referral code (e.g., `MYPIP_A1B2C3_D4E5F6`)
- Codes are automatically generated and stored in the database
- Codes are URL-safe and easy to share

### 📊 Comprehensive Tracking
- **Visit Tracking**: Every visit through a referral link is tracked
- **Conversion Tracking**: Successful purchases are automatically tracked
- **Earnings Tracking**: Commission calculations and payment status
- **Analytics**: Conversion rates, average order values, and performance metrics

### 💰 Commission System
- **10% Commission Rate**: Affiliates earn 10% on all successful referrals
- **Automatic Calculation**: Commissions are calculated automatically
- **Payment Tracking**: Track pending, paid, and cancelled earnings

### 🔐 Authentication Required
- Users must be signed in to become affiliates
- Secure user verification through Clerk authentication
- Protected affiliate data with Row Level Security (RLS)

## Database Schema

### Core Tables

#### `user_affiliates`
Stores affiliate information and status
```sql
- id: UUID (Primary Key)
- user_id: UUID (References users.id)
- email: TEXT
- name: TEXT
- status: TEXT (pending, approved, rejected, active)
- lemon_squeezy_affiliate_id: TEXT
- referral_code: TEXT (Unique)
- total_earnings: DECIMAL(10,2)
- total_referrals: INTEGER
- commission_rate: DECIMAL(5,2) (Default: 10.00)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `user_referral_codes`
Stores unique referral codes for each user
```sql
- id: UUID (Primary Key)
- user_id: UUID (References users.id, Unique)
- referral_code: TEXT (Unique)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `referral_visits`
Tracks every visit through a referral link
```sql
- id: UUID (Primary Key)
- referral_code: TEXT
- visitor_ip: TEXT
- user_agent: TEXT
- referrer: TEXT
- visited_at: TIMESTAMP
- converted: BOOLEAN
- conversion_value: DECIMAL(10,2)
```

#### `referral_conversions`
Tracks successful conversions (purchases)
```sql
- id: UUID (Primary Key)
- referral_code: TEXT
- referrer_user_id: UUID (References users.id)
- converted_user_id: UUID (References users.id)
- lemon_squeezy_order_id: TEXT
- order_value: DECIMAL(10,2)
- commission_amount: DECIMAL(10,2)
- conversion_type: TEXT (subscription, one_time, etc.)
- status: TEXT (pending, paid, cancelled)
- converted_at: TIMESTAMP
- paid_at: TIMESTAMP
```

#### `affiliate_earnings`
Tracks individual earnings for each conversion
```sql
- id: UUID (Primary Key)
- affiliate_user_id: UUID (References users.id)
- conversion_id: UUID (References referral_conversions.id)
- amount: DECIMAL(10,2)
- status: TEXT (pending, paid, cancelled)
- paid_at: TIMESTAMP
- created_at: TIMESTAMP
```

## API Integration

### Lemon Squeezy Webhook Integration

The system automatically handles Lemon Squeezy webhooks to track conversions:

```typescript
// Webhook events handled:
- subscription_created
- subscription_updated
- subscription_cancelled
- order_created
```

### Custom Data Tracking

Referral codes are passed through Lemon Squeezy checkout URLs:
```
https://mypip.lemonsqueezy.com/buy/PRODUCT_ID?aff=REFERRAL_CODE&checkout[custom][referral_code]=REFERRAL_CODE
```

## User Flow

### 1. Becoming an Affiliate

1. **Sign In**: User must be authenticated
2. **Join Program**: Click "Join Affiliate Program" button
3. **Generate Code**: System automatically generates unique referral code
4. **Lemon Squeezy Signup**: Redirected to Lemon Squeezy affiliate application
5. **Approval**: Wait for approval from Lemon Squeezy

### 2. Sharing Referral Links

1. **Get Link**: User receives their unique referral link
2. **Share**: Share link on social media, email, or other channels
3. **Track Visits**: System automatically tracks all visits
4. **Monitor**: View real-time statistics in dashboard

### 3. Earning Commissions

1. **Visitor Signs Up**: Someone uses referral link and creates account
2. **Makes Purchase**: Visitor upgrades to paid plan
3. **Automatic Tracking**: System detects conversion via webhook
4. **Commission Calculated**: 10% commission automatically calculated
5. **Earnings Updated**: Dashboard shows new earnings

## Dashboard Features

### 📈 Statistics Display
- **Total Visits**: Number of people who used your link
- **Conversions**: Number of successful purchases
- **Conversion Rate**: Percentage of visits that converted
- **Total Earnings**: Total commissions earned
- **Average Order Value**: Average value of converted orders

### 📋 Recent Activity
- Recent conversions with order values
- Commission amounts earned
- Payment status tracking

### 🔗 Link Management
- Copy referral link to clipboard
- View link analytics
- Track link performance

## Security Features

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access their own data:

```sql
-- Users can only view their own affiliate data
CREATE POLICY "Users can view their own affiliate data" ON user_affiliates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only view visits to their referral codes
CREATE POLICY "Users can view visits to their referral codes" ON referral_visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_referral_codes 
      WHERE user_referral_codes.referral_code = referral_visits.referral_code
      AND user_referral_codes.user_id::text = auth.jwt() ->> 'user_id'
    )
  );
```

### Authentication Required
- All affiliate operations require user authentication
- Referral codes are tied to specific user accounts
- Secure JWT token validation

## Technical Implementation

### Service Layer

#### `LemonSqueezyService`
Main service handling all referral operations:

```typescript
// Generate unique referral code
async generateUserReferralCode(userId: string): Promise<string>

// Track referral visit
async trackReferralVisit(referralCode: string, visitorData?: {...}): Promise<boolean>

// Track referral conversion
async trackReferralConversion(referralCode: string, convertedUserId: string, orderValue: number): Promise<string>

// Get comprehensive affiliate stats
async getAffiliateStats(userId: string): Promise<AffiliateStats>

// Sign up as affiliate
async signupAffiliate(userId: string, email: string, name: string): Promise<{...}>
```

### Database Functions

#### `generate_referral_code(user_uuid UUID)`
Generates unique referral codes using user ID and timestamp:

```sql
CREATE OR REPLACE FUNCTION generate_referral_code(user_uuid UUID)
RETURNS TEXT AS $$
-- Generates unique referral code like: MYPIP_A1B2C3_D4E5F6
```

#### `track_referral_conversion(...)`
Handles conversion tracking and commission calculation:

```sql
CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_referral_code TEXT,
  p_converted_user_id UUID,
  p_order_value DECIMAL,
  p_lemon_squeezy_order_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
-- Tracks conversion, calculates commission, updates affiliate stats
```

## Setup Instructions

### 1. Database Setup
Run the enhanced database schema:
```bash
# Execute the updated create-user-usage-tables.sql
# This includes all referral system tables and functions
```

### 2. Environment Variables
Ensure these are set in your `.env` file:
```env
VITE_LEMON_SQUEEZY_API_KEY=your_api_key
VITE_LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Lemon Squeezy Configuration
1. Set up webhook endpoints in Lemon Squeezy dashboard
2. Configure webhook URL to point to your server
3. Add custom data fields for referral tracking

### 4. Webhook Handler
Ensure your webhook handler calls:
```typescript
await lemonSqueezyService.handleWebhook(webhookData);
```

## Monitoring and Analytics

### Key Metrics to Track
- **Conversion Rate**: Visits to conversions ratio
- **Average Order Value**: Revenue per conversion
- **Top Performing Affiliates**: Highest earners
- **Geographic Performance**: Where referrals come from
- **Channel Performance**: Which sharing methods work best

### Dashboard Analytics
The referral dashboard provides real-time analytics:
- Visit tracking with timestamps
- Conversion tracking with order details
- Earnings tracking with payment status
- Performance trends over time

## Troubleshooting

### Common Issues

1. **Referral codes not generating**
   - Check database permissions
   - Verify user authentication
   - Check for duplicate codes

2. **Visits not tracking**
   - Verify webhook configuration
   - Check URL parameters
   - Ensure database connectivity

3. **Conversions not recording**
   - Verify Lemon Squeezy webhook setup
   - Check custom data fields
   - Validate webhook signature

### Debug Mode
Enable debug logging in the service:
```typescript
console.log('Processing webhook:', event_name, { userId, email, referralCode });
```

## Future Enhancements

### Planned Features
- **Multi-tier Commission Structure**: Different rates for different products
- **Affiliate Dashboard**: Advanced analytics and reporting
- **Payout System**: Automated commission payments
- **Social Sharing**: Built-in social media sharing tools
- **Referral Contests**: Time-limited promotional campaigns

### Integration Opportunities
- **Email Marketing**: Automated referral emails
- **Social Media**: Direct sharing to platforms
- **Analytics**: Integration with Google Analytics
- **CRM**: Customer relationship management integration

## Support

For technical support or questions about the referral system:
- Check the database logs for errors
- Verify webhook configurations
- Test referral link generation
- Monitor conversion tracking

The referral system is designed to be robust, secure, and scalable for myPip's growth. 