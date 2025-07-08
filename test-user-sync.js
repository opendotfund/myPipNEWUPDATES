// Test script to verify user sync functionality
// Run this in the browser console when signed in

console.log('Testing user sync functionality...');

// Check if user is signed in
if (window.Clerk && window.Clerk.user) {
  console.log('User is signed in:', window.Clerk.user);
  
  // Test getting JWT token
  window.Clerk.session.getToken().then(token => {
    console.log('JWT token received:', !!token);
    console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
  }).catch(err => {
    console.error('Error getting JWT token:', err);
  });
  
  // Test database connection
  fetch('/api/test-db-connection', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
  .then(data => {
    console.log('Database connection test:', data);
  })
  .catch(err => {
    console.error('Database connection test failed:', err);
  });
  
} else {
  console.log('No user signed in');
}

// Check for any console errors related to user sync
console.log('Check the console for any user sync errors above'); 