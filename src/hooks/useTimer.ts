'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PomodoroSession, StartSessionRequest, UpdateSessionRequest } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

interface UseTimerProps {
  onComplete?: (sessionId: string) => void
  onTick?: (remaining: number, total: number) => void
}

export function useTimer({ onComplete, onTick }: UseTimerProps = {}) {
  const { user } = useAuth()
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

//   const intervalRef = useRef<NodeJS.Timeout>|();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0)

  // Start a new timer session
  const startTimer = async (sessionData: StartSessionRequest) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const session = await response.json()
      setCurrentSession(session)
      setTimeRemaining(sessionData.planned_duration)
      setTotalTime(sessionData.planned_duration)
      setIsRunning(true)
      setIsPaused(false)
      startTimeRef.current = Date.now()

      return session
    } catch (error) {
      throw error
    }
  }

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true)
    }
  }, [isRunning, isPaused])

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false)
      startTimeRef.current = Date.now() - (totalTime - timeRemaining) * 1000
    }
  }, [isRunning, isPaused, totalTime, timeRemaining])

  // Reset the timer
  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeRemaining(0)
    setTotalTime(0)
    setCurrentSession(null)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  // Complete the current session
  const completeSession = useCallback(async () => {
    if (!currentSession) return

    try {
      const actualDuration = totalTime - timeRemaining
      const response = await fetch(`/api/sessions/${currentSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          actual_duration: actualDuration,
          completed_at: new Date().toISOString(),
        } as UpdateSessionRequest),
      })

      if (!response.ok) {
        throw new Error('Failed to complete session')
      }

      const updatedSession = await response.json()
      setCurrentSession(updatedSession)
      
      if (onComplete) {
        onComplete(updatedSession.id)
      }

      return updatedSession
    } catch (error) {
      console.error('Failed to complete session:', error)
      throw error
    }
  }, [currentSession, totalTime, timeRemaining, onComplete])

  // Timer tick effect
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1)
          
          if (onTick) {
            onTick(newTime, totalTime)
          }

          if (newTime === 0) {
            // Session completed
            setIsRunning(false)
            setIsPaused(false)
            
            // Complete session in background
            completeSession()
          }

          return newTime
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, timeRemaining, totalTime, onTick, completeSession])

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get progress percentage
  const getProgress = useCallback((): number => {
    if (totalTime === 0) return 0
    return ((totalTime - timeRemaining) / totalTime) * 100
  }, [timeRemaining, totalTime])

  return {
    currentSession,
    timeRemaining,
    totalTime,
    isRunning,
    isPaused,
    startTimer,
    pauseTimer: pauseTimer,
    resumeTimer,
    resetTimer,
    completeSession,
    formatTime,
    getProgress,
  }
}