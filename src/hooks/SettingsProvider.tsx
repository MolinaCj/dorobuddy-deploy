'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { UserSettings, UpdateSettingsRequest } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  error: Error | null
  updateSettings: (updates: UpdateSettingsRequest) => Promise<UserSettings>
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createBrowserClient()

  // Fetch user settings
  const fetchSettings = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      console.log('Settings fetched in SettingsProvider:', data)
      setSettings(data)
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Update settings
  const updateSettings = async (updates: UpdateSettingsRequest): Promise<UserSettings> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const updatedSettings = await response.json()
      console.log('Settings updated in SettingsProvider:', updatedSettings)
      
      // Force a new object reference to ensure React detects the change
      setSettings({ ...updatedSettings })
      return updatedSettings
    } catch (err) {
      console.error('Error updating settings:', err)
      throw err
    }
  }

  // Fetch settings when user changes
  useEffect(() => {
    fetchSettings()
  }, [user])

  // Apply theme to document when settings.theme changes
  useEffect(() => {
    if (!settings) return
    const root = document.documentElement
    const themeId = settings.theme || 'default'
    // Toggle Tailwind dark mode for components using `dark:` variants
    root.classList.toggle('dark', themeId === 'dark')
    // Expose theme identifier for CSS variables-based theming
    root.setAttribute('data-theme', themeId)
  }, [settings?.theme])

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
