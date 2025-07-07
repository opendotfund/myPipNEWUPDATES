# myPip V2 Waitlist System Setup

This document explains how to set up and use the waitlist system for myPip V2.

## Overview

The waitlist system allows users to sign up for early access to myPip V2 and stores their email addresses in your Supabase database. It also includes an admin panel for managing waitlist entries and sending daily email reports.

## Features

- ✅ User signup through V2 popup
- ✅ Email storage in Supabase database
- ✅ Duplicate email prevention
- ✅ Admin panel for managing entries
- ✅ CSV export functionality
- ✅ Daily email reports
- ✅ Statistics dashboard

## Database Setup

1. **Run the updated schema**: The `database-schema.sql` file now includes a `waitlist` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'v2_popup',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Row Level Security (RLS)**: The table has RLS policies that allow:
   - Anyone to join the waitlist
   - Only admin users to view and update waitlist entries

## Configuration

### Admin Email Setup

Update the admin email addresses in the following files:

1. **Database Schema** (`database-schema.sql`):
   ```sql
   -- Update these email addresses to your actual admin emails
   SELECT clerk_id FROM users WHERE email IN ('admin@mypip.com', 'your-admin-email@example.com')
   ```

2. **App.tsx** (around line 1930):
   ```typescript
   {(user?.primaryEmailAddress?.emailAddress === 'admin@mypip.com' || 
     user?.primaryEmailAddress?.emailAddress === 'your-admin-email@example.com') && (
     // Admin button
   )}
   ```

3. **WaitlistAdmin.tsx** (around line 80):
   ```typescript
   const adminEmail = 'admin@mypip.com'; // Replace with your admin email
   ```

### Email Service Setup

The email service currently logs email content to the console. To send actual emails, you'll need to integrate with an email service provider.

**Recommended Email Services:**
- SendGrid
- Mailgun
- AWS SES
- Resend

**Example SendGrid Integration:**

1. Install SendGrid:
   ```bash
   npm install @sendgrid/mail
   ```

2. Update `services/emailService.ts`:
   ```typescript
   import sgMail from '@sendgrid/mail';
   
   // Initialize SendGrid
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   // Replace the sendEmailViaAPI function
   async sendEmailViaAPI(adminEmail: string, reportData: EmailReportData): Promise<void> {
     const msg = {
       to: adminEmail,
       from: 'noreply@mypip.com', // Verified sender
       subject: 'Daily myPip V2 Waitlist Report',
       html: this.generateEmailContent(reportData),
       text: this.generatePlainTextContent(reportData),
     };
     
     await sgMail.send(msg);
   }
   ```

## Usage

### For Users

1. Users will see the V2 waitlist popup when they first visit the site
2. They can enter their email address to join the waitlist
3. The system prevents duplicate email signups
4. Users receive a success message confirming their signup

### For Admins

1. **Access Admin Panel**: Log in with an admin email address and click the "Admin" button in the header
2. **View Statistics**: See total signups, today's signups, and this week's signups
3. **Export Data**: 
   - Click "Export to CSV" to download all waitlist entries
   - Click "Copy Emails" to copy all email addresses to clipboard
4. **Send Reports**: Click "Send Daily Report" to manually send an email report
5. **Refresh Data**: Click "Refresh" to reload the latest data

### Daily Email Reports

The system can send daily email reports with:
- Total signup statistics
- Recent signups (last 24 hours)
- Beautiful HTML formatting

**To set up automatic daily reports:**

1. **Server-side setup** (recommended):
   ```javascript
   // In your server.js or similar
   import { setupDailyEmailReports } from './services/emailService';
   
   const sendDailyReport = setupDailyEmailReports('admin@mypip.com');
   
   // Set up cron job or scheduled task
   setInterval(sendDailyReport, 24 * 60 * 60 * 1000); // Every 24 hours
   ```

2. **Using a cron job service** (like Vercel Cron, Railway Cron, etc.):
   ```javascript
   // Create an API endpoint for the cron job
   export default async function handler(req, res) {
     if (req.method === 'POST') {
       const sendDailyReport = setupDailyEmailReports('admin@mypip.com');
       await sendDailyReport();
       res.status(200).json({ success: true });
     }
   }
   ```

## Security Considerations

1. **RLS Policies**: The database has Row Level Security enabled to protect waitlist data
2. **Admin Access**: Only users with specific admin email addresses can access the admin panel
3. **Email Validation**: The system validates email addresses before storing them
4. **Rate Limiting**: Consider implementing rate limiting for waitlist signups

## Troubleshooting

### Common Issues

1. **Admin button not showing**:
   - Check that your email is in the admin email list
   - Ensure you're signed in with the correct email

2. **Can't access waitlist data**:
   - Verify RLS policies are correctly set up
   - Check that your user exists in the users table

3. **Email reports not sending**:
   - Check console for error messages
   - Verify email service integration
   - Ensure admin email is correctly configured

### Database Queries

**View all waitlist entries:**
```sql
SELECT * FROM waitlist ORDER BY created_at DESC;
```

**Get waitlist statistics:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week
FROM waitlist;
```

**Check for duplicate emails:**
```sql
SELECT email, COUNT(*) 
FROM waitlist 
GROUP BY email 
HAVING COUNT(*) > 1;
```

## Future Enhancements

- [ ] Email verification for waitlist signups
- [ ] Waitlist status management (pending, approved, rejected)
- [ ] Bulk email campaigns to waitlist members
- [ ] Waitlist analytics and insights
- [ ] Integration with marketing tools
- [ ] A/B testing for waitlist messaging

## Support

If you encounter any issues with the waitlist system, check the browser console for error messages and refer to the troubleshooting section above. 