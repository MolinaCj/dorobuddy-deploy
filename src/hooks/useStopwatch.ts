'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface StopwatchSession {
  id: string
  user_id: string
  task_id?: string
  duration_seconds: number
  started_at: string
  ended_at: string
  notes?: string
  created_at: string
  updated_at: string
  tasks?: {
    id: string
    title: string
  }
}

export interface CreateStopwatchSessionRequest {
  task_id?: string
  duration_seconds: number
  started_at: string
  ended_at: string
  notes?: string
}

export interface UpdateStopwatchSessionRequest {
  duration_seconds?: number
  started_at?: string
  ended_at?: string
  notes?: string
}

export interface StopwatchSessionsResponse {
  sessions: StopwatchSession[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useStopwatch() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a new stopwatch session
  const createSession = useCallback(async (sessionData: CreateStopwatchSessionRequest): Promise<StopwatchSession> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stopwatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create stopwatch session')
      }

      const { session } = await response.json()
      return session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create stopwatch session'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get stopwatch sessions
  const getSessions = useCallback(async (params?: {
    page?: number
    limit?: number
    start_date?: string
    end_date?: string
    task_id?: string
  }): Promise<StopwatchSessionsResponse> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      
      if (params?.page) searchParams.set('page', params.page.toString())
      if (params?.limit) searchParams.set('limit', params.limit.toString())
      if (params?.start_date) searchParams.set('start_date', params.start_date)
      if (params?.end_date) searchParams.set('end_date', params.end_date)
      if (params?.task_id) searchParams.set('task_id', params.task_id)

      const response = await fetch(`/api/stopwatch?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stopwatch sessions')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stopwatch sessions'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get a single stopwatch session
  const getSession = useCallback(async (sessionId: string): Promise<StopwatchSession> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stopwatch/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stopwatch session')
      }

      const { session } = await response.json()
      return session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stopwatch session'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Update a stopwatch session
  const updateSession = useCallback(async (
    sessionId: string, 
    updates: UpdateStopwatchSessionRequest
  ): Promise<StopwatchSession> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stopwatch/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update stopwatch session')
      }

      const { session } = await response.json()
      return session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stopwatch session'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Delete a stopwatch session
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stopwatch/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete stopwatch session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete stopwatch session'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  // Save a stopwatch session (convenience method for when user stops the stopwatch)
  const saveSession = useCallback(async (
    durationSeconds: number,
    startedAt: Date,
    endedAt: Date,
    taskId?: string,
    notes?: string
  ): Promise<StopwatchSession> => {
    const sessionData = {
      task_id: taskId,
      duration_seconds: durationSeconds,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      notes,
    }

    try {
      // Try to save to server first
      return await createSession(sessionData)
    } catch (error) {
      // If offline, save to localStorage for later sync
      if (!navigator.onLine || error instanceof TypeError) {
        console.log('Offline: Saving stopwatch session to localStorage')
        const offlineSession: StopwatchSession = {
          id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: user?.id || '',
          task_id: taskId,
          duration_seconds: durationSeconds,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Save to localStorage
        const key = `offline_stopwatch_sessions_${user?.id}`
        const existingSessions = JSON.parse(localStorage.getItem(key) || '[]')
        existingSessions.push(offlineSession)
        localStorage.setItem(key, JSON.stringify(existingSessions))

        return offlineSession
      }
      
      // Re-throw if it's not an offline error
      throw error
    }
  }, [createSession, user])

  // Sync offline sessions when back online
  const syncOfflineSessions = useCallback(async (): Promise<void> => {
    if (!user || !navigator.onLine) return

    const key = `offline_stopwatch_sessions_${user.id}`
    const offlineSessions = JSON.parse(localStorage.getItem(key) || '[]')
    
    if (offlineSessions.length === 0) return

    console.log(`Syncing ${offlineSessions.length} offline stopwatch sessions`)

    try {
      // Try to sync each offline session
      for (const session of offlineSessions) {
        try {
          await createSession({
            task_id: session.task_id,
            duration_seconds: session.duration_seconds,
            started_at: session.started_at,
            ended_at: session.ended_at,
            notes: session.notes,
          })
        } catch (error) {
          console.error('Failed to sync offline session:', error)
          // Continue with other sessions even if one fails
        }
      }

      // Clear offline sessions after successful sync
      localStorage.removeItem(key)
      console.log('Offline stopwatch sessions synced successfully')
    } catch (error) {
      console.error('Failed to sync offline sessions:', error)
    }
  }, [user, createSession])

  return {
    loading,
    error,
    createSession,
    getSessions,
    getSession,
    updateSession,
    deleteSession,
    saveSession,
    syncOfflineSessions,
  }
}
