'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettings } from '@/hooks/useSettings'

interface AudioClip {
  id: string
  name: string
  url: string
  audio?: HTMLAudioElement
}

const DEFAULT_SOUNDS: AudioClip[] = [
  { id: 'bell', name: 'Bell', url: '/audio/sounds/bell.wav' },
  { id: 'chime', name: 'Chime', url: '/audio/sounds/chime.wav' },
  { id: 'ding', name: 'Ding', url: '/audio/sounds/ding.mp3' },
  { id: 'gong', name: 'Gong', url: '/audio/sounds/gong.mp3' },
  { id: 'message', name: 'Message Notification', url: '/audio/sounds/message-notif.mp3' },
]

const AMBIENT_SOUNDS: AudioClip[] = [
  { id: 'deep', name: 'Deep Focus', url: '/audio/ambient/deep-focus.mp3' },
  { id: 'rain', name: 'Rain', url: '/audio/ambient/rain.wav' },
  { id: 'forest', name: 'Forest', url: '/audio/ambient/forest.mp3' },
  { id: 'ocean', name: 'Ocean Waves', url: '/audio/ambient/ocean-waves.mp3' },
  { id: 'coffee', name: 'Coffee Shop', url: '/audio/ambient/cafe.mp3' },
  { id: 'fire', name: 'Fireplace', url: '/audio/ambient/fireplace.mp3' },
  { id: 'white', name: 'White Noise', url: '/audio/ambient/white-noise.mp3' },
]

export function useAudio() {
  const { settings } = useSettings()
  const [audioMap, setAudioMap] = useState<Map<string, HTMLAudioElement>>(new Map())
  const [loading, setLoading] = useState(false) // Always false - never block UI
  const [currentAmbientSound, setCurrentAmbientSound] = useState<string | null>(null)

  // Preload audio files (completely non-blocking)
  const preloadSounds = useCallback(async () => {
    try {
      // Preload all sounds in background without waiting
      const allSounds = [...DEFAULT_SOUNDS, ...AMBIENT_SOUNDS]
      
      allSounds.forEach(sound => {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = sound.url
        
        // Add error handling for individual audio files
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load audio file: ${sound.url}`, e)
        })
        
        audio.addEventListener('canplaythrough', () => {
          console.log(`Successfully loaded audio: ${sound.url}`)
        })
        
        // Add to map immediately, don't wait for loading
        setAudioMap(prev => new Map(prev).set(sound.id, audio))
      })
      
    } catch (error) {
      console.error('Error preloading sounds:', error)
    }
  }, [])

  // Play notification sound
  const playSound = useCallback(async (soundId: string, volume = 0.8) => {
    try {
      const audio = audioMap.get(soundId)
      if (!audio) {
        console.warn(`Sound ${soundId} not found`)
        return
      }

      // Reset audio to beginning
      audio.currentTime = 0
      audio.volume = Math.min(1, Math.max(0, volume * (settings?.master_volume || 1)))
      
      // Try to play, with fallback if audio isn't ready
      try {
        await audio.play()
      } catch (playError) {
        console.warn(`Failed to play ${soundId}, trying to reload:`, playError)
        // Try to reload the audio and play again
        audio.load()
        await audio.play()
      }
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [audioMap, settings?.master_volume])

  // Play ambient sound (looping)
  const playAmbientSound = useCallback(async (soundId: string, volume = 0.3) => {
    try {
      // Stop current ambient sound
      if (currentAmbientSound) {
        const currentAudio = audioMap.get(currentAmbientSound)
        if (currentAudio) {
          currentAudio.pause()
          currentAudio.currentTime = 0
        }
      }

      // Play new ambient sound
      const audio = audioMap.get(soundId)
      if (!audio) {
        console.warn(`Ambient sound ${soundId} not found`)
        return
      }

      audio.loop = true
      audio.volume = Math.min(1, Math.max(0, volume * (settings?.master_volume || 1)))
      
      await audio.play()
      setCurrentAmbientSound(soundId)
    } catch (error) {
      console.error('Error playing ambient sound:', error)
    }
  }, [audioMap, currentAmbientSound, settings?.master_volume])

  // Stop ambient sound
  const stopAmbientSound = useCallback(() => {
    if (currentAmbientSound) {
      const audio = audioMap.get(currentAmbientSound)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setCurrentAmbientSound(null)
    }
  }, [audioMap, currentAmbientSound])

  // Set ambient volume
  const setAmbientVolume = useCallback((volume: number) => {
    if (currentAmbientSound) {
      const audio = audioMap.get(currentAmbientSound)
      if (audio) {
        audio.volume = Math.min(1, Math.max(0, volume * (settings?.master_volume || 1)))
      }
    }
  }, [audioMap, currentAmbientSound, settings?.master_volume])

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds()
  }, [preloadSounds])

  // Update volumes when settings change
  useEffect(() => {
    if (currentAmbientSound && settings?.ambient_volume !== undefined) {
      setAmbientVolume(settings.ambient_volume)
    }
  }, [settings?.ambient_volume, settings?.master_volume, currentAmbientSound, setAmbientVolume])

  return {
    loading,
    availableSounds: DEFAULT_SOUNDS,
    availableAmbientSounds: AMBIENT_SOUNDS,
    currentAmbientSound,
    playSound,
    playAmbientSound,
    stopAmbientSound,
    setAmbientVolume,
    preloadSound: preloadSounds,
  }
}