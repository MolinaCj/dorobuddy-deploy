'use client'

import { useEffect, useCallback } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useSpotify } from '@/hooks/useSpotify'

interface MusicSyncOptions {
  autoPlay?: boolean
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function useMusicSync(options: MusicSyncOptions = {}) {
  const { settings } = useSettings()
  const { 
    isConnected, 
    playback, 
    play, 
    pause, 
    search,
    loading 
  } = useSpotify()

  const { autoPlay = false, onPlayStateChange } = options

  // Get the appropriate track based on settings
  const getAmbientTrack = useCallback(() => {
    if (!settings?.ambient_sound || settings.ambient_sound === 'none') {
      return null
    }

    const ambientTracks = {
      deep: {
        name: 'Deep Focus',
        artist: 'Focus Sounds',
        spotifyQuery: 'deep focus ambient music',
        fallbackUrl: '/audio/focus-sounds/deep-focus.mp3'
      },
      rain: {
        name: 'Rain Sounds',
        artist: 'Nature Sounds',
        spotifyQuery: 'rain sounds ambient',
        fallbackUrl: '/audio/ambient/rain.wav'
      },
      forest: {
        name: 'Forest Ambience',
        artist: 'Nature Sounds',
        spotifyQuery: 'forest sounds ambient',
        fallbackUrl: '/audio/ambient/forest.mp3'
      },
      ocean: {
        name: 'Ocean Waves',
        artist: 'Nature Sounds',
        spotifyQuery: 'ocean waves ambient',
        fallbackUrl: '/audio/ambient/ocean-waves.mp3'
      },
      coffee: {
        name: 'Coffee Shop',
        artist: 'Ambient Sounds',
        spotifyQuery: 'coffee shop ambient',
        fallbackUrl: '/audio/ambient/coffee-shop.mp3'
      },
      fire: {
        name: 'Fireplace',
        artist: 'Ambient Sounds',
        spotifyQuery: 'fireplace crackling ambient',
        fallbackUrl: '/audio/ambient/fireplace.mp3'
      },
      white: {
        name: 'White Noise',
        artist: 'Ambient Sounds',
        spotifyQuery: 'white noise ambient',
        fallbackUrl: '/audio/ambient/white-noise.mp3'
      }
    }

    return ambientTracks[settings.ambient_sound as keyof typeof ambientTracks] || null
  }, [settings?.ambient_sound])

  // Sync music when settings change
  useEffect(() => {
    if (!settings) return

    const ambientTrack = getAmbientTrack()
    
    if (ambientTrack && isConnected && settings.spotify_enabled) {
      // If Spotify is enabled, search for the track
      search(ambientTrack.spotifyQuery, 'track', 1)
        .then((results) => {
          if (results && results.length > 0 && autoPlay) {
            // Auto-play the found track
            play(results[0].id)
            onPlayStateChange?.(true)
          }
        })
        .catch((error) => {
          console.error('Failed to search for ambient track:', error)
        })
    }
  }, [settings?.ambient_sound, settings?.spotify_enabled, isConnected, getAmbientTrack, search, play, autoPlay, onPlayStateChange])

  // Handle volume changes
  useEffect(() => {
    if (!settings) return

    // Apply volume settings to the music player
    const masterVolume = settings.master_volume || 1
    const musicVolume = settings.music_volume || 0.5
    const ambientVolume = settings.ambient_volume || 0.3
    
    // Calculate final volume
    const finalVolume = masterVolume * musicVolume * ambientVolume
    
    // Apply volume to audio elements (this would be handled by the music player components)
    console.log('Music volume updated:', finalVolume)
  }, [settings?.master_volume, settings?.music_volume, settings?.ambient_volume])

  return {
    ambientTrack: getAmbientTrack(),
    isSpotifyEnabled: settings?.spotify_enabled || false,
    isConnected,
    playback,
    loading,
    play,
    pause
  }
}
