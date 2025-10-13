// src/hooks/useSpotify.ts - Complete Spotify Integration Hook
'use client'

import { useState, useCallback, useEffect } from 'react'
import { SpotifyPlaybackState, SpotifyToken, Track } from '@/types/api'
import { useAuth } from '@/hooks/useAuth'

const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ')

interface SpotifyState {
  isConnected: boolean
  loading: boolean
  playback: SpotifyPlaybackState | null
  deviceId: string | null
  player: any | null
}

export function useSpotify() {
  const { user } = useAuth()
  const [state, setState] = useState<SpotifyState>({
    isConnected: false,
    loading: false,
    playback: null,
    deviceId: null,
    player: null,
  })

  // Check if user has Spotify connected
  useEffect(() => {
    if (user) {
      checkSpotifyConnection()
    }
  }, [user])

  // Check for Spotify connection status from URL parameters
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const spotifyConnected = urlParams.get('spotify_connected')
      const spotifyError = urlParams.get('spotify_error')

      if (spotifyConnected === 'true') {
        // Spotify connected successfully, refresh connection status
        setState(prev => ({ ...prev, loading: false }))
        await checkSpotifyConnection()
        
        // Initialize the Spotify player after successful connection
        setTimeout(() => {
          initializePlayer()
        }, 1000) // Small delay to ensure tokens are available
        
        // Clear URL parameters
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }

      if (spotifyError) {
        // Spotify connection failed
        setState(prev => ({ ...prev, loading: false }))
        console.error('Spotify connection error:', spotifyError)
        
        // Clear URL parameters
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }

    handleSpotifyCallback()
  }, [])

  const checkSpotifyConnection = async () => {
    try {
      const response = await fetch('/api/spotify/status')
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        isConnected: data.connected || false,
      }))

      // If connected and no player exists, initialize the player
      if (data.connected && !state.player) {
        console.log('Spotify is connected, initializing player...')
        setTimeout(() => {
          initializePlayer()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to check Spotify connection:', error)
    }
  }

  // Connect to Spotify
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      // Get auth URL
      const response = await fetch('/api/spotify/auth')
      const { auth_url } = await response.json()

      // Redirect to Spotify auth (this will redirect back to callback)
      window.location.href = auth_url

    } catch (error) {
      console.error('Spotify connection failed:', error)
      setState(prev => ({ ...prev, loading: false }))
      throw error
    }
  }, [])

  // Initialize Spotify Web Playback SDK
  const initializePlayer = useCallback(async () => {
    if (!window.Spotify) {
      // Load Spotify SDK
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
      
      // Wait for SDK to load
      window.onSpotifyWebPlaybackSDKReady = () => {
        createPlayer()
      }
    } else {
      createPlayer()
    }
  }, [])

  const createPlayer = useCallback(async () => {
    try {
      // Get access token
      const tokenResponse = await fetch('/api/spotify/token')
      const { access_token } = await tokenResponse.json()

      const player = new window.Spotify.Player({
        name: 'DoroBuddy Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(access_token)
        },
        volume: 0.5
      })

      // Error handling
      player.addListener('initialization_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to initialize:', message)
      })

      player.addListener('authentication_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to authenticate:', message)
      })

      player.addListener('account_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to validate Spotify account:', message)
      })

      player.addListener('playback_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to perform playback:', message)
      })

      // Ready
      player.addListener('ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('Ready with Device ID', device_id)
        setState(prev => ({
          ...prev,
          deviceId: device_id,
          player: player,
        }))
      })

      // Not Ready
      player.addListener('not_ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('Device ID has gone offline', device_id)
        setState(prev => ({
          ...prev,
          deviceId: null,
        }))
      })

      // Player state changed
      player.addListener('player_state_changed', (state: any) => {
        if (!state) return

        const track = state.track_window.current_track
        
        setState(prev => ({
          ...prev,
          playback: {
            is_playing: !state.paused,
            track: track ? {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a: any) => a.name),
              duration_ms: track.duration_ms,
              progress_ms: state.position,
            } : undefined,
            device: {
              device_id: prev.deviceId || '',
              name: 'DoroBuddy Web Player',
              type: 'Computer',
              volume_percent: Math.round((state.volume || 0) * 100),
              is_active: true,
            }
          }
        }))
      })

      // Connect to the player
      const connected = await player.connect()
      
      if (!connected) {
        console.error('Failed to connect to Spotify player')
      }

    } catch (error) {
      console.error('Failed to create Spotify player:', error)
    }
  }, [])

  // Disconnect from Spotify
  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/spotify/disconnect', { method: 'POST' })
      
      if (state.player) {
        state.player.disconnect()
      }
      
      setState({
        isConnected: false,
        loading: false,
        playback: null,
        deviceId: null,
        player: null,
      })
    } catch (error) {
      console.error('Failed to disconnect from Spotify:', error)
    }
  }, [state.player])

  // Play music
  const play = useCallback(async (uri?: string) => {
    try {
      if (state.player) {
        await state.player.resume()
      } else {
        const body = uri ? { uris: [uri] } : {}
        await fetch('/api/spotify/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
    } catch (error) {
      console.error('Failed to play:', error)
    }
  }, [state.player])

  // Pause music
  const pause = useCallback(async () => {
    try {
      if (state.player) {
        await state.player.pause()
      } else {
        await fetch('/api/spotify/pause', { method: 'POST' })
      }
    } catch (error) {
      console.error('Failed to pause:', error)
    }
  }, [state.player])

  // Next track
  const next = useCallback(async () => {
    try {
      if (state.player) {
        await state.player.nextTrack()
      } else {
        await fetch('/api/spotify/next', { method: 'POST' })
      }
    } catch (error) {
      console.error('Failed to skip to next track:', error)
    }
  }, [state.player])

  // Previous track
  const previous = useCallback(async () => {
    try {
      if (state.player) {
        await state.player.previousTrack()
      } else {
        await fetch('/api/spotify/previous', { method: 'POST' })
      }
    } catch (error) {
      console.error('Failed to skip to previous track:', error)
    }
  }, [state.player])

  // Set volume (0-100)
  const setVolume = useCallback(async (volume: number) => {
    try {
      const normalizedVolume = Math.max(0, Math.min(100, volume)) / 100
      
      if (state.player) {
        await state.player.setVolume(normalizedVolume)
      } else {
        await fetch('/api/spotify/volume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volume: Math.round(normalizedVolume * 100) }),
        })
      }
    } catch (error) {
      console.error('Failed to set volume:', error)
    }
  }, [state.player])

  // Search tracks
  const search = useCallback(async (query: string, type = 'track', limit = 20) => {
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to search:', error)
      return { tracks: { items: [] } }
    }
  }, [])

  // Get current playback state
  const getCurrentState = useCallback(async () => {
    try {
      if (state.player) {
        const playerState = await state.player.getCurrentState()
        return playerState
      } else {
        const response = await fetch('/api/spotify/player')
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.error('Failed to get current state:', error)
      return null
    }
  }, [state.player])

  return {
    // State
    isConnected: state.isConnected,
    loading: state.loading,
    playback: state.playback,
    deviceId: state.deviceId,
    
    // Actions
    connect,
    disconnect,
    play,
    pause,
    next,
    previous,
    setVolume,
    search,
    getCurrentState,
    
    // Player instance (for advanced usage)
    player: state.player,
  }
}

// Utility function to generate random string for auth state
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}