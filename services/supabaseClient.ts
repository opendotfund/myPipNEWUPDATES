import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrkimhssimcmzvhliqbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2ltaHNzaW1jbXp2aGxpcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTE5OTUsImV4cCI6MjA2NjEyNzk5NX0.wYz32qrcB_N8Mqry14RIcA62PTMAKp9Kg1hkRNrnRRA'

// Create a simple Supabase client
export function createClerkSupabaseClient() {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Test connection
  console.log('Supabase client created with URL:', supabaseUrl)
  
  return client
} 