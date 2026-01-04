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

// Entangled state colors - when one is measured, both change
const QUANTUM_STATES = [
  { color1: 0x00ff66, color2: 0x00ff66, name: 'SUPERPOSITION' },
  { color1: 0xff3366, color2: 0x3366ff, name: 'SPIN UP/DOWN' },
  { color1: 0x3366ff, color2: 0xff3366, name: 'SPIN DOWN/UP' },
  { color1: 0xffaa00, color2: 0xffaa00, name: 'ENTANGLED' },
  { color1: 0x00ffff, color2: 0xff00ff, name: 'BELL STATE Φ+' },
  { color1: 0xff00ff, color2: 0x00ffff, name: 'BELL STATE Φ-' },
];

export const Tangle: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [quantumState, setQuantumState] = useState(0);
  const [showText, setShowText] = useState(true);

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
      color: 0xffffff,
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

    // Entangled particles - core
    const particleGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const particleMaterial1 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color1,
      transparent: true,
      opacity: 0.9
    });
    const particleMaterial2 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color2,
      transparent: true,
      opacity: 0.9
    });

    const particle1 = new THREE.Mesh(particleGeometry, particleMaterial1);
    const particle2 = new THREE.Mesh(particleGeometry, particleMaterial2);
    scene.add(particle1);
    scene.add(particle2);

    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(2, 32, 32);
    const innerGlowMaterial1 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color1,
      transparent: true,
      opacity: 0.3
    });
    const innerGlowMaterial2 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color2,
      transparent: true,
      opacity: 0.3
    });
    const innerGlow1 = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial1);
    const innerGlow2 = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial2);
    scene.add(innerGlow1);
    scene.add(innerGlow2);

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(4, 32, 32);
    const outerGlowMaterial1 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color1,
      transparent: true,
      opacity: 0.1
    });
    const outerGlowMaterial2 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color2,
      transparent: true,
      opacity: 0.1
    });
    const outerGlow1 = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial1);
    const outerGlow2 = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial2);
    scene.add(outerGlow1);
    scene.add(outerGlow2);

    // Particle rings (orbital visualization)
    const ringGeometry = new THREE.TorusGeometry(3, 0.05, 16, 100);
    const ringMaterial1 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color1,
      transparent: true,
      opacity: 0.5
    });
    const ringMaterial2 = new THREE.MeshBasicMaterial({
      color: QUANTUM_STATES[0].color2,
      transparent: true,
      opacity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial1);
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial2);
    scene.add(ring1);
    scene.add(ring2);

    // Second set of rings (perpendicular)
    const ring1b = new THREE.Mesh(ringGeometry, ringMaterial1.clone());
    const ring2b = new THREE.Mesh(ringGeometry, ringMaterial2.clone());
    scene.add(ring1b);
    scene.add(ring2b);

    // Trail system for particles
    const trailLength = 50;
    const trailGeometry1 = new THREE.BufferGeometry();
    const trailGeometry2 = new THREE.BufferGeometry();
    const trailPositions1 = new Float32Array(trailLength * 3);
    const trailPositions2 = new Float32Array(trailLength * 3);
    trailGeometry1.setAttribute('position', new THREE.BufferAttribute(trailPositions1, 3));
    trailGeometry2.setAttribute('position', new THREE.BufferAttribute(trailPositions2, 3));
    const trailMaterial1 = new THREE.LineBasicMaterial({
      color: QUANTUM_STATES[0].color1,
      transparent: true,
      opacity: 0.3
    });
    const trailMaterial2 = new THREE.LineBasicMaterial({
      color: QUANTUM_STATES[0].color2,
      transparent: true,
      opacity: 0.3
    });
    const trail1 = new THREE.Line(trailGeometry1, trailMaterial1);
    const trail2 = new THREE.Line(trailGeometry2, trailMaterial2);
    scene.add(trail1);
    scene.add(trail2);

    // Trail history
    const trailHistory1: THREE.Vector3[] = [];
    const trailHistory2: THREE.Vector3[] = [];

    // Entanglement connection line
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionPositions = new Float32Array(100 * 3);
    connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    const connectionLine = new THREE.Line(connectionGeometry, connectionMaterial);
    scene.add(connectionLine);

    // Quantum probability cloud particles
    const cloudCount = 300;
    const cloudGeometry = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudCount * 3);
    const cloudColors = new Float32Array(cloudCount * 3);
    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
    const cloudMaterial = new THREE.PointsMaterial({
      size: 0.4,
      transparent: true,
      opacity: 0.6,
      vertexColors: true
    });
    const probabilityCloud = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(probabilityCloud);

    // Store materials for color updates
    const allMaterials1 = [particleMaterial1, innerGlowMaterial1, outerGlowMaterial1, ringMaterial1, ring1b.material as THREE.MeshBasicMaterial, trailMaterial1];
    const allMaterials2 = [particleMaterial2, innerGlowMaterial2, outerGlowMaterial2, ringMaterial2, ring2b.material as THREE.MeshBasicMaterial, trailMaterial2];

    // State change handler
    let currentStateIndex = 0;
    const updateColors = (stateIndex: number) => {
      const state = QUANTUM_STATES[stateIndex];
      allMaterials1.forEach(m => m.color.setHex(state.color1));
      allMaterials2.forEach(m => m.color.setHex(state.color2));
    };

    // Random state changes
    const stateChangeInterval = setInterval(() => {
      currentStateIndex = Math.floor(Math.random() * QUANTUM_STATES.length);
      updateColors(currentStateIndex);
    }, 2000 + Math.random() * 3000);

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

      // Dynamic entangled particle movement - Lissajous-like patterns that mirror
      // Particle 1 follows a complex path
      const p1x = Math.sin(time * 0.7) * 25 + Math.sin(time * 1.3) * 8;
      const p1y = Math.cos(time * 0.5) * 15 + Math.sin(time * 0.9) * 5;

      // Particle 2 is entangled - mirrors/inverts particle 1's movement
      const p2x = -p1x; // Mirror across center
      const p2y = -p1y; // Mirror across center

      const p1z = spacetimeZ(p1x, p1y, time) + 6;
      const p2z = spacetimeZ(p2x, p2y, time) + 6;

      particle1.position.set(p1x, p1y, p1z);
      particle2.position.set(p2x, p2y, p2z);

      // Update all glow layers
      innerGlow1.position.copy(particle1.position);
      innerGlow2.position.copy(particle2.position);
      outerGlow1.position.copy(particle1.position);
      outerGlow2.position.copy(particle2.position);

      // Particle spin - opposite rotations (entangled spins)
      particle1.rotation.x = time * 1.5;
      particle1.rotation.y = time * 2;
      particle2.rotation.x = -time * 1.5;
      particle2.rotation.y = -time * 2;

      // Pulsing glow effect
      const pulse1 = 0.2 + Math.sin(time * 4) * 0.15;
      const pulse2 = 0.08 + Math.sin(time * 4) * 0.06;
      innerGlowMaterial1.opacity = pulse1;
      innerGlowMaterial2.opacity = pulse1;
      outerGlowMaterial1.opacity = pulse2;
      outerGlowMaterial2.opacity = pulse2;

      // Breathing glow scale
      const breathe = 1 + Math.sin(time * 3) * 0.2;
      innerGlow1.scale.setScalar(breathe);
      innerGlow2.scale.setScalar(breathe);
      outerGlow1.scale.setScalar(breathe * 1.2);
      outerGlow2.scale.setScalar(breathe * 1.2);

      // Update orbital rings - they orbit around particles
      ring1.position.copy(particle1.position);
      ring2.position.copy(particle2.position);
      ring1.rotation.x = time * 2;
      ring1.rotation.y = time * 1.5;
      ring2.rotation.x = -time * 2; // Opposite rotation (entangled)
      ring2.rotation.y = -time * 1.5;

      ring1b.position.copy(particle1.position);
      ring2b.position.copy(particle2.position);
      ring1b.rotation.x = time * 1.5 + Math.PI / 2;
      ring1b.rotation.z = time * 2;
      ring2b.rotation.x = -time * 1.5 + Math.PI / 2;
      ring2b.rotation.z = -time * 2;

      // Update trails
      trailHistory1.unshift(particle1.position.clone());
      trailHistory2.unshift(particle2.position.clone());
      if (trailHistory1.length > trailLength) trailHistory1.pop();
      if (trailHistory2.length > trailLength) trailHistory2.pop();

      const trailPos1 = trail1.geometry.attributes.position.array as Float32Array;
      const trailPos2 = trail2.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < trailLength; i++) {
        if (i < trailHistory1.length) {
          trailPos1[i * 3] = trailHistory1[i].x;
          trailPos1[i * 3 + 1] = trailHistory1[i].y;
          trailPos1[i * 3 + 2] = trailHistory1[i].z;
        }
        if (i < trailHistory2.length) {
          trailPos2[i * 3] = trailHistory2[i].x;
          trailPos2[i * 3 + 1] = trailHistory2[i].y;
          trailPos2[i * 3 + 2] = trailHistory2[i].z;
        }
      }
      trail1.geometry.attributes.position.needsUpdate = true;
      trail2.geometry.attributes.position.needsUpdate = true;

      // Update connection line with wave
      const connPositions = connectionLine.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 100; i++) {
        const t = i / 99;
        const x = p1x + (p2x - p1x) * t;
        const baseY = p1y + (p2y - p1y) * t;
        const baseZ = p1z + (p2z - p1z) * t;
        // Add wave effect
        const waveAmp = Math.sin(t * Math.PI) * 3; // Envelope
        const waveY = Math.sin(t * Math.PI * 6 + time * 4) * waveAmp;
        const waveZ = Math.cos(t * Math.PI * 6 + time * 4) * waveAmp;
        connPositions[i * 3] = x;
        connPositions[i * 3 + 1] = baseY + waveY;
        connPositions[i * 3 + 2] = baseZ + waveZ;
      }
      connectionLine.geometry.attributes.position.needsUpdate = true;

      // Update probability cloud around both particles with color
      const cloudPos = probabilityCloud.geometry.attributes.position.array as Float32Array;
      const cloudCol = probabilityCloud.geometry.attributes.color.array as Float32Array;
      const state = QUANTUM_STATES[currentStateIndex];
      const color1 = new THREE.Color(state.color1);
      const color2 = new THREE.Color(state.color2);

      for (let i = 0; i < cloudCount; i++) {
        const isFirst = i < cloudCount / 2;
        const baseX = isFirst ? p1x : p2x;
        const baseY = isFirst ? p1y : p2y;
        const baseZ = isFirst ? p1z : p2z;
        const color = isFirst ? color1 : color2;

        // Swirling probability cloud
        const theta = (i * 0.15 + time * 2) * (isFirst ? 1 : -1);
        const phi = i * 0.08 + time * 0.8;
        const r = 2 + Math.sin(i * 0.5 + time * 3) * 3;

        cloudPos[i * 3] = baseX + r * Math.sin(theta) * Math.cos(phi);
        cloudPos[i * 3 + 1] = baseY + r * Math.sin(theta) * Math.sin(phi);
        cloudPos[i * 3 + 2] = baseZ + r * Math.cos(theta);

        cloudCol[i * 3] = color.r;
        cloudCol[i * 3 + 1] = color.g;
        cloudCol[i * 3 + 2] = color.b;
      }
      probabilityCloud.geometry.attributes.position.needsUpdate = true;
      probabilityCloud.geometry.attributes.color.needsUpdate = true;

      // Camera movement
      const isMobile = window.innerWidth < 768;
      const camDist = isMobile ? 90 : 70;
      camera.position.x = Math.sin(time * 0.08) * camDist * 0.6;
      camera.position.y = Math.cos(time * 0.06) * camDist * 0.4 - 15;
      camera.position.z = camDist + Math.sin(time * 0.12) * 15;
      camera.lookAt(0, 0, -5);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      clearInterval(stateChangeInterval);

      // Dispose of all geometries and materials to prevent GPU memory leaks
      particleGeometry.dispose();
      particleMaterial1.dispose();
      particleMaterial2.dispose();

      innerGlowGeometry.dispose();
      innerGlowMaterial1.dispose();
      innerGlowMaterial2.dispose();

      outerGlowGeometry.dispose();
      outerGlowMaterial1.dispose();
      outerGlowMaterial2.dispose();

      ringGeometry.dispose();
      ringMaterial1.dispose();
      ringMaterial2.dispose();
      (ring1b.material as THREE.Material).dispose();
      (ring2b.material as THREE.Material).dispose();

      trailGeometry1.dispose();
      trailGeometry2.dispose();
      trailMaterial1.dispose();
      trailMaterial2.dispose();

      connectionGeometry.dispose();
      connectionMaterial.dispose();

      cloudGeometry.dispose();
      cloudMaterial.dispose();

      // Dispose grid lines
      xLines.forEach(line => {
        line.geometry.dispose();
      });
      yLines.forEach(line => {
        line.geometry.dispose();
      });
      gridMaterial.dispose();

      // Clean up scene
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
