// src/types/spotify.ts - Spotify Web Playback SDK Types
export interface SpotifyApi {
  Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer
}

export interface SpotifyPlayerOptions {
  name: string
  getOAuthToken: (callback: (token: string) => void) => void
  volume?: number
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: unknown) => void): void
  removeListener(event: string, callback?: (data: unknown) => void): void
  getCurrentState(): Promise<SpotifyPlaybackState | null>
  setName(name: string): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(position_ms: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
  activateElement(): Promise<void>
}

export interface SpotifyPlaybackState {
  context: {
    uri: string
    metadata: Record<string, unknown>
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: SpotifyTrack
    next_tracks: SpotifyTrack[]
    previous_tracks: SpotifyTrack[]
  }
  volume: number
}

export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  is_playable: boolean
  media_type: string
  type: string
  uid: string
}

export interface SpotifyArtist {
  name: string
  uri: string
}

export interface SpotifyAlbum {
  name: string
  uri: string
  images: SpotifyImage[]
}

export interface SpotifyImage {
  url: string
  height: number
  width: number
}

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    Spotify: SpotifyApi
    onSpotifyWebPlaybackSDKReady: () => void
  }
}