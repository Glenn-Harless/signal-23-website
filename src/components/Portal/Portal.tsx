import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { noiseShader, vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
  onClick?: () => void;
}

export const Portal: React.FC<PortalProps> = ({ isMobile, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    console.log('Portal clicked');
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  // Initialize Three.js scene
  const initThree = useCallback(() => {
    if (!canvasRef.current) return;

    // Clean up existing instances
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    const geometry = new THREE.PlaneGeometry(16, 9, 128, 128);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        isMobile: { value: isMobile }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    materialRef.current = material;

    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      while(scene.children.length > 0) { 
        const object = scene.children[0];
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        scene.remove(object);
      }
    };
  }, [isMobile]);

  // Rest of your existing handlers...
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !materialRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    rendererRef.current.setSize(width, height);
    
    materialRef.current.uniforms.resolution.value.set(width, height);
    materialRef.current.uniforms.isMobile.value = width <= 768;
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

    timeRef.current += 0.01;
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth);
    mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
    }
  }, []);

  useEffect(() => {
    const cleanup = initThree();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      cleanup?.();
    };
  }, [initThree, handleMouseMove, handleTouchMove, handleResize, animate]);
  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
      />
      {/* Clickable portal area */}
      <div className="absolute inset-0 z-50">
        <div 
          className="absolute inset-0 w-full h-full flex items-center justify-center"
        >
          <div 
            className="relative cursor-pointer hover:bg-white/[0.03]"
            onClick={handleClick}
            style={{ 
              width: '400px',
              height: '500px',
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              zIndex: 100
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                           text-white/30 hover:text-white/50 text-sm font-mono transition-all duration-300 pointer-events-none">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};