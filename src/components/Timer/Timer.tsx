// src/components/Timer/Timer.tsx - Complete Timer Component for App Router
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Pause, Square, RotateCcw, Settings } from 'lucide-react'
import { SessionType } from '@/types/api'

interface TimerPreset {
  id: string
  name: string
  work: number
  shortBreak: number
  longBreak: number
  color: string
}

const DEFAULT_PRESETS: TimerPreset[] = [
  { id: 'classic', name: 'Classic', work: 1500, shortBreak: 300, longBreak: 1800, color: 'bg-red-500' },
  { id: 'short', name: 'Short', work: 900, shortBreak: 180, longBreak: 900, color: 'bg-blue-500' },
  { id: 'long', name: 'Long Focus', work: 3000, shortBreak: 600, longBreak: 2400, color: 'bg-green-500' },
  { id: 'ultrashort', name: 'Micro', work: 300, shortBreak: 60, longBreak: 300, color: 'bg-purple-500' },
]

interface TimerProps {
  selectedTaskId?: string
  onSessionComplete: (sessionId: string) => void
  onOpenSettings: () => void
}

export default function Timer({ selectedTaskId, onSessionComplete, onOpenSettings }: TimerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('classic')
  const [reverseMode, setReverseMode] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [currentSessionType, setCurrentSessionType] = useState<SessionType>('work')
  const [customDuration, setCustomDuration] = useState<number | null>(null)
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(1500) // 25 minutes default
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [totalTime, setTotalTime] = useState(1500)

  const circleRef = useRef<SVGCircleElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // const intervalRef = useRef<NodeJS.Timeout>()

  // Calculate current duration based on session type
  const getCurrentDuration = useCallback((): number => {
    if (customDuration) return customDuration
    
    const preset = DEFAULT_PRESETS.find(p => p.id === selectedPreset)
    if (!preset) return 1500

    switch (currentSessionType) {
      case 'work':
        return preset.work
      case 'short_break':
        return preset.shortBreak
      case 'long_break':
        return preset.longBreak
      default:
        return preset.work
    }
  }, [selectedPreset, currentSessionType, customDuration])

  // Update progress ring visual
  const updateProgressRing = useCallback((remaining: number, total: number) => {
    if (!circleRef.current) return
    
    const circle = circleRef.current
    const radius = circle.r.baseVal.value
    const circumference = 2 * Math.PI * radius
    
    let progress
    if (reverseMode) {
      // Reverse mode: fill up as time progresses
      progress = (total - remaining) / total
    } else {
      // Normal mode: empty as time decreases
      progress = remaining / total
    }
    
    const strokeDashoffset = circumference - (progress * circumference)
    circle.style.strokeDashoffset = strokeDashoffset.toString()
  }, [reverseMode])

  // Timer tick function
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1
          updateProgressRing(newTime, totalTime)
          
          if (newTime <= 0) {
            handleSessionComplete()
            return 0
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
  }, [isRunning, isPaused, timeRemaining, totalTime, updateProgressRing])

  // Handle session completion
  const handleSessionComplete = async () => {
    setIsRunning(false)
    setIsPaused(false)
    
    const completedType = currentSessionType
    
    // Play completion sound (browser notification sound)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${completedType === 'work' ? 'Work' : 'Break'} Session Complete!`, {
        body: completedType === 'work' ? 'Great work! Time for a break.' : 'Break over! Ready to focus?',
        icon: '/icons/icon-192x192.png',
      })
    }

    // Update sessions completed count
    if (completedType === 'work') {
      setSessionsCompleted(prev => prev + 1)
    }

    // Determine next session type
    let nextType: SessionType = 'work'
    if (completedType === 'work') {
      const shouldTakeLongBreak = (sessionsCompleted + 1) % 4 === 0 // Default to 4 sessions
      nextType = shouldTakeLongBreak ? 'long_break' : 'short_break'
    }

    setCurrentSessionType(nextType)
    
    // Reset timer for next session
    const nextDuration = getNextSessionDuration(nextType)
    setTimeRemaining(nextDuration)
    setTotalTime(nextDuration)
    updateProgressRing(nextDuration, nextDuration)

    // Call parent completion handler
    if (currentSessionId) {
      onSessionComplete(currentSessionId)
    }

    // TODO: Auto-start next session based on settings
  }

  const getNextSessionDuration = (sessionType: SessionType): number => {
    const preset = DEFAULT_PRESETS.find(p => p.id === selectedPreset) || DEFAULT_PRESETS[0]
    switch (sessionType) {
      case 'work': return preset.work
      case 'short_break': return preset.shortBreak
      case 'long_break': return preset.longBreak
      default: return preset.work
    }
  }

  // Handle start/resume
  const handleStart = async () => {
    try {
      if (!isRunning) {
        // Starting new session
        const duration = getCurrentDuration()
        setTimeRemaining(duration)
        setTotalTime(duration)
        updateProgressRing(duration, duration)
        
        // TODO: Create session in database
        const sessionId = `session-${Date.now()}` // Temporary ID
        setCurrentSessionId(sessionId)
      }
      
      setIsRunning(true)
      setIsPaused(false)
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  // Handle pause
  const handlePause = () => {
    setIsPaused(true)
  }

  // Handle resume
  const handleResume = () => {
    setIsPaused(false)
  }

  // Handle reset
  const handleReset = () => {
    setIsRunning(false)
    setIsPaused(false)
    setSessionsCompleted(0)
    setCurrentSessionType('work')
    setCurrentSessionId(null)
    
    const duration = getCurrentDuration()
    setTimeRemaining(duration)
    setTotalTime(duration)
    updateProgressRing(duration, duration)
  }

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    if (isRunning) return // Don't change preset while timer is running
    setSelectedPreset(presetId)
    setCustomDuration(null)
    
    const duration = getCurrentDuration()
    setTimeRemaining(duration)
    setTotalTime(duration)
    updateProgressRing(duration, duration)
  }

  // Handle custom duration input
  const handleCustomDuration = (minutes: number) => {
    if (isRunning) return
    const seconds = minutes * 60
    setCustomDuration(seconds)
    setSelectedPreset('custom')
    setTimeRemaining(seconds)
    setTotalTime(seconds)
    updateProgressRing(seconds, seconds)
  }

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Initialize progress ring on mount
  useEffect(() => {
    const duration = getCurrentDuration()
    setTimeRemaining(duration)
    setTotalTime(duration)
    updateProgressRing(duration, duration)
  }, [getCurrentDuration, updateProgressRing])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const currentPreset = DEFAULT_PRESETS.find(p => p.id === selectedPreset) || DEFAULT_PRESETS[0]
  const displayTime = reverseMode ? (totalTime - timeRemaining) : timeRemaining

  // Session type labels
  const sessionTypeLabels: Record<SessionType, string> = {
    work: 'Focus Time',
    short_break: 'Short Break',
    long_break: 'Long Break',
  }

  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      {/* Session Type Indicator */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {sessionTypeLabels[currentSessionType]}
        </h2>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Session {sessionsCompleted + 1}</span>
          <span>•</span>
          <span>{currentPreset.name} Mode</span>
          {reverseMode && (
            <>
              <span>•</span>
              <span className="text-blue-500">Reverse</span>
            </>
          )}
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative">
        <svg className="transform -rotate-90 w-64 h-64" viewBox="0 0 256 256">
          {/* Background ring */}
          <circle
            cx="128"
            cy="128"
            r="112"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress ring */}
          <circle
            ref={circleRef}
            cx="128"
            cy="128"
            r="112"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={`${currentPreset.color.replace('bg-', 'text-')} transition-all duration-300`}
            style={{
              strokeDasharray: 2 * Math.PI * 112,
              strokeDashoffset: 2 * Math.PI * 112,
            }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-mono font-bold text-gray-900 dark:text-white">
            {formatTime(displayTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {reverseMode ? 'Elapsed' : 'Remaining'}
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-4">
        {!isRunning || isPaused ? (
          <button
            onClick={isPaused ? handleResume : handleStart}
            className={`p-4 rounded-full ${currentPreset.color} text-white hover:opacity-90 transition-all duration-200 shadow-lg`}
            aria-label={isPaused ? 'Resume timer' : 'Start timer'}
          >
            <Play className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-4 rounded-full bg-yellow-500 text-white hover:opacity-90 transition-all duration-200 shadow-lg"
            aria-label="Pause timer"
          >
            <Pause className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={handleReset}
          className="p-4 rounded-full bg-gray-500 text-white hover:opacity-90 transition-all duration-200 shadow-lg"
          aria-label="Reset timer"
        >
          <Square className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-4 rounded-full bg-blue-500 text-white hover:opacity-90 transition-all duration-200 shadow-lg"
          aria-label="Open settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setReverseMode(!reverseMode)}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg border ${
            reverseMode 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
          } disabled:opacity-50 transition-all duration-200`}
        >
          <RotateCcw className="w-4 h-4 inline mr-2" />
          Reverse Mode
        </button>
      </div>

      {/* Timer Presets */}
      <div className="w-full max-w-md">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              disabled={isRunning}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                selectedPreset === preset.id
                  ? `${preset.color} text-white border-transparent`
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
              } disabled:opacity-50`}
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-sm opacity-75">
                {Math.round(preset.work / 60)}m work
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Duration Input */}
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Duration (minutes)
        </label>
        <input
          type="number"
          min="1"
          max="120"
          placeholder="25"
          disabled={isRunning}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          onChange={(e) => {
            const value = parseInt(e.target.value)
            if (value > 0) handleCustomDuration(value)
          }}
        />
      </div>

      {/* Session Progress */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress to Long Break</span>
          <span>{sessionsCompleted} / 4 sessions</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`${currentPreset.color} h-2 rounded-full transition-all duration-300`}
            style={{
              width: `${Math.min(100, (sessionsCompleted / 4) * 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}