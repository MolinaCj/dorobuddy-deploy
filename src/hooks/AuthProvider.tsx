'use client'

import { useState, useEffect, createContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createBrowserClient, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { LoginRequest, RegisterRequest } from '@/types/api'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  profile: Profile | null
}

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginRequest) => Promise<{ error?: string }>
  signUp: (credentials: RegisterRequest) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<{ error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    profile: null,
  })
  
  const router = useRouter()
  const supabase = createBrowserClient()

  const loadProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && profile) {
        setState(prev => ({ ...prev, profile }))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.error('Error getting session:', error)

        if (session?.user) {
          await loadProfile(session.user.id)
        }

        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          profile: null,
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
        }))

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setState(prev => ({ ...prev, profile: null }))
        }

        if (event === 'SIGNED_IN') router.push('/')
        if (event === 'SIGNED_OUT') router.push('/login')
      }
    )

    return () => subscription?.unsubscribe()
  }, [router, supabase.auth])

  const signIn = async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      const { error } = await signInWithEmail(credentials.email, credentials.password)

      if (error) {
        setState(prev => ({ ...prev, loading: false }))
        return { error: error.message }
      }

      return {}
    } catch {
      setState(prev => ({ ...prev, loading: false }))
      return { error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (credentials: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      const { data, error } = await signUpWithEmail(credentials.email, credentials.password, {
        username: credentials.username,
        full_name: credentials.full_name,
      })

      if (error) {
        setState(prev => ({ ...prev, loading: false }))
        return { error: error.message }
      }

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: credentials.username,
          full_name: credentials.full_name,
        })

        await supabase.from('user_settings').insert({
          user_id: data.user.id,
          work_duration: 1500,
          short_break_duration: 300,
          long_break_duration: 1800,
          sessions_until_long_break: 4,
          auto_start_breaks: false,
          auto_start_pomodoros: false,
          theme: 'default',
          notification_sound: 'bell',
          break_sound: 'chime',
          master_volume: 0.7,
          notification_volume: 0.8,
          music_volume: 0.5,
          ambient_volume: 0.3,
          spotify_enabled: false,
        })
      }

      setState(prev => ({ ...prev, loading: false }))
      return {}
    } catch {
      setState(prev => ({ ...prev, loading: false }))
      return { error: 'An unexpected error occurred during registration' }
    }
  }

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      await supabaseSignOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      if (!state.user) return { error: 'No user logged in' }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) return { error: error.message }

      setState(prev => ({ ...prev, profile: data }))
      return {}
    } catch {
      return { error: 'Failed to update profile' }
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}