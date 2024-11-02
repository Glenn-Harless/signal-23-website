import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { noiseShader, vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
}

export const Portal: React.FC<PortalProps> = ({ isMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    material?: THREE.ShaderMaterial;
    geometry?: THREE.PlaneGeometry;
  }>({});

  // Force a re-render when mounted to ensure proper initialization
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Ensure clean initialization
    if (sceneRef.current.renderer) {
      sceneRef.current.renderer.dispose();
    }
    if (sceneRef.current.geometry) {
      sceneRef.current.geometry.dispose();
    }
    if (sceneRef.current.material) {
      sceneRef.current.material.dispose();
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Wait for the canvas to be ready
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

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

    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    camera.position.z = 7;

    // Store references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      material,
      geometry
    };

    // Set initial state
    setIsInitialized(true);

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
        mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    let time = 0;
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      if (material) {
        material.uniforms.time.value = time;
        material.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);
        material.uniforms.isMobile.value = isMobile;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (camera && renderer && material) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        material.uniforms.resolution.value.set(width, height);
        material.uniforms.isMobile.value = width <= 768;
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }
      if (sceneRef.current.geometry) {
        sceneRef.current.geometry.dispose();
      }
      if (sceneRef.current.material) {
        sceneRef.current.material.dispose();
      }
    };
  }, [isMobile]); // Only re-initialize when isMobile changes

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full z-0"
    />
  );
};