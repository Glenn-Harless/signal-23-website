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

// Entangled state colors - muted to match grid aesthetic
const QUANTUM_STATES = [
  { color1: 0xccffea, color2: 0xccffea, name: 'SUPERPOSITION' },
  { color1: 0xffccd9, color2: 0xd9ccff, name: 'SPIN UP/DOWN' },
  { color1: 0xd9ccff, color2: 0xffccd9, name: 'SPIN DOWN/UP' },
  { color1: 0xffe6cc, color2: 0xffe6cc, name: 'ENTANGLED' },
  { color1: 0xccffff, color2: 0xffccff, name: 'BELL STATE Φ+' },
  { color1: 0xffccff, color2: 0xccffff, name: 'BELL STATE Φ-' },
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

      // Intensified gravitational wells
      const depth1 = -25 / (1 + dist1 * 0.12);
      const depth2 = -25 / (1 + dist2 * 0.12);

      // Entanglement ripples connecting the two
      const connectionWave = Math.sin(x * 0.15 + time) * Math.exp(-Math.abs(y) * 0.08) * 3;

      // Increased quantum fluctuations
      const fluctuation = Math.sin(x * 0.4 + time * 2.5) * Math.cos(y * 0.4 + time * 1.8) * 1.2;

      return depth1 + depth2 + connectionWave + fluctuation;
    };

    // Create curved grid
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15
    });

    const gridSize = 100;
    const gridDivisions = 50;
    const step = gridSize / gridDivisions;

    // Store line objects for updates
    const xLines: THREE.Line[] = [];
    const yLines: THREE.Line[] = [];

    // Create X-direction lines
    for (let i = 0; i <= gridDivisions; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array((gridDivisions + 1) * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, gridMaterial);
      gridGroup.add(line);
      xLines.push(line);
    }

    // Create Y-direction lines
    for (let i = 0; i <= gridDivisions; i++) {
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

    // --- ARTISTIC FIBER ATOM GENERATION ---
    const createFiberAtom = (colorIndex: 1 | 2) => {
      const group = new THREE.Group();
      const fiberCount = 8;
      const fibers: THREE.Line[] = [];

      for (let i = 0; i < fiberCount; i++) {
        const curvePoints: THREE.Vector3[] = [];
        const segments = 40;
        for (let j = 0; j <= segments; j++) {
          curvePoints.push(new THREE.Vector3(0, 0, 0));
        }

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array((segments + 1) * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
          color: QUANTUM_STATES[0][colorIndex === 1 ? 'color1' : 'color2'],
          transparent: true,
          opacity: 0.2 + Math.random() * 0.2, // Lowered opacity
          linewidth: 1
        });

        const line = new THREE.Line(geometry, material);
        group.add(line);
        fibers.push(line);
      }

      return { group, fibers };
    };

    const atom1 = createFiberAtom(1);
    const atom2 = createFiberAtom(2);
    scene.add(atom1.group);
    scene.add(atom2.group);

    const updateFiberAtom = (atom: { group: THREE.Group, fibers: THREE.Line[] }, x: number, y: number, z: number, time: number, seed: number) => {
      atom.group.position.set(x, y, z);
      atom.fibers.forEach((fiber, idx) => {
        const positions = fiber.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        const timeScale = 1.5 + seed * 0.5;

        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const angle = t * Math.PI * 4 + time * timeScale + idx * 0.5;
          const r = (2.5 + Math.sin(time * 0.8 + idx) * 0.8) * Math.sin(t * Math.PI);

          // Lissajous-inspired patterns
          positions[i * 3] = Math.sin(angle * (1 + seed * 0.2)) * r;
          positions[i * 3 + 1] = Math.cos(angle * (0.8 + seed * 0.3)) * r;
          positions[i * 3 + 2] = Math.sin(angle * 1.5 + time) * r * 0.5;
        }
        fiber.geometry.attributes.position.needsUpdate = true;
      });

      // Group rotation
      atom.group.rotation.y = time * 0.5;
      atom.group.rotation.z = time * 0.3;
    };

    // Inner glow (subtle soft point)
    const glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    const glowMaterial1 = new THREE.MeshBasicMaterial({ color: QUANTUM_STATES[0].color1, transparent: true, opacity: 0.1 }); // Tone down glow
    const glowMaterial2 = new THREE.MeshBasicMaterial({ color: QUANTUM_STATES[0].color2, transparent: true, opacity: 0.1 }); // Tone down glow
    const glow1 = new THREE.Mesh(glowGeometry, glowMaterial1);
    const glow2 = new THREE.Mesh(glowGeometry, glowMaterial2);
    scene.add(glow1);
    scene.add(glow2);

    // --- REFINED ENTANGLEMENT BRIDGE (Bundled Threads) ---
    const bridgeLineCount = 5;
    const bridgeLines: THREE.Line[] = [];
    const bridgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });

    for (let i = 0; i < bridgeLineCount; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(60 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, bridgeMaterial);
      scene.add(line);
      bridgeLines.push(line);
    }

    // Probability cloud particles
    const cloudCount = 800; // Increased
    const cloudGeometry = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudCount * 3);
    const cloudColors = new Float32Array(cloudCount * 3);
    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
    const cloudMaterial = new THREE.PointsMaterial({
      size: 0.25,
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    const probabilityCloud = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(probabilityCloud);


    // State change handler
    let currentStateIndex = 0;
    const updateColors = (stateIndex: number) => {
      const state = QUANTUM_STATES[stateIndex];
      atom1.fibers.forEach(f => {
        (f.material as THREE.LineBasicMaterial).color.setHex(state.color1);
      });
      atom2.fibers.forEach(f => {
        (f.material as THREE.LineBasicMaterial).color.setHex(state.color2);
      });
      glowMaterial1.color.setHex(state.color1);
      glowMaterial2.color.setHex(state.color2);
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
      const p1x = Math.sin(time * 0.7) * 28 + Math.sin(time * 1.3) * 10;
      const p1y = Math.cos(time * 0.5) * 18 + Math.sin(time * 0.9) * 6;

      // Particle 2 is entangled - mirrors/inverts particle 1's movement
      const p2x = -p1x;
      const p2y = -p1y;

      const p1z = spacetimeZ(p1x, p1y, time) + 8;
      const p2z = spacetimeZ(p2x, p2y, time) + 8;

      // Update Fiber Atoms
      updateFiberAtom(atom1, p1x, p1y, p1z, time, 0);
      updateFiberAtom(atom2, p2x, p2y, p2z, time, 1);

      // Update glows
      glow1.position.copy(atom1.group.position);
      glow2.position.copy(atom2.group.position);

      // Pulsing glow effect - more subtle
      const pulse = 0.08 + Math.sin(time * 4) * 0.03;
      glowMaterial1.opacity = pulse;
      glowMaterial2.opacity = pulse;

      // Update bridge bundled lines
      bridgeLines.forEach((line, idx) => {
        const positions = line.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;

        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const x = p1x + (p2x - p1x) * t;
          const baseY = p1y + (p2y - p1y) * t;
          const baseZ = p1z + (p2z - p1z) * t;

          // Per-line offset and vibration
          const offset = idx * 0.4;
          const vib = Math.sin(t * Math.PI * 4 + time * 5 + offset) * 1.5;
          const spiral = Math.sin(t * Math.PI * 2 + time * 2) * (1 - Math.abs(t - 0.5) * 2) * 3;

          positions[i * 3] = x;
          positions[i * 3 + 1] = baseY + vib;
          positions[i * 3 + 2] = baseZ + spiral;
        }
        line.geometry.attributes.position.needsUpdate = true;
      });

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

        // Swirling probability cloud - more chaotic "haze"
        const theta = (i * 0.2 + time * 3) * (isFirst ? 1 : -1);
        const phi = i * 0.1 + time * 1.2;
        const r = 3 + Math.sin(i * 0.5 + time * 4) * 4;

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
      const camDist = isMobile ? 110 : 85;
      camera.position.x = Math.sin(time * 0.08) * camDist * 0.6;
      camera.position.y = Math.cos(time * 0.06) * camDist * 0.4 - 20;
      camera.position.z = camDist + Math.sin(time * 0.12) * 20;
      camera.lookAt(0, 0, -10);

      renderer.render(scene, camera);
    };
    animate();


    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      clearInterval(stateChangeInterval);

      // Dispose resources
      [atom1, atom2].forEach(atom => {
        atom.fibers.forEach(f => {
          f.geometry.dispose();
          (f.material as THREE.Material).dispose();
        });
      });
      glowGeometry.dispose();
      glowMaterial1.dispose();
      glowMaterial2.dispose();
      bridgeLines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      xLines.forEach(l => l.geometry.dispose());
      yLines.forEach(l => l.geometry.dispose());
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
