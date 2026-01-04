import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './Tangle.css';

const QUANTUM_MESSAGES = [
  "|ψ⟩ = α|↑↓⟩ + β|↓↑⟩",
  "BELL STATE: |Φ+⟩",
  "CORRELATION: 0.9847",
  "DECOHERENCE: 10⁻⁹s",
  "FIDELITY: 99.2%",
  "CHANNEL: ENTANGLED",
  "SEPARATION: ∞",
  "SPIN: ±½ℏ",
  "PHASE: LOCKED",
  "EPR PAIR ACTIVE",
  "NONLOCAL LINK",
  "STATE COLLAPSE",
  "MEASUREMENT: |↑⟩",
  "MEASUREMENT: |↓⟩",
];

// Signal states - monochrome technical palette
const SIGNAL_STATES = [
  { color: 0xffffff, name: 'NOMINAL' },
  { color: 0x00ff66, name: 'INTERFERENCE' },
  { color: 0x3366ff, name: 'LOW_SIGNAL' },
  { color: 0xff3366, name: 'SIGNAL_BURST' },
];

export const Tangle: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [quantumState, setQuantumState] = useState(0);
  const [showText, setShowText] = useState(false);

  // Three.js visualization
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- SIGNAL TOPOLOGY (Pure Morphing) ---
    const signalTopology = (x: number, y: number, time: number) => {
      // Multiple overlapping waves for complex organic topography
      const wave1 = Math.sin(x * 0.06 + time * 0.4) * Math.cos(y * 0.05 + time * 0.3) * 8;
      const wave2 = Math.sin(y * 0.07 - time * 0.5) * Math.cos(x * 0.04 + time * 0.25) * 6;

      // Massive deep-space ripples
      const ripple1 = Math.sin((x + y) * 0.015 + time * 0.2) * 12;
      const ripple2 = Math.cos((x - y) * 0.02 - time * 0.15) * 10;

      // Distant geological peaks
      const mountains = Math.sin(x * 0.012) * Math.cos(y * 0.012) * 25;

      return wave1 + wave2 + ripple1 + ripple2 + mountains;
    };

    // Create curved grid
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5 // High visibility
    });

    const gridSize = 250; // Truly massive
    const gridDivisions = 100; // Ultra resolution
    const step = gridSize / gridDivisions;

    // Store line objects for updates
    const xLines: THREE.Line[] = [];
    const yLines: THREE.Line[] = [];

    // Create X-direction lines (Properly initialize X/Y vertices)
    for (let i = 0; i <= gridDivisions; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((gridDivisions + 1) * 3);
      const y = -gridSize / 2 + i * step;
      for (let j = 0; j <= gridDivisions; j++) {
        const x = -gridSize / 2 + j * step;
        positions[j * 3] = x;
        positions[j * 3 + 1] = y;
        positions[j * 3 + 2] = 0;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
      xLines.push(line);
    }

    // Create Y-direction lines (Properly initialize X/Y vertices)
    for (let i = 0; i <= gridDivisions; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((gridDivisions + 1) * 3);
      const x = -gridSize / 2 + i * step;
      for (let j = 0; j <= gridDivisions; j++) {
        const y = -gridSize / 2 + j * step;
        positions[j * 3] = x;
        positions[j * 3 + 1] = y;
        positions[j * 3 + 2] = 0;
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
      yLines.push(line);
    }

    // Update grid function
    const updateGrid = (time: number) => {
      const globalOpacity = 0.3 + Math.sin(time * 0.4) * 0.1; // Subtle breathing visibility

      xLines.forEach((line) => {
        const positions = line.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        for (let j = 0; j < count; j++) {
          const x = positions[j * 3];
          const y = positions[j * 3 + 1];
          positions[j * 3 + 2] = signalTopology(x, y, time);
        }
        line.geometry.attributes.position.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = globalOpacity;
      });

      yLines.forEach((line) => {
        const positions = line.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        for (let j = 0; j < count; j++) {
          const x = positions[j * 3];
          const y = positions[j * 3 + 1];
          positions[j * 3 + 2] = signalTopology(x, y, time);
        }
        line.geometry.attributes.position.needsUpdate = true;
        (line.material as THREE.LineBasicMaterial).opacity = globalOpacity;
      });
    };

    // Remove old scanLine and burst logic

    // Random state changes
    const stateChangeInterval = setInterval(() => {
      // Potentially change signal state colors here if needed
    }, 4000);

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Update grid
      updateGrid(time);

      // Camera movement - back to massive wide-angle
      const isMobile = window.innerWidth < 768;
      const camDist = isMobile ? 220 : 180;
      camera.position.x = Math.sin(time * 0.04) * 60;
      camera.position.y = -80 + Math.cos(time * 0.02) * 20;
      camera.position.z = camDist + Math.sin(time * 0.03) * 30;
      camera.lookAt(0, 15, 0);

      renderer.render(scene, camera);
    };
    animate();


    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      clearInterval(stateChangeInterval);

      // Dispose resources
      xLines.forEach(l => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      yLines.forEach(l => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      gridMaterial.dispose();

      scene.clear();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);


  // Quantum channel logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const msg = QUANTUM_MESSAGES[Math.floor(Math.random() * QUANTUM_MESSAGES.length)];
        const updated = [...prev, msg];
        return updated.slice(-8);
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="tangle-container">
      <div
        ref={mountRef}
        className="tangle-canvas-container"
        onClick={() => setShowText(prev => !prev)}
        style={{ cursor: 'pointer' }}
      />

      {/* Quantum Channel - Bottom Left */}
      {showText && (
        <div className="tangle-quantum-channel" ref={logContainerRef}>
          <div className="channel-title">QUANTUM CHANNEL // ENCRYPTED</div>
          {logs.map((log, i) => (
            <div key={i} className="channel-entry" style={{ opacity: 0.4 + (i / logs.length) * 0.6 }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
