import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // red
        data[i + 1] = value; // green
        data[i + 2] = value; // blue
        data[i + 3] = 255;   // alpha
      }

      return imageData;
    };

    const drawSignal = (imageData) => {
      const data = imageData.data;
      const signalPhrase = "SIGNAL-23";
      const signalStart = Math.random() * (data.length / 4 - signalPhrase.length * 8);

      for (let i = 0; i < signalPhrase.length; i++) {
        const charCode = signalPhrase.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          const bit = (charCode >> j) & 1;
          const index = (signalStart + i * 8 + j) * 4;
          if (bit) {
            data[index] = 255;     // red
            data[index + 1] = 0;   // green
            data[index + 2] = 0;   // blue
          }
        }
      }
    };

    const animate = () => {
      const imageData = generateNoise();
      if (Math.random() < 0.1) {
        drawSignal(imageData);
      }
      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-8 text-white font-neo-brutalist">SIGNAL-23</h1>
        <div className="flex space-x-4">
          <button onClick={toggleAudio} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>
      <audio ref={audioRef} loop>
        <source src="/abridged_tim0.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;