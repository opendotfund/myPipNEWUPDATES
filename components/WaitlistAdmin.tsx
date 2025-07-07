import React, { useState, useEffect } from 'react';
import { waitlistService } from '../services/databaseService';
import { emailService } from '../services/emailService';
import { Waitlist } from '../types/database';
import { LoadingSpinner } from './LoadingSpinner';

interface WaitlistAdminProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const WaitlistAdmin: React.FC<WaitlistAdminProps> = ({
  isOpen,
  onClose,
  isDarkMode = false
}) => {
  const [waitlistEntries, setWaitlistEntries] = useState<Waitlist[]>([]);
  const [stats, setStats] = useState<{ total: number; today: number; thisWeek: number }>({ total: 0, today: 0, thisWeek: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWaitlistData();
    }
  }, [isOpen]);

  const loadWaitlistData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [entries, waitlistStats] = await Promise.all([
        waitlistService.getAllWaitlistEntries(),
        waitlistService.getWaitlistStats()
      ]);
      
      setWaitlistEntries(entries);
      setStats(waitlistStats);
    } catch (err) {
      console.error('Error loading waitlist data:', err);
      setError('Failed to load waitlist data. You may not have admin permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Source', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...waitlistEntries.map(entry => [
        entry.email,
        entry.source,
        entry.status,
        new Date(entry.created_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyEmailsToClipboard = () => {
    const emails = waitlistEntries.map(entry => entry.email).join('\n');
    navigator.clipboard.writeText(emails).then(() => {
      setSuccessMessage('Emails copied to clipboard!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }).catch(() => {
      setError('Failed to copy emails to clipboard');
      setTimeout(() => setError(null), 3000);
    });
  };

  const sendDailyReport = async () => {
    setIsSendingReport(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Updated admin email
      const adminEmail = 'm3stastn@uwaterloo.ca';
      const success = await emailService.sendDailyWaitlistReport(adminEmail);
      
      if (success) {
        setSuccessMessage('Daily report sent successfully! Check your email at m3stastn@uwaterloo.ca');
      } else {
        setError('Failed to send daily report. Check console for details.');
      }
    } catch (err) {
      console.error('Error sending daily report:', err);
      setError('Failed to send daily report. Check console for details.');
    } finally {
      setIsSendingReport(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-2xl border overflow-hidden`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Waitlist Admin
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
              Manage V2 waitlist entries
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="grid grid-cols-3 gap-4">
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.total}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Signups
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {stats.today}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Today
              </div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {stats.thisWeek}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                This Week
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {(error || successMessage) && (
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            {error && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-100 border-red-300 text-red-800'} border`}>
                {error}
              </div>
            )}
            {successMessage && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-100 border-green-300 text-green-800'} border`}>
                {successMessage}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportToCSV}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors`}
            >
              Export to CSV
            </button>
            <button
              onClick={copyEmailsToClipboard}
              className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors`}
            >
              Copy Emails
            </button>
            <button
              onClick={sendDailyReport}
              disabled={isSendingReport}
              className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSendingReport ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Daily Report'
              )}
            </button>
            <button
              onClick={loadWaitlistData}
              className={`px-4 py-2 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white font-medium rounded-lg transition-colors`}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {waitlistEntries.length} entries found
              </div>
              
              <div className="overflow-x-auto">
                <table className={`w-full ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <thead>
                    <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-4 font-medium">Email</th>
                      <th className="text-left py-3 px-4 font-medium">Source</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistEntries.map((entry) => (
                      <tr key={entry.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className="py-3 px-4">{entry.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.source === 'v2_popup' 
                              ? isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            entry.status === 'pending'
                              ? isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                              : isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {waitlistEntries.length === 0 && (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No waitlist entries found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 