// src/lib/supabase-server.ts - Server-side Supabase Client
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// Singleton pattern for server-side client
let serverClientInstance: ReturnType<typeof createRouteHandlerClient<Database>> | null = null

// Server-side Supabase client (singleton)
export const createServerClient = () => {
  if (!serverClientInstance) {
    serverClientInstance = createRouteHandlerClient<Database>({ cookies })
  }
  return serverClientInstance
}

// Helper function to get authenticated user in API routes
export const getAuthenticatedUser = async () => {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, error: error || new Error('No authenticated user') }
  }
  
  return { user, error: null }
}
