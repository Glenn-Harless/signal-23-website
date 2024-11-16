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
        className="w-96 h-96 rounded-full opacity-0 hover:opacity-5 transition-opacity cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {/* Optional: Very faint icon that appears on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? 
            <Pause className="w-16 h-16 text-white" /> : 
            <Play className="w-16 h-16 text-white" />
          }
        </div>
      </button>
      <audio ref={audioRef} loop>
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};