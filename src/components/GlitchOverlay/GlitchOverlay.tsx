import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GlitchOverlayProps {
  isActive: boolean;
  delay?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ 
  isActive, 
  delay = 1000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showEffect, setShowEffect] = useState(false);
  const artifactsRef = useRef<DigitalArtifact[]>([]);
  const noiseTextureRef = useRef<ImageData | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();
  
  // Pre-generate text options
  const GLITCH_TEXTS = [
    'SIGNAL DETECTED',
    'DATA CORRUPTION',
    'WARNING',
    'TRANSMISSION ACTIVE',
    'DO NOT DISTURB',
    'THIS PLACE IS A MESSAGE',
    'THE DANGER IS STILL PRESENT',
    '01010101',
    'SIGNAL-3'
  ];

  // Memoized noise texture generation
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const intensity = Math.random();
      const value = intensity > 0.5 ? 255 * (intensity * 0.8) : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = Math.random() * 35;
    }
    
    return imageData;
  }, []);

  class DigitalArtifact {
    x: number;
    y: number;
    width: number;
    height: number;
    lifetime: number;
    maxLifetime: number;
    type: 'line' | 'text' | 'interference';
    intensity: number;
    text?: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.width = Math.random() * 200 + 50;
      this.height = Math.random() * 2 + 1;
      this.lifetime = 0;
      this.maxLifetime = Math.random() * 60 + 30;
      this.type = Math.random() > 0.6 ? 'line' : Math.random() > 0.5 ? 'text' : 'interference';
      this.intensity = Math.random() * 0.7 + 0.3;
      
      if (this.type === 'text') {
        this.text = GLITCH_TEXTS[Math.floor(Math.random() * GLITCH_TEXTS.length)];
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.lifetime / this.maxLifetime);
      ctx.globalAlpha = alpha * this.intensity;

      switch (this.type) {
        case 'line':
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          break;
        case 'text':
          ctx.font = '12px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(this.text || '', this.x, this.y);
          break;
        case 'interference':
          const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 100);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(this.x, this.y, 2, 100);
          break;
      }

      ctx.globalAlpha = 1;
    }

    update() {
      this.lifetime++;
      return this.lifetime < this.maxLifetime;
    }
  }

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowEffect(true);
      }, delay);
      
      return () => {
        clearTimeout(timer);
        setShowEffect(false);
      };
    } else {
      setShowEffect(false);
    }
  }, [isActive, delay]);

  useEffect(() => {
    if (!showEffect || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate noise texture on resize
      noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      frameRef.current++;
      
      // Update noise texture every other frame
      if (frameRef.current % 2 === 0) {
        noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
      }
      
      if (noiseTextureRef.current) {
        ctx.putImageData(noiseTextureRef.current, 0, 0);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Limit artifacts array size
      if (artifactsRef.current.length < 20 && Math.random() > 0.95) {
        artifactsRef.current.push(new DigitalArtifact(canvas));
      }

      // Update and draw artifacts
      artifactsRef.current = artifactsRef.current.filter(artifact => {
        if (artifact.update()) {
          artifact.draw(ctx);
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear artifacts on cleanup
      artifactsRef.current = [];
    };
  }, [showEffect, generateNoiseTexture]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 100,
        opacity: showEffect ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        mixBlendMode: 'screen'
      }}
    />
  );
};