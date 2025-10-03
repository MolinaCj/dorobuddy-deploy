'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { UserSettings, UpdateSettingsRequest } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

export function useSettings() {
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
      const response = await fetch('/api/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Update settings
  const updateSettings = async (updates: UpdateSettingsRequest) => {
    if (!user) return

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
      console.log('Settings updated in useSettings hook:', updatedSettings)
      setSettings(updatedSettings)
      return updatedSettings
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [user])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
  }
}