import React, { useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioSource: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  isPlaying, 
  onPlayPause, 
  audioSource 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button 
        onClick={onPlayPause} 
        className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        {isPlaying ? 
          <Pause className="w-8 h-8 text-white" /> : 
          <Play className="w-8 h-8 text-white" />
        }
      </button>
      <audio ref={audioRef} loop>
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};