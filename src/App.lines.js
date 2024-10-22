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
    let time = 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawMonochromeForestPaths = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          
          // Create multiple layered sine waves for more complex patterns
          const pathPattern = 
            Math.sin(x * 0.02 + y * 0.02 + time) * 0.5 +         // Basic wave
            Math.sin(x * 0.01 - y * 0.03 + time * 1.5) * 0.3 +   // Slower crossing wave
            Math.sin((x + y) * 0.03 - time * 2) * 0.2;           // Diagonal wave
          
          // Add noise that varies with position and time
          const noise = Math.random() * 0.4; // Reduced noise intensity
          
          // Combine pattern and noise, normalize to 0-255 range
          const value = ((pathPattern + 1) * 0.5 * 0.7 + noise * 0.3) * 255;
          
          // Apply the same value to R, G, B for grayscale
          data[i] = value;     // red
          data[i + 1] = value; // green
          data[i + 2] = value; // blue
          data[i + 3] = 255;   // alpha
        }
      }

      // Add "signal" elements - brighter paths that appear occasionally
      const signalCount = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < signalCount; s++) {
        const signalY = Math.random() * canvas.height;
        const amplitude = Math.random() * 20 + 10;
        const frequency = Math.random() * 0.02 + 0.01;

        for (let x = 0; x < canvas.width; x++) {
          const y = signalY + Math.sin(x * frequency + time * 2) * amplitude;
          if (y >= 0 && y < canvas.height) {
            const i = (Math.floor(y) * canvas.width + x) * 4;
            // Make the signal path brighter
            data[i] = 255;     // red
            data[i + 1] = 255; // green
            data[i + 2] = 255; // blue
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const animate = () => {
      drawMonochromeForestPaths();
      time += 0.03; // Slowed down the time progression for more subtle movement
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