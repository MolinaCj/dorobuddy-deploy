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
    
    // Remove all existing theme classes
    root.classList.remove('dark', 'theme-nature', 'theme-sunset', 'theme-ocean', 'theme-lavender')
    
    // Apply theme-specific classes
    if (themeId === 'dark') {
      root.classList.add('dark')
    } else if (themeId !== 'default') {
      root.classList.add(`theme-${themeId}`)
    }
    
    // Set data-theme attribute for CSS variable theming
    root.setAttribute('data-theme', themeId)
    
    // Apply theme colors as CSS custom properties
    const themeColors = {
      default: ['#3B82F6', '#EF4444', '#10B981'],
      dark: ['#1F2937', '#374151', '#4B5563'],
      nature: ['#059669', '#0D9488', '#047857'],
      sunset: ['#F59E0B', '#EF4444', '#DC2626'],
      ocean: ['#0EA5E9', '#0284C7', '#0369A1'],
      lavender: ['#8B5CF6', '#A855F7', '#9333EA']
    }
    
    const colors = themeColors[themeId as keyof typeof themeColors] || themeColors.default
    root.style.setProperty('--theme-primary', colors[0])
    root.style.setProperty('--theme-secondary', colors[1])
    root.style.setProperty('--theme-accent', colors[2])
    
    console.log('Theme applied:', themeId, 'Colors:', colors)
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
