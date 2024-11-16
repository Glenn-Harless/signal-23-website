import React, { useEffect, useRef, useState } from 'react';
import { createNoise3D } from 'simplex-noise';

interface GlitchOverlayProps {
  isActive: boolean;
  delay?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ 
  isActive, 
  delay = 1000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noise3D = createNoise3D();
  const [showEffect, setShowEffect] = useState(false);
  
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
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Static noise texture generation with varying intensity
    const generateNoiseTexture = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const intensity = Math.random();
        const value = intensity > 0.5 ? 255 * (intensity * 0.8) : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
        data[i + 3] = Math.random() * 35; // Slightly increased transparency variation
      }
      
      return imageData;
    };

    // Digital artifacts generation
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

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.width = Math.random() * 200 + 50;
        this.height = Math.random() * 2 + 1;
        this.lifetime = 0;
        this.maxLifetime = Math.random() * 60 + 30;
        this.type = Math.random() > 0.6 ? 'line' : Math.random() > 0.5 ? 'text' : 'interference';
        this.intensity = Math.random() * 0.7 + 0.3;
        
        if (this.type === 'text') {
          const texts = [
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
          this.text = texts[Math.floor(Math.random() * texts.length)];
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        const alpha = 1 - (this.lifetime / this.maxLifetime);
        ctx.globalAlpha = alpha * this.intensity;

        switch (this.type) {
          case 'line':
            // Horizontal static lines
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            break;
          case 'text':
            // Glitched text
            ctx.font = '12px monospace';
            ctx.fillStyle = '#ffffff';
            if (Math.random() > 0.8) { // Occasional text displacement
              ctx.fillText(this.text || '', this.x + Math.random() * 4 - 2, this.y);
            } else {
              ctx.fillText(this.text || '', this.x, this.y);
            }
            break;
          case 'interference':
            // Vertical interference patterns
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

    const artifacts: DigitalArtifact[] = [];
    let frame = 0;
    let noiseTexture = generateNoiseTexture();

    const animate = () => {
      frame++;
      
      // Base static effect with varying update rate
      if (frame % 2 === 0) {
        noiseTexture = generateNoiseTexture();
      }
      ctx.putImageData(noiseTexture, 0, 0);

      // Scanlines effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Random vertical displacement
      if (Math.random() > 0.95) {
        const sliceY = Math.random() * canvas.height;
        const sliceHeight = Math.random() * 50 + 10;
        const displacement = Math.random() * 20 - 10;
        
        const imageData = ctx.getImageData(0, sliceY, canvas.width, sliceHeight);
        ctx.putImageData(imageData, displacement, sliceY);
      }

      // Digital artifacts
      if (Math.random() > 0.95) {
        artifacts.push(new DigitalArtifact());
      }

      // Update and draw artifacts
      for (let i = artifacts.length - 1; i >= 0; i--) {
        const artifact = artifacts[i];
        if (!artifact.update()) {
          artifacts.splice(i, 1);
        } else {
          artifact.draw(ctx);
        }
      }

      // Intensity fluctuation effect
      if (Math.random() > 0.98) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const intensity = Math.random() * 0.4 + 0.6;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i + 1] = data[i + 2] = data[i] * intensity;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }

      requestAnimationFrame(animate);
    };

    const animation = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animation);
    };
  }, [showEffect]);
  
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