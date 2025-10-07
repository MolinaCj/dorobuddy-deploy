// components/Music/FallbackPlayer.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';

const FALLBACK_PLAYLISTS = [
  {
    id: 'focus',
    name: 'Focus Sounds',
    tracks: [
      {
        id: 'focus1',
        name: 'Deep Focus',
        artist: 'Focus Sounds',
        duration: 180,
        url: '/audio/focus-sounds/deep-focus.mp3',
      },
    ],
  },
  {
    id: 'nature',
    name: 'Nature Sounds',
    tracks: [
      {
        id: 'nature1',
        name: 'Forest Ambience',
        artist: 'Nature Sounds',
        duration: 240,
        url: '/audio/ambient/forest.mp3',
      },
      {
        id: 'ocean1',
        name: 'Ocean Waves',
        artist: 'Nature Sounds',
        duration: 300,
        url: '/audio/ambient/ocean-waves.mp3',
      },
      {
        id: 'rain1',
        name: 'Rainfall',
        artist: 'Nature Sounds',
        duration: 200,
        url: '/audio/ambient/rain.wav',
      },
    ],
  },
  {
    id: 'ambient',
    name: 'Ambient Sounds',
    tracks: [
      {
        id: 'cafe1',
        name: 'Cafe',
        artist: 'Cafe Ambience',
        duration: 200,
        url: '/audio/ambient/cafe.mp3',
      },
    ],
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    tracks: [
      {
        id: 'whitenoise1',
        name: 'White Noise',
        artist: 'White Noise',
        duration: 200,
        url: '/audio/ambient/white-noise.mp3',
      },
    ],
  },
];

export function FallbackPlayer() {
  const [playlist] = useState(FALLBACK_PLAYLISTS.flatMap(p => p.tracks)); // flatten all tracks
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'track' | 'context'>('off');
  const [shuffle, setShuffle] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = playlist[currentIndex];

  // Play/Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Next track
  const handleNext = useCallback(() => {
    if (shuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex && playlist.length > 1);
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  }, [playlist, shuffle, currentIndex]);

  // Previous track
  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? playlist.length - 1 : prev - 1
    );
  };

  // Handle progress updates
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.currentTarget;
    setProgress((audio.currentTime / audio.duration) * 100 || 0);
  };

  // Handle end of track
  const handleEnded = () => {
    if (repeatMode === 'track') {
      audioRef.current?.play();
    } else if (repeatMode === 'context') {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  // Keep state in sync with <audio>
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      <h3 className="font-semibold mb-2">{currentTrack.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{currentTrack.artist}</p>

      <audio
        key={`${currentTrack.url}-${repeatMode}`} // force remount on track/repeat change
        ref={audioRef}
        src={currentTrack.url}
        preload="auto"
        autoPlay={isPlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        loop={repeatMode === 'track'}
      />

      {/* Progress bar */}
      <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="bg-blue-500 h-2 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button onClick={handlePrev} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
          <SkipBack className="w-5 h-5" />
        </button>

        <button onClick={togglePlay} className="p-3 rounded-full bg-blue-500 text-white">
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button onClick={handleNext} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Repeat & Shuffle */}
      <div className="flex items-center justify-center space-x-4 mt-3">
        <button
          onClick={() =>
            setRepeatMode((prev) =>
              prev === 'off' ? 'track' : prev === 'track' ? 'context' : 'off'
            )
          }
          className={`p-2 rounded-full ${repeatMode !== 'off' ? 'bg-blue-200' : 'bg-gray-200'}`}
        >
          <Repeat className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShuffle((s) => !s)}
          className={`p-2 rounded-full ${shuffle ? 'bg-blue-200' : 'bg-gray-200'}`}
        >
          <Shuffle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}