#!/usr/bin/env node

/**
 * Simple script to update the backend URL in the GitHub service
 * Usage: node update-backend-url.js <your-backend-url>
 * Example: node update-backend-url.js https://mypip-backend.railway.app
 */

const fs = require('fs');
const path = require('path');

const backendUrl = process.argv[2];

if (!backendUrl) {
  console.log('❌ Please provide your backend URL');
  console.log('Usage: node update-backend-url.js <your-backend-url>');
  console.log('Example: node update-backend-url.js https://mypip-backend.railway.app');
  process.exit(1);
}

// Remove trailing slash if present
const cleanBackendUrl = backendUrl.replace(/\/$/, '');
const apiUrl = `${cleanBackendUrl}/api`;

const githubServicePath = path.join(__dirname, 'services', 'githubService.ts');

try {
  // Read the current file
  let content = fs.readFileSync(githubServicePath, 'utf8');
  
  // Update the backend URL
  const updatedContent = content.replace(
    /const BACKEND_API_BASE = '.*?';/,
    `const BACKEND_API_BASE = '${apiUrl}';`
  );
  
  // Write the updated content back
  fs.writeFileSync(githubServicePath, updatedContent);
  
  console.log('✅ Successfully updated backend URL!');
  console.log(`📍 New API base URL: ${apiUrl}`);
  console.log('🔄 Restart your development server to see changes');
  
} catch (error) {
  console.error('❌ Error updating backend URL:', error.message);
  process.exit(1);
} 