import React, { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { registerAudioElement } from '../../hooks/useAudio';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioSource: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, onPlayPause, audioSource }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) {
      return () => undefined;
    }

    const unregister = registerAudioElement(element);
    return () => unregister?.();
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Audio playback failed:', error);
      });
    }

    if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onPlayPause();
        }}
        className="w-96 h-96 rounded-full opacity-0 hover:opacity-5 transition-opacity cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? <Pause className="w-16 h-16 text-white" /> : <Play className="w-16 h-16 text-white" />}
        </div>
      </button>
      <audio ref={audioRef} loop preload="none">
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};
