import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrkimhssimcmzvhliqbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA'

// Create a basic Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cache for authenticated clients to avoid multiple instances
const authenticatedClients = new Map<string, any>()

// Create an authenticated Supabase client using a provided JWT token
export function createAuthenticatedSupabaseClient(token: string) {
  if (!token) {
    console.warn('No token provided, using unauthenticated client')
    return supabase
  }

  // Check if we already have a client for this token
  if (authenticatedClients.has(token)) {
    return authenticatedClients.get(token)
  }

  // Create a new Supabase client with the JWT token
  const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })

  // Cache the client
  authenticatedClients.set(token, authenticatedClient)
  console.log('Created authenticated Supabase client')
  return authenticatedClient
}

// Test connection
console.log('Supabase client created with URL:', supabaseUrl) 