'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react'
import { useOffline } from '@/hooks/useOffline' // Custom hook to detect offline/online status

export default function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowNotice(true)
        // Hide "back online" message after 3 seconds
        setTimeout(() => {
          setShowNotice(false)
          setWasOffline(false)
        }, 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      setShowNotice(true)
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  // Don't show if online and never was offline
  if (!showNotice) return null

  return (
    <div
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
        px-4 py-3 rounded-lg shadow-lg border max-w-sm mx-auto
        transition-all duration-300 ease-in-out
        ${isOnline 
          ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
          : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
          {isOnline ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Back online!</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">You're offline</span>
              </>
            )}
          </div>
          
          <p className="text-xs mt-1 opacity-90">
            {isOnline 
              ? 'Your data will sync automatically.'
              : 'Some features may be limited. Changes will sync when reconnected.'
            }
          </p>
        </div>

        {/* Manual dismiss button for offline state */}
        {!isOnline && (
          <button
            onClick={() => setShowNotice(false)}
            className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            aria-label="Dismiss offline notice"
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </div>

      {/* Offline capabilities info */}
      {!isOnline && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
          <div className="text-xs space-y-1 opacity-90">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Timer functionality available</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Local task management</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
              <span>Settings cached locally</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>Spotify unavailable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Offline-aware API wrapper
export function useOfflineApi() {
  const { isOnline } = useOffline()

  const apiCall = async (url: string, options: RequestInit = {}) => {
    if (!isOnline) {
      // Store action for later sync
      const offlineAction = {
        id: Date.now().toString(),
        url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        timestamp: new Date().toISOString(),
      }
      
      // Store in localStorage for later sync
      const existingActions = JSON.parse(
        localStorage.getItem('offline-actions') || '[]'
      )
      localStorage.setItem(
        'offline-actions', 
        JSON.stringify([...existingActions, offlineAction])
      )

      throw new Error('Offline - action queued for sync')
    }

    return fetch(url, options)
  }

  return { apiCall, isOnline }
}

// Component to show offline queue status
export function OfflineQueue() {
  const [queueCount, setQueueCount] = useState(0)
  const { isOnline } = useOffline()

  useEffect(() => {
    const updateQueueCount = () => {
      const actions = JSON.parse(localStorage.getItem('offline-actions') || '[]')
      setQueueCount(actions.length)
    }

    updateQueueCount()
    
    // Update count when storage changes
    window.addEventListener('storage', updateQueueCount)
    
    // Also check periodically
    const interval = setInterval(updateQueueCount, 1000)

    return () => {
      window.removeEventListener('storage', updateQueueCount)
      clearInterval(interval)
    }
  }, [])

  if (queueCount === 0 || isOnline) return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200 rounded-lg p-3 shadow-lg text-sm max-w-xs">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="font-medium">
          {queueCount} action{queueCount !== 1 ? 's' : ''} queued
        </span>
      </div>
      <p className="text-xs mt-1 opacity-90">
        Will sync when back online
      </p>
    </div>
  )
}