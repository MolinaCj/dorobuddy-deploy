// src/lib/supabase.ts - Centralized Supabase Client Setup
'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Singleton pattern to prevent multiple client instances
let browserClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null
let defaultClientInstance: ReturnType<typeof createClient<Database>> | null = null

// Client-side Supabase client (singleton)
export const createBrowserClient = () => {
  if (!browserClientInstance) {
    browserClientInstance = createClientComponentClient<Database>()
  }
  return browserClientInstance
}

// Default client (singleton for backwards compatibility)
export const supabase = (() => {
  if (!defaultClientInstance) {
    defaultClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return defaultClientInstance
})()

// Helper functions for common operations
export const getCurrentUser = async () => {
  const supabase = createBrowserClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const signOut = async () => {
  const supabase = createBrowserClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, options?: {
  username?: string
  full_name?: string
}) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: options?.username,
        full_name: options?.full_name,
      },
    },
  })
  return { data, error }
}

// Realtime subscription helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const supabase = createBrowserClient()
  
  const channel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table,
        filter 
      }, 
      callback
    )
    .subscribe()
  
  return () => channel.unsubscribe()
}

// Database helper functions
export const dbHelpers = {
  // Tasks
  async getTasks(userId: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
    return { data, error }
  },

  async createTask(task: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single()
    return { data, error }
  },

  async updateTask(taskId: string, updates: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()
    return { data, error }
  },

  async deleteTask(taskId: string) {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
    return { error }
  },

  // Sessions
  async createSession(session: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert([session])
      .select()
      .single()
    return { data, error }
  },

  async updateSession(sessionId: string, updates: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()
    return { data, error }
  },

  async getUserSessions(userId: string, limit = 50) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Settings
  async getUserSettings(userId: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  async updateUserSettings(userId: string, settings: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: userId })
      .select()
      .single()
    return { data, error }
  },

  // Stats
  async getDailyStats(userId: string, startDate?: string, endDate?: string) {
    const supabase = createBrowserClient()
    let query = supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query
    return { data, error }
  },

  // User Profile
  async getUserProfile(userId: string) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateUserProfile(userId: string, profile: any) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, id: userId })
      .select()
      .single()
    return { data, error }
  }
}

// Type exports for convenience
export type SupabaseClient = ReturnType<typeof createBrowserClient>
export type { Database } from '@/types/supabase'