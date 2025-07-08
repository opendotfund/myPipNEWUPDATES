// Test JWT Token Structure
// Run this in the browser console to debug JWT token issues

// Function to decode JWT token (without verification)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Test function to check JWT token
async function testJWTToken() {
  try {
    // Get the JWT token from Clerk
    const token = await window.Clerk.session?.getToken();
    
    if (!token) {
      console.error('No JWT token available');
      return;
    }
    
    console.log('JWT Token received:', !!token);
    console.log('Token length:', token.length);
    
    // Decode the token
    const decoded = decodeJWT(token);
    if (decoded) {
      console.log('Decoded JWT payload:', decoded);
      console.log('Subject (sub):', decoded.sub);
      console.log('Issuer (iss):', decoded.iss);
      console.log('Audience (aud):', decoded.aud);
      console.log('Expiration (exp):', new Date(decoded.exp * 1000));
      console.log('Issued at (iat):', new Date(decoded.iat * 1000));
      
      // Check if the token has the expected structure for Supabase
      if (decoded.sub) {
        console.log('✅ Token has subject (sub) field - this should work with Supabase');
      } else {
        console.log('❌ Token missing subject (sub) field');
      }
      
      if (decoded.iss && decoded.iss.includes('clerk')) {
        console.log('✅ Token issued by Clerk');
      } else {
        console.log('❌ Token not issued by Clerk');
      }
    }
    
    // Test Supabase authentication
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    
    const supabaseUrl = 'https://lrkimhssimcmzvhliqbp.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Test a simple query
    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, email')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query failed:', error);
    } else {
      console.log('✅ Supabase query successful:', data);
    }
    
  } catch (error) {
    console.error('Error testing JWT token:', error);
  }
}

// Run the test
console.log('Testing JWT token...');
testJWTToken(); 