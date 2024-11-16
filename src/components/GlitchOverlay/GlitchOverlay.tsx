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
    
    class Shape {
      x: number;
      y: number;
      size: number;
      t: number;
      angle: number;
      velocity: { x: number; y: number };
      lifespan: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.t = 1000;
        this.angle = 0;
        this.velocity = { x: 1, y: 0 };
        this.lifespan = Math.random() * 90 + 10;
      }
      
      draw() {
        const color = noise3D(this.x / 1000, this.y / 1000, this.t) * Math.sin(this.angle * 10) * 360;
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = `hsla(${color}, 100%, 70%, 0.8)`; // Increased saturation, lightness, and opacity
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 15, 0, Math.PI * 2); // Slightly larger particles
        ctx.fill();
        ctx.restore();
      }
      
      update(noiseDist: number) {
        this.x += (noise3D(this.x / noiseDist, this.y / noiseDist, this.t) + this.velocity.x) * 3;
        this.y += (noise3D(this.x / noiseDist, this.y / noiseDist, this.t) + this.velocity.y) * 3;
        this.t += 0.001;
        this.angle += 0.1;
        this.lifespan -= 1;
        
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        
        if (this.lifespan < 0) {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.lifespan = Math.random() * 90 + 10;
        }
      }
    }
    
    const shapes: Shape[] = [];
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000); // Increased particle count
    for (let i = 0; i < particleCount; i++) {
      shapes.push(new Shape(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }
    
    let noiseDist = 100;
    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Add a subtle background tint
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      shapes.forEach(shape => {
        shape.draw();
        shape.update(noiseDist);
      });
      
      // Enhanced glitch effect
      if (Math.random() < 0.3) {
        const sliceHeight = canvas.height / 50;
        for (let i = 0; i < 50; i++) {
          if (Math.random() > 0.5) continue;
          const y = sliceHeight * i;
          const imageData = ctx.getImageData(0, y, canvas.width, sliceHeight);
          const offset = Math.random() * 50 - 25; // Increased offset range
          
          ctx.save();
          ctx.globalCompositeOperation = 'lighten';
          ctx.globalAlpha = 0.9; // Increased opacity
          ctx.putImageData(imageData, offset, y);
          
          // Add a bright line at the slice edge
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
          
          ctx.restore();
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
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
        mixBlendMode: 'lighten'
      }}
    />
  );
};
