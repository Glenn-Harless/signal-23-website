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
  "0x" + Math.random().toString(16).substring(2, 10).toUpperCase(),
  "SEPARATION: ∞",
  "SPIN: ±½ℏ",
  "PHASE: LOCKED",
  "EPR PAIR ACTIVE",
  "NONLOCAL LINK",
];

export const Tangle: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

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

    // Curved spacetime function - two gravitational wells for entangled particles
    const spacetimeZ = (x: number, y: number, time: number) => {
      // Two wells representing entangled particles
      const well1X = -20;
      const well2X = 20;
      const wellY = 0;

      const dist1 = Math.sqrt((x - well1X) ** 2 + (y - wellY) ** 2);
      const dist2 = Math.sqrt((x - well2X) ** 2 + (y - wellY) ** 2);

      // Gravitational wells
      const depth1 = -15 / (1 + dist1 * 0.15);
      const depth2 = -15 / (1 + dist2 * 0.15);

      // Entanglement ripples connecting the two
      const connectionWave = Math.sin(x * 0.1 + time) * Math.exp(-Math.abs(y) * 0.05) * 2;

      // Quantum fluctuations
      const fluctuation = Math.sin(x * 0.3 + time * 2) * Math.cos(y * 0.3 + time * 1.5) * 0.5;

      return depth1 + depth2 + connectionWave + fluctuation;
    };

    // Create curved grid
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.25
    });

    const gridSize = 80;
    const gridDivisions = 40;
    const step = gridSize / gridDivisions;

    // Store line objects for updates
    const xLines: THREE.Line[] = [];
    const yLines: THREE.Line[] = [];

    // Create X-direction lines
    for (let i = 0; i <= gridDivisions; i++) {
      const y = -gridSize / 2 + i * step;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((gridDivisions + 1) * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
      xLines.push(line);
    }

    // Create Y-direction lines
    for (let i = 0; i <= gridDivisions; i++) {
      const x = -gridSize / 2 + i * step;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((gridDivisions + 1) * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
      yLines.push(line);
    }

    // Update grid function
    const updateGrid = (time: number) => {
      xLines.forEach((line, i) => {
        const y = -gridSize / 2 + i * step;
        const positions = line.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j <= gridDivisions; j++) {
          const x = -gridSize / 2 + j * step;
          positions[j * 3] = x;
          positions[j * 3 + 1] = y;
          positions[j * 3 + 2] = spacetimeZ(x, y, time);
        }
        line.geometry.attributes.position.needsUpdate = true;
      });

      yLines.forEach((line, i) => {
        const x = -gridSize / 2 + i * step;
        const positions = line.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j <= gridDivisions; j++) {
          const y = -gridSize / 2 + j * step;
          positions[j * 3] = x;
          positions[j * 3 + 1] = y;
          positions[j * 3 + 2] = spacetimeZ(x, y, time);
        }
        line.geometry.attributes.position.needsUpdate = true;
      });
    };

    // Entangled particles
    const particleGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const particleMaterial1 = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.8
    });
    const particleMaterial2 = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.8
    });

    const particle1 = new THREE.Mesh(particleGeometry, particleMaterial1);
    const particle2 = new THREE.Mesh(particleGeometry, particleMaterial2);
    scene.add(particle1);
    scene.add(particle2);

    // Particle glow
    const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
    const glowMaterial1 = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.15
    });
    const glowMaterial2 = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.15
    });
    const glow1 = new THREE.Mesh(glowGeometry, glowMaterial1);
    const glow2 = new THREE.Mesh(glowGeometry, glowMaterial2);
    scene.add(glow1);
    scene.add(glow2);

    // Entanglement connection line
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionPositions = new Float32Array(100 * 3);
    connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.4
    });
    const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
    scene.add(connectionLine);

    // Quantum probability cloud particles
    const cloudCount = 200;
    const cloudGeometry = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudCount * 3);
    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    const cloudMaterial = new THREE.PointsMaterial({
      color: 0x00ff66,
      size: 0.3,
      transparent: true,
      opacity: 0.4
    });
    const probabilityCloud = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(probabilityCloud);

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

      // Update entangled particles - they move in correlated ways
      const oscillation = Math.sin(time * 0.8) * 5;
      const p1x = -20 + Math.sin(time * 0.5) * 3;
      const p2x = 20 - Math.sin(time * 0.5) * 3; // Opposite phase
      const p1y = oscillation;
      const p2y = -oscillation; // Entangled - opposite
      const p1z = spacetimeZ(p1x, p1y, time) + 5;
      const p2z = spacetimeZ(p2x, p2y, time) + 5;

      particle1.position.set(p1x, p1y, p1z);
      particle2.position.set(p2x, p2y, p2z);
      glow1.position.copy(particle1.position);
      glow2.position.copy(particle2.position);

      // Particle spin visualization
      particle1.rotation.y = time * 2;
      particle2.rotation.y = -time * 2; // Opposite spin

      // Pulsing glow
      const pulse = 0.1 + Math.sin(time * 3) * 0.08;
      glowMaterial1.opacity = pulse;
      glowMaterial2.opacity = pulse;
      const glowScale = 1 + Math.sin(time * 3) * 0.3;
      glow1.scale.setScalar(glowScale);
      glow2.scale.setScalar(glowScale);

      // Update connection line with wave
      const connPositions = connectionLine.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 100; i++) {
        const t = i / 99;
        const x = p1x + (p2x - p1x) * t;
        const baseY = p1y + (p2y - p1y) * t;
        const baseZ = p1z + (p2z - p1z) * t;
        // Add wave effect
        const waveY = Math.sin(t * Math.PI * 4 + time * 3) * 2 * Math.sin(t * Math.PI);
        const waveZ = Math.cos(t * Math.PI * 4 + time * 3) * 2 * Math.sin(t * Math.PI);
        connPositions[i * 3] = x;
        connPositions[i * 3 + 1] = baseY + waveY;
        connPositions[i * 3 + 2] = baseZ + waveZ;
      }
      connectionLine.geometry.attributes.position.needsUpdate = true;

      // Update probability cloud around both particles
      const cloudPos = probabilityCloud.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < cloudCount; i++) {
        const isFirst = i < cloudCount / 2;
        const baseX = isFirst ? p1x : p2x;
        const baseY = isFirst ? p1y : p2y;
        const baseZ = isFirst ? p1z : p2z;

        // Random positions in probability cloud
        const theta = (i * 0.1 + time) * (isFirst ? 1 : -1);
        const phi = i * 0.05 + time * 0.5;
        const r = 3 + Math.sin(i + time * 2) * 2;

        cloudPos[i * 3] = baseX + r * Math.sin(theta) * Math.cos(phi);
        cloudPos[i * 3 + 1] = baseY + r * Math.sin(theta) * Math.sin(phi);
        cloudPos[i * 3 + 2] = baseZ + r * Math.cos(theta);
      }
      probabilityCloud.geometry.attributes.position.needsUpdate = true;

      // Camera movement
      const isMobile = window.innerWidth < 768;
      const camDist = isMobile ? 80 : 60;
      camera.position.x = Math.sin(time * 0.1) * camDist * 0.5;
      camera.position.y = Math.cos(time * 0.08) * camDist * 0.3 - 20;
      camera.position.z = camDist + Math.sin(time * 0.15) * 10;
      camera.lookAt(0, 0, -5);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
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
      <div ref={mountRef} className="tangle-canvas-container" />

      {/* Quantum Channel - Bottom Left */}
      <div className="tangle-quantum-channel" ref={logContainerRef}>
        <div className="channel-title">QUANTUM CHANNEL // ENCRYPTED</div>
        {logs.map((log, i) => (
          <div key={i} className="channel-entry" style={{ opacity: 0.4 + (i / logs.length) * 0.6 }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
