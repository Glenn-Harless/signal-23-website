import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
  onClick?: () => void;
}

const createScene = (isMobile: boolean, canvas: HTMLCanvasElement) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
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
      isMobile: { value: isMobile },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  return { scene, camera, renderer, geometry, material, mesh };
};

export const Portal: React.FC<PortalProps> = ({ isMobile, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationRef = useRef<number>();
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const elapsedRef = useRef(0);

  const handleActivate = useCallback(
    (event: React.SyntheticEvent) => {
      if (!onClick) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onClick();
    },
    [onClick],
  );

  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !materialRef.current) {
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);

    materialRef.current.uniforms.resolution.value.set(width, height);
    materialRef.current.uniforms.isMobile.value = width <= 768;
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) {
      return;
    }

    elapsedRef.current += 0.01;
    materialRef.current.uniforms.time.value = elapsedRef.current;
    materialRef.current.uniforms.mouse.value.set(mousePositionRef.current.x, mousePositionRef.current.y);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return () => undefined;
    }

    const { scene, camera, renderer, geometry, material } = createScene(isMobile, canvasRef.current);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    materialRef.current = material;
    elapsedRef.current = 0;

    handleResize();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [animate, handleResize, isMobile]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current.x = event.clientX / window.innerWidth;
      mousePositionRef.current.y = 1 - event.clientY / window.innerHeight;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        mousePositionRef.current.x = event.touches[0].clientX / window.innerWidth;
        mousePositionRef.current.y = 1 - event.touches[0].clientY / window.innerHeight;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      <div className="absolute inset-0 z-50">
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <div
            className="relative cursor-pointer hover:bg-white/[0.03]"
            role="button"
            tabIndex={0}
            aria-label="Enter terminal"
            onClick={handleActivate}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleActivate(event);
              }
            }}
            style={{ width: '400px', height: '500px', transition: 'all 0.3s ease', zIndex: 100 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 text-sm font-mono transition-all duration-300 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
