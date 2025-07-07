import { waitlistService } from './databaseService';

interface EmailReportData {
  totalSignups: number;
  todaySignups: number;
  thisWeekSignups: number;
  recentEmails: string[];
  date: string;
}

// Configuration
const ADMIN_EMAIL = 'm3stastn@uwaterloo.ca';
const LOCAL_SERVER_URL = 'http://localhost:3001'; // Local server for email testing

export const emailService = {
  // Send daily waitlist report
  async sendDailyWaitlistReport(adminEmail: string = ADMIN_EMAIL): Promise<boolean> {
    try {
      // Get waitlist statistics
      const stats = await waitlistService.getWaitlistStats();
      
      // Get recent waitlist entries (last 24 hours)
      const allEntries = await waitlistService.getAllWaitlistEntries();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentEmails = allEntries
        .filter(entry => new Date(entry.created_at) > oneDayAgo)
        .map(entry => entry.email)
        .slice(0, 10); // Limit to 10 most recent

      const reportData: EmailReportData = {
        totalSignups: stats.total,
        todaySignups: stats.today,
        thisWeekSignups: stats.thisWeek,
        recentEmails,
        date: new Date().toLocaleDateString()
      };

      // Send via local server for testing
      await this.sendEmailViaLocalServer(adminEmail, reportData);
      
      return true;
    } catch (error) {
      console.error('Error sending daily waitlist report:', error);
      return false;
    }
  },

  // Send email via local server (for testing)
  async sendEmailViaLocalServer(adminEmail: string, reportData: EmailReportData): Promise<void> {
    const emailContent = this.generateEmailContent(reportData);
    const plainTextContent = this.generatePlainTextContent(reportData);
    
    try {
      // Send to local server for testing
      const response = await fetch(`${LOCAL_SERVER_URL}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: 'Daily myPip V2 Waitlist Report',
          html: emailContent,
          text: plainTextContent,
          reportData
        })
      });

      if (response.ok) {
        console.log('✅ Email sent successfully via local server');
      } else {
        console.error('❌ Failed to send email via local server:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error sending email via local server:', error);
      // Fallback to console logging
      this.logEmailToConsole(adminEmail, reportData);
    }
  },

  // Fallback: Log email to console
  logEmailToConsole(adminEmail: string, reportData: EmailReportData): void {
    console.log('=== DAILY WAITLIST REPORT ===');
    console.log(`To: ${adminEmail}`);
    console.log('Subject: Daily myPip V2 Waitlist Report');
    console.log('Content:', this.generatePlainTextContent(reportData));
    console.log('=============================');
  },

  // Generate HTML email content
  generateEmailContent(reportData: EmailReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Daily myPip V2 Waitlist Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
          .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
          .stat-label { font-size: 14px; color: #6c757d; margin-top: 5px; }
          .recent-emails { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .email-list { list-style: none; padding: 0; }
          .email-list li { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .email-list li:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily myPip V2 Waitlist Report</h1>
            <p>${reportData.date}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${reportData.totalSignups}</div>
              <div class="stat-label">Total Signups</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.todaySignups}</div>
              <div class="stat-label">Today</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${reportData.thisWeekSignups}</div>
              <div class="stat-label">This Week</div>
            </div>
          </div>
          
          <div class="recent-emails">
            <h3>📧 Recent Signups (Last 24 Hours)</h3>
            ${reportData.recentEmails.length > 0 ? `
              <ul class="email-list">
                ${reportData.recentEmails.map(email => `<li>${email}</li>`).join('')}
              </ul>
            ` : '<p>No new signups in the last 24 hours.</p>'}
          </div>
          
          <div class="footer">
            <p>This report is automatically generated daily. You can manage the waitlist through the admin panel.</p>
            <p>© 2024 myPip. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Generate plain text email content (fallback)
  generatePlainTextContent(reportData: EmailReportData): string {
    return `
Daily myPip V2 Waitlist Report - ${reportData.date}

📊 STATISTICS:
- Total Signups: ${reportData.totalSignups}
- Today: ${reportData.todaySignups}
- This Week: ${reportData.thisWeekSignups}

📧 Recent Signups (Last 24 Hours):
${reportData.recentEmails.length > 0 
  ? reportData.recentEmails.map(email => `- ${email}`).join('\n')
  : 'No new signups in the last 24 hours.'
}

---
This report is automatically generated daily.
© 2024 myPip. All rights reserved.
    `.trim();
  }
};

// Function to set up daily email reports (call this from your server)
export const setupDailyEmailReports = (adminEmail: string = ADMIN_EMAIL) => {
  // This would typically be set up as a cron job or scheduled task
  // For now, we'll just provide the function that can be called
  
  const sendDailyReport = async () => {
    console.log('Sending daily waitlist report...');
    const success = await emailService.sendDailyWaitlistReport(adminEmail);
    if (success) {
      console.log('Daily report sent successfully');
    } else {
      console.error('Failed to send daily report');
    }
  };

  // Example: Send report every 24 hours
  // setInterval(sendDailyReport, 24 * 60 * 60 * 1000);
  
  return sendDailyReport;
}; 