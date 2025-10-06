// src/app/page.tsx - Updated Main DoroBuddy Application Page
'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import Timer from '@/components/Timer/Timer'
import TaskManager from '@/components/Tasks/TaskManager'
import Heatmap from '@/components/Stats/Heatmap'
import MusicPlayer from '@/components/Music/MusicPlayer'
import SettingsModal from '@/components/Settings/SettingsModal'
import Footer from '@/components/Layout/Footer'
import InstallPrompt from '@/components/PWA/InstallPrompt'
import OfflineNotice from '@/components/PWA/OfflineNotice'
import { generateMockHeatmapData } from '@/components/Stats/Heatmap'
import { Settings, BarChart3, Music, Menu, X } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useRequireAuth()
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [heatmapData, setHeatmapData] = useState(generateMockHeatmapData(365))

  const handleSessionComplete = (sessionId: string) => {
    console.log('Session completed:', sessionId)
    setActiveSession(null)
    
    // Show notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete!', {
        body: 'Great work! Time for a break.',
        icon: '/icons/icon-192x192.png',
      })
    }
  }

  const handleTaskSelect = (taskId: string | undefined) => {
    setSelectedTaskId(taskId)
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading DoroBuddy...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* PWA Components */}
      <InstallPrompt />
      <OfflineNotice />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⏳ DoroBuddy
              </h1>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                Stay focused, future CPA!
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-2 rounded-lg transition-colors ${
                  showStats 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-label="Toggle statistics"
                title="Statistics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowMusic(!showMusic)}
                className={`p-2 rounded-lg transition-colors ${
                  showMusic 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                aria-label="Toggle music player"
                title="Music"
              >
                <Music className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition-colors"
                aria-label="Open settings"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden lg:inline">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-4">
              <button
                onClick={() => {
                  setShowStats(!showStats)
                  setSidebarOpen(false)
                }}
                className="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                <span>Statistics</span>
                {showStats && <span className="ml-auto text-blue-500">•</span>}
              </button>
              <button
                onClick={() => {
                  setShowMusic(!showMusic)
                  setSidebarOpen(false)
                }}
                className="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Music className="w-5 h-5 mr-3" />
                <span>Music Player</span>
                {showMusic && <span className="ml-auto text-green-500">•</span>}
              </button>
              <button
                onClick={() => {
                  setShowSettings(true)
                  setSidebarOpen(false)
                }}
                className="flex items-center w-full p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Settings</span>
              </button>
              
              {/* User Info in Mobile */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <Timer
                selectedTaskId={selectedTaskId}
                onSessionComplete={handleSessionComplete}
                onOpenSettings={() => setShowSettings(true)}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Manager */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <TaskManager
                selectedTaskId={selectedTaskId}
                onTaskSelect={handleTaskSelect}
                compact={false}
              />
            </div>

            {/* Music Player */}
            {showMusic && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <MusicPlayer
                  compact={false}
                  showControls={true}
                  sessionActive={activeSession !== null}
                  onPlayStateChange={(isPlaying) => {
                    console.log('Music playing:', isPlaying)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        {showStats && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Progress
                </h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                  aria-label="Close statistics"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Heatmap
                data={heatmapData}
                compact={false}
                showLegend={true}
                showStats={true}
              />
            </div>
          </div>
        )}

        {/* Welcome Message for New Users */}
        {!activeSession && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
              <span>Ready to boost your productivity?</span>
              <span className="animate-pulse">🚀</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}