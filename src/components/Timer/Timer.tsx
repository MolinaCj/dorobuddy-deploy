// src/components/Timer/Timer.tsx - Fixed Timer Component
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Settings, Coffee, Zap, SkipForward, Clock } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useAudio } from '@/hooks/useAudio'
import { useStopwatch } from '@/hooks/useStopwatch'
import { useDailyStopwatch } from '@/hooks/useDailyStopwatch'

interface TimerProps {
  selectedTaskId?: string
  onSessionComplete: (sessionId: string) => void
  onOpenSettings: () => void
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak' | 'stopwatch'

interface TimerState {
  mode: TimerMode
  timeRemaining: number
  isActive: boolean
  sessionsCompleted: number
  stopwatchTime: number // For stopwatch mode - counts up from 0
  // isReversed: boolean // Commented out reverse mode
}

export default function Timer({ selectedTaskId, onSessionComplete, onOpenSettings }: TimerProps) {
  const { settings, loading: settingsLoading } = useSettings()
  const { playSound, loading: audioLoading } = useAudio()
  const { saveSession } = useStopwatch()
  const { addTime, resetAccumulatedTime, getTodayTotal } = useDailyStopwatch()
  

  // Timer state
  const [state, setState] = useState<TimerState>({
    mode: 'work',
    timeRemaining: 1500, // 25 minutes default
    isActive: false,
    sessionsCompleted: 0,
    stopwatchTime: 0, // Start at 0 for stopwatch
    // isReversed: false, // Commented out reverse mode
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const hasCompletedRef = useRef(false)
  const stopwatchStartTimeRef = useRef<Date | null>(null) // Track when stopwatch started

  // Get duration for current mode
  const getDuration = useCallback((mode: TimerMode): number => {
    if (!settings) return mode === 'work' ? 1500 : mode === 'shortBreak' ? 300 : 1800
    
    switch (mode) {
      case 'work':
        return settings.work_duration
      case 'shortBreak':
        return settings.short_break_duration
      case 'longBreak':
        return settings.long_break_duration
      case 'stopwatch':
        return 0 // Stopwatch starts at 0
      default:
        return 1500
    }
  }, [settings])

  //Initialize timer with settings and update when settings change
  useEffect(() => {
    if (settings) {
      setState(prev => {
        // Only update if timer is not active to avoid interrupting running timer
        if (!prev.isActive) {
          const newDuration = (() => {
            switch (prev.mode) {
              case 'work':
                return settings.work_duration
              case 'shortBreak':
                return settings.short_break_duration
              case 'longBreak':
                return settings.long_break_duration
              case 'stopwatch':
                return 0 // Stopwatch always starts at 0
              default:
                return settings.work_duration
            }
          })()
          
          return {
            ...prev,
            timeRemaining: newDuration, // Removed reverse mode logic
            stopwatchTime: prev.mode === 'stopwatch' ? prev.stopwatchTime : 0, // Preserve stopwatch time when switching modes
          }
        }
        return prev
      })
    }
  }, [settings])




  // Switch timer mode
const switchMode = useCallback(
  (newMode: TimerMode, incrementSession: boolean = false) => {
    setState(prev => {
      // If switching away from stopwatch and it was running, save the session first
      if (prev.mode === 'stopwatch' && prev.isActive && stopwatchStartTimeRef.current) {
        const endTime = new Date()
        const duration = prev.stopwatchTime
        
        // Add to daily total (pass current total time for proper accumulation)
        addTime(duration)
        
        // Save stopwatch session in background
        saveSession(duration, stopwatchStartTimeRef.current, endTime, selectedTaskId || undefined)
          .then((session) => {
            console.log('Stopwatch session saved on mode switch:', session)
          })
          .catch((error) => {
            console.error('Failed to save stopwatch session on mode switch:', error)
          })
        
        stopwatchStartTimeRef.current = null
      }
      
      return {
        ...prev,
        mode: newMode,
        timeRemaining: getDuration(newMode), // now always fresh
        isActive: false,
        sessionsCompleted: incrementSession ? prev.sessionsCompleted + 1 : prev.sessionsCompleted,
        stopwatchTime: newMode === 'stopwatch' ? prev.stopwatchTime : 0, // Preserve stopwatch time when switching to stopwatch
        // Removed reverse mode logic
      }
    })
    hasCompletedRef.current = false

    if (settings && newMode !== 'stopwatch') {
      const shouldAutoStart =
        (newMode !== 'work' && settings.auto_start_breaks) ||
        (newMode === 'work' && settings.auto_start_pomodoros)

      if (shouldAutoStart) {
        setTimeout(() => {
          setState(prev => ({ ...prev, isActive: true }))
        }, 1000)
      }
    }
  },
  [settings, getDuration, saveSession, selectedTaskId] // depends on settings and getDuration
)


  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    if (hasCompletedRef.current) return
    hasCompletedRef.current = true

    const currentMode = state.mode
    const currentSessions = state.sessionsCompleted

    // Don't handle completion for stopwatch mode
    if (currentMode === 'stopwatch') {
      return
    }

    // Play completion sound
    if (settings) {
      const soundId = currentMode === 'work' 
        ? settings.notification_sound 
        : settings.break_sound
      playSound(soundId, settings.notification_volume)
    }

    // Show notification based on current mode
    if ('Notification' in window && Notification.permission === 'granted') {
      if (currentMode === 'work') {
        new Notification('Work Session Complete!', {
          body: 'Great job! Time for a break.',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
        })
      } else {
        new Notification('Break Complete!', {
          body: 'Break is over. Ready to focus?',
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
        })
      }
    }

    // Record session in database only for work sessions
    if (currentMode === 'work') {
      try {
        const duration = getDuration(currentMode)
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: selectedTaskId || null,
            session_type: 'work',
            planned_duration: duration,
            actual_duration: duration,
            notes: null
          })
        })

        if (response.ok) {
          const { session } = await response.json()
          console.log('Session recorded successfully:', session)
          onSessionComplete(session.id)
        } else {
          console.error('Failed to record session:', await response.text())
          onSessionComplete(`session-${Date.now()}`) // Fallback
        }
      } catch (error) {
        console.error('Error recording session:', error)
        onSessionComplete(`session-${Date.now()}`) // Fallback
      }
    }

    // Determine next mode
    if (currentMode === 'work') {
      const newSessionCount = currentSessions + 1
      const sessionsUntilLongBreak = settings?.sessions_until_long_break || 4
      
      // Check if it's time for a long break
      if (newSessionCount % sessionsUntilLongBreak === 0) {
        switchMode('longBreak', true)
      } else {
        switchMode('shortBreak', true)
      }
    } else {
      // Break is over, return to work
      switchMode('work', false)
    }
  }, [state.mode, state.sessionsCompleted, settings, playSound, onSessionComplete, switchMode])

  // Timer tick
  useEffect(() => {
    if (!state.isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (state.mode === 'stopwatch') {
      // Stopwatch mode - count up
      startTimeRef.current = Date.now() - (state.stopwatchTime * 1000)

      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current!) / 1000)
        
        setState(prev => ({ ...prev, stopwatchTime: elapsed }))
      }, 100)
    } else {
      // Normal Pomodoro - count down (reverse mode commented out)
      startTimeRef.current = Date.now()
      const targetTime = Date.now() + (state.timeRemaining * 1000)

      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const remaining = Math.ceil((targetTime - now) / 1000)

        if (remaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setState(prev => ({ ...prev, timeRemaining: 0, isActive: false }))
          handleTimerComplete()
        } else {
          setState(prev => ({ ...prev, timeRemaining: remaining }))
        }
      }, 100)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isActive, state.mode, state.stopwatchTime, handleTimerComplete]) // Added stopwatch dependencies

  // Toggle play/pause
  const toggleTimer = async () => {
    setState(prev => {
      const newIsActive = !prev.isActive
      
      // If stopping stopwatch and it was running, save the session
      if (prev.mode === 'stopwatch' && prev.isActive && !newIsActive && stopwatchStartTimeRef.current) {
        const endTime = new Date()
        const duration = prev.stopwatchTime
        
        // Add to daily total (pass current total time for proper accumulation)
        addTime(duration)
        
        // Save stopwatch session in background (don't await to avoid blocking UI)
        saveSession(duration, stopwatchStartTimeRef.current, endTime, selectedTaskId || undefined)
          .then((session) => {
            console.log('Stopwatch session saved:', session)
          })
          .catch((error) => {
            console.error('Failed to save stopwatch session:', error)
          })
        
        stopwatchStartTimeRef.current = null
      }
      
      // If starting stopwatch, record the start time
      if (prev.mode === 'stopwatch' && !prev.isActive && newIsActive) {
        stopwatchStartTimeRef.current = new Date()
      }
      
      return { ...prev, isActive: newIsActive }
    })
  }

  // Toggle reverse mode - COMMENTED OUT
  // const toggleReverse = () => {
  //   setState(prev => {
  //     const newDuration = getDuration(prev.mode)
  //     const newIsReversed = !prev.isReversed
      
  //     return {
  //       ...prev,
  //       isReversed: newIsReversed,
  //       timeRemaining: newIsReversed ? 0 : newDuration,
  //       isActive: false,
  //     }
  //   })
  //   hasCompletedRef.current = false
  // }

  // Skip to next session
  const skipSession = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Don't trigger notifications or auto-transitions when skipping
    setState(prev => ({ ...prev, isActive: false }))
    
    const currentMode = state.mode
    const currentSessions = state.sessionsCompleted
    
    // Determine next mode without notifications
    if (currentMode === 'work') {
      const newSessionCount = currentSessions + 1
      const sessionsUntilLongBreak = settings?.sessions_until_long_break || 4
      
      // Check if it's time for a long break
      if (newSessionCount % sessionsUntilLongBreak === 0) {
        switchMode('longBreak', true)
      } else {
        switchMode('shortBreak', true)
      }
    } else {
      // Break is over, return to work
      switchMode('work', false)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setState(prev => {
      // If resetting stopwatch and it was running, save the session first
      if (prev.mode === 'stopwatch' && prev.isActive && stopwatchStartTimeRef.current) {
        const endTime = new Date()
        const duration = prev.stopwatchTime
        
        // Add to daily total (pass current total time for proper accumulation)
        addTime(duration)
        
        // Save stopwatch session in background
        saveSession(duration, stopwatchStartTimeRef.current, endTime, selectedTaskId || undefined)
          .then((session) => {
            console.log('Stopwatch session saved on reset:', session)
          })
          .catch((error) => {
            console.error('Failed to save stopwatch session on reset:', error)
          })
        
        stopwatchStartTimeRef.current = null
      }
      
      // Reset accumulated time tracking when resetting stopwatch (but keep daily total)
      if (prev.mode === 'stopwatch') {
        resetAccumulatedTime()
      }
      
      return {
        ...prev,
        timeRemaining: getDuration(prev.mode), // Removed reverse mode logic
        stopwatchTime: prev.mode === 'stopwatch' ? 0 : prev.stopwatchTime, // Reset stopwatch time only in stopwatch mode
        isActive: false,
      }
    })
    hasCompletedRef.current = false
  }

  // Reset all (including session count)
  const resetAll = () => {
    setState({
      mode: 'work',
      timeRemaining: getDuration('work'),
      isActive: false,
      sessionsCompleted: 0,
      stopwatchTime: 0, // Reset stopwatch time
      // isReversed: false, // Commented out reverse mode
    })
    hasCompletedRef.current = false
  }

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage
  const getProgress = (): number => {
    if (state.mode === 'stopwatch') {
      // For stopwatch, we don't show progress (or could show a different visualization)
      return 0
    }
    // Removed reverse mode logic - always calculate normal progress
    const total = getDuration(state.mode)
    return ((total - state.timeRemaining) / total) * 100
  }

  // Get mode display info
  const getModeInfo = () => {
    switch (state.mode) {
      case 'work':
        return {
          title: 'Focus Time',
          icon: <Zap className="w-6 h-6" />,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
        }
      case 'shortBreak':
        return {
          title: 'Short Break',
          icon: <Coffee className="w-6 h-6" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
        }
      case 'longBreak':
        return {
          title: 'Long Break',
          icon: <Coffee className="w-6 h-6" />,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500',
        }
      case 'stopwatch':
        return {
          title: 'Stopwatch',
          icon: <Clock className="w-6 h-6" />,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500',
        }
    }
  }

  const modeInfo = getModeInfo()
  const sessionsUntilLongBreak = settings?.sessions_until_long_break || 4
  const currentCyclePosition = state.sessionsCompleted % sessionsUntilLongBreak

  // Show loading state only if settings are loading (audio is non-blocking)
  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading timer...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Mode Header */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 ${modeInfo.color} mb-2`}>
          {modeInfo.icon}
          <h2 className="text-2xl font-bold">{modeInfo.title}</h2>
        </div>
        <div className="flex items-center justify-center space-x-2">
          {selectedTaskId && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Working on selected task
            </p>
          )}
          {/* Reverse mode indicator commented out */}
          {/* {state.isReversed && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full">
              Reverse Mode
            </span>
          )} */}
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative">
        {/* Circular Progress */}
        <div className="relative w-72 h-72 mx-auto">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="144"
              cy="144"
              r="136"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="144"
              cy="144"
              r="136"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={modeInfo.color} // Removed reverse mode styling
              style={{
                strokeDasharray: `${2 * Math.PI * 136}`,
                strokeDashoffset: `${2 * Math.PI * 136 * (1 - getProgress() / 100)}`,
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-gray-900 dark:text-white tabular-nums">
                {state.mode === 'stopwatch' ? formatTime(state.stopwatchTime) : formatTime(state.timeRemaining)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {state.isActive ? 'In Progress' : 'Paused'} {/* Removed reverse mode text */}
              </div>
              {state.mode === 'stopwatch' && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                    Today's Total
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 tabular-nums">
                    {getTodayTotal().formatted}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className={`
            p-6 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95
            ${state.isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : `${modeInfo.bgColor} hover:opacity-90 text-white`
            }
          `}
          aria-label={state.isActive ? 'Pause timer' : 'Start timer'}
        >
          {state.isActive ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        {state.mode !== 'stopwatch' && (
          <button
            onClick={skipSession}
            className="p-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            aria-label="Skip to next session"
            title="Skip to next session"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          aria-label="Reset timer"
          title="Reset current timer"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-4 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          aria-label="Open settings"
          title="Timer settings"
        >
          <Settings className="w-6 h-6" />
        </button>

      </div>

      {/* Reverse Mode Toggle - COMMENTED OUT */}
      {/* <div className="flex items-center justify-center">
        <button
          onClick={toggleReverse}
          disabled={state.isActive}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${state.isActive 
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400' 
              : state.isReversed
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
          title={state.isActive ? 'Stop timer to change mode' : 'Toggle reverse pomodoro mode'}
        >
          <span>🔄</span>
          <span>{state.isReversed ? 'Disable' : 'Enable'} Reverse Mode</span>
        </button>
      </div> */}

      {/* Session Progress - Hidden in stopwatch mode */}
      {state.mode !== 'stopwatch' && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Session Progress
            </span>
            <button
              onClick={resetAll}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Reset all sessions"
            >
              Reset All
            </button>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center space-x-3">
            {Array.from({ length: sessionsUntilLongBreak }).map((_, index) => (
              <div
                key={index}
                className={`
                  w-4 h-4 rounded-full transition-all
                  ${index < currentCyclePosition
                    ? `${modeInfo.bgColor} shadow-md scale-110`
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
                title={`Session ${index + 1}`}
              />
            ))}
          </div>

          <div className="text-center mt-3 text-sm text-gray-600 dark:text-gray-400">
            {currentCyclePosition === 0 && state.sessionsCompleted > 0
              ? `Completed ${Math.floor(state.sessionsCompleted / sessionsUntilLongBreak)} full cycle${Math.floor(state.sessionsCompleted / sessionsUntilLongBreak) !== 1 ? 's' : ''}!`
              : `${currentCyclePosition} of ${sessionsUntilLongBreak} sessions completed`
            }
          </div>

          {/* Total sessions counter */}
          <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-500">
            Total work sessions: {state.sessionsCompleted}
          </div>
        </div>
      )}

      {/* Quick Mode Switch */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => switchMode('work', false)}
          disabled={state.mode === 'work'}
          className={`
            p-3 rounded-lg text-sm font-medium transition-colors
            ${state.mode === 'work'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          Work
        </button>
        <button
          onClick={() => switchMode('shortBreak', false)}
          disabled={state.mode === 'shortBreak'}
          className={`
            p-3 rounded-lg text-sm font-medium transition-colors
            ${state.mode === 'shortBreak'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          Short Break
        </button>
        <button
          onClick={() => switchMode('longBreak', false)}
          disabled={state.mode === 'longBreak'}
          className={`
            p-3 rounded-lg text-sm font-medium transition-colors
            ${state.mode === 'longBreak'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          Long Break
        </button>
        <button
          onClick={() => switchMode('stopwatch', false)}
          disabled={state.mode === 'stopwatch'}
          className={`
            p-3 rounded-lg text-sm font-medium transition-colors
            ${state.mode === 'stopwatch'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          Stopwatch
        </button>
      </div>
    </div>
  )
}