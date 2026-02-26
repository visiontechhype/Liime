import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessageProps {
  mediaData?: string;
  duration?: number;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ mediaData, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (mediaData) {
      audioRef.current = new Audio(mediaData);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.pause();
      }
    };
  }, [mediaData]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 min-w-[150px]">
      <button 
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center hover:bg-white/30 dark:hover:bg-black/30 transition-colors"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 h-1 bg-white/30 dark:bg-black/30 rounded-full overflow-hidden relative">
        <div 
          className="absolute left-0 top-0 bottom-0 bg-white dark:bg-black rounded-full transition-all duration-100" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <span className="text-xs opacity-80">{duration}s</span>
    </div>
  );
};
