import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './Learning.css';

// Q-Learning Grid World Configuration
const GRID_SIZE = 6;
const GOAL_POS = { x: 5, y: 5 };
const OBSTACLES = [
  { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 2 },
  { x: 4, y: 4 }, { x: 1, y: 4 }
];

// Actions: 0=up, 1=right, 2=down, 3=left
const ACTIONS = ['up', 'right', 'down', 'left'];
const ACTION_ARROWS = ['\u2191', '\u2192', '\u2193', '\u2190'];
const ACTION_DELTAS = [
  { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
];

interface QTable {
  [key: string]: number[];
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  lossDirection: 'up' | 'down' | 'stable';
  epsilon: number;
  qMax: number;
  reward: number;
  optimizerCount: number;
  converged: number;
}

export const Learning: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    epoch: 0,
    loss: 1.0,
    lossDirection: 'stable',
    epsilon: 1.0,
    qMax: 0,
    reward: 0,
    optimizerCount: 5,
    converged: 0
  });
  const [qTable, setQTable] = useState<QTable>({});
  const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });

  // Initialize Q-table
  useEffect(() => {
    const initQ: QTable = {};
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        initQ[`${x},${y}`] = [0, 0, 0, 0];
      }
    }
    setQTable(initQ);
  }, []);

  // Q-Learning simulation
  useEffect(() => {
    let pos = { x: 0, y: 0 };
    let epsilon = 1.0;
    const learningRate = 0.1;
    const discount = 0.95;
    let totalReward = 0;
    let episodeReward = 0;
    let epoch = 0;

    const qTableLocal: QTable = {};
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        qTableLocal[`${x},${y}`] = [0, 0, 0, 0];
      }
    }

    const isObstacle = (x: number, y: number) =>
      OBSTACLES.some(o => o.x === x && o.y === y);

    const isValid = (x: number, y: number) =>
      x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && !isObstacle(x, y);

    const getReward = (x: number, y: number) => {
      if (x === GOAL_POS.x && y === GOAL_POS.y) return 100;
      if (isObstacle(x, y)) return -10;
      return -1; // Small penalty for each step
    };

    const step = () => {
      epoch++;
      const key = `${pos.x},${pos.y}`;

      // Epsilon-greedy action selection
      let action: number;
      if (Math.random() < epsilon) {
        action = Math.floor(Math.random() * 4);
      } else {
        const qValues = qTableLocal[key];
        action = qValues.indexOf(Math.max(...qValues));
      }

      // Take action
      const delta = ACTION_DELTAS[action];
      let newX = pos.x + delta.x;
      let newY = pos.y + delta.y;

      // Boundary check
      if (!isValid(newX, newY)) {
        newX = pos.x;
        newY = pos.y;
      }

      const reward = getReward(newX, newY);
      episodeReward += reward;

      // Q-learning update
      const newKey = `${newX},${newY}`;
      const maxNextQ = Math.max(...qTableLocal[newKey]);
      qTableLocal[key][action] += learningRate * (
        reward + discount * maxNextQ - qTableLocal[key][action]
      );

      pos = { x: newX, y: newY };
      setAgentPos({ ...pos });

      // Update Q-table state periodically
      if (epoch % 5 === 0) {
        setQTable({ ...qTableLocal });
      }

      // Episode end - reached goal or too many steps
      if ((pos.x === GOAL_POS.x && pos.y === GOAL_POS.y) || epoch % 50 === 0) {
        totalReward += episodeReward;
        episodeReward = 0;
        pos = { x: Math.floor(Math.random() * 3), y: Math.floor(Math.random() * 3) };
        setAgentPos({ ...pos });

        // Decay epsilon
        epsilon = Math.max(0.05, epsilon * 0.995);
      }

      // Find max Q value
      let maxQ = 0;
      Object.values(qTableLocal).forEach(vals => {
        maxQ = Math.max(maxQ, ...vals);
      });

      setMetrics(prev => ({
        epoch,
        loss: prev.loss, // Will be updated by 3D visualization
        lossDirection: prev.lossDirection,
        epsilon: parseFloat(epsilon.toFixed(3)),
        qMax: parseFloat(maxQ.toFixed(2)),
        reward: episodeReward,
        optimizerCount: prev.optimizerCount,
        converged: prev.converged
      }));
    };

    const interval = setInterval(step, 100);
    return () => clearInterval(interval);
  }, []);

  // Three.js Loss Landscape Visualization
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Loss landscape function - multiple local minima
    const lossFunction = (x: number, y: number, time: number) => {
      // Global minimum at origin
      const globalMin = 0.5 * (x * x + y * y);

      // Local minima
      const local1 = 3 * Math.exp(-((x + 15) ** 2 + (y - 10) ** 2) / 50);
      const local2 = 4 * Math.exp(-((x - 12) ** 2 + (y + 8) ** 2) / 40);
      const local3 = 2.5 * Math.exp(-((x - 8) ** 2 + (y - 15) ** 2) / 60);

      // Saddle point region
      const saddle = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 3;

      // Gentle time-based fluctuation (loss landscape "breathing")
      const fluctuation = Math.sin(time * 0.5) * 0.3;

      // Combine: inverted because we want valleys for minima
      const rawLoss = globalMin * 0.08 - local1 - local2 - local3 + saddle + fluctuation;

      return rawLoss;
    };

    // Create landscape mesh
    const landscapeSize = 60;
    const landscapeRes = 80;
    const landscapeGeometry = new THREE.PlaneGeometry(
      landscapeSize, landscapeSize, landscapeRes, landscapeRes
    );

    const landscapeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    const landscape = new THREE.Mesh(landscapeGeometry, landscapeMaterial);
    landscape.rotation.x = -Math.PI / 2;
    scene.add(landscape);

    // Contour rings at different heights
    const contourGroup = new THREE.Group();
    scene.add(contourGroup);

    const createContourRing = (height: number, color: number, opacity: number) => {
      const ringGeometry = new THREE.BufferGeometry();
      const points: number[] = [];
      const segments = 100;

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const radius = 8 + height * 3;
        points.push(
          Math.cos(angle) * radius,
          height * 2,
          Math.sin(angle) * radius
        );
      }

      ringGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const ringMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity
      });
      return new THREE.Line(ringGeometry, ringMaterial);
    };

    // Add contour lines
    for (let h = -3; h <= 3; h++) {
      const ring = createContourRing(h, 0xffffff, 0.15 + (3 - Math.abs(h)) * 0.05);
      contourGroup.add(ring);
    }

    // Optimizer particles (gradient descent agents) - sequential, one at a time
    interface Optimizer {
      mesh: THREE.Mesh;
      trail: THREE.Line;
      trailPositions: THREE.Vector3[];
      x: number;
      y: number;
      vx: number;
      vy: number;
      learningRate: number;
      converged: boolean;
      active: boolean;
      fadeOut: number; // 1.0 = visible, 0.0 = gone
      glow: THREE.Mesh;
    }

    const optimizers: Optimizer[] = [];
    const numOptimizers = 5;

    const createOptimizer = (startX: number, startY: number, lr: number, isActive: boolean) => {
      // Core particle - smaller, white
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isActive ? 0.9 : 0
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Glow - smaller
      const glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isActive ? 0.3 : 0
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);

      // Trail - white
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(150 * 3);
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isActive ? 0.3 : 0
      });
      const trail = new THREE.Line(trailGeometry, trailMaterial);

      scene.add(mesh);
      scene.add(glow);
      scene.add(trail);

      return {
        mesh,
        trail,
        trailPositions: [],
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        learningRate: lr,
        converged: false,
        active: isActive,
        fadeOut: isActive ? 1.0 : 0.0,
        glow
      };
    };

    // Create optimizers at different starting positions (very slow for watching)
    const startPositions = [
      { x: -22, y: -18, lr: 0.025 },
      { x: 20, y: -20, lr: 0.02 },
      { x: -18, y: 22, lr: 0.022 },
      { x: 22, y: 18, lr: 0.018 },
      { x: 0, y: -24, lr: 0.015 }
    ];

    startPositions.forEach((pos, idx) => {
      // Only first optimizer is active initially
      optimizers.push(createOptimizer(pos.x, pos.y, pos.lr, idx === 0));
    });

    let currentOptimizerIndex = 0;

    // Gradient calculation (numerical)
    const computeGradient = (x: number, y: number, time: number) => {
      const eps = 0.1;
      const dfdx = (lossFunction(x + eps, y, time) - lossFunction(x - eps, y, time)) / (2 * eps);
      const dfdy = (lossFunction(x, y + eps, time) - lossFunction(x, y - eps, time)) / (2 * eps);
      return { dx: dfdx, dy: dfdy };
    };

    // Update landscape geometry
    const updateLandscape = (time: number) => {
      const positions = landscapeGeometry.attributes.position.array as Float32Array;
      const halfSize = landscapeSize / 2;

      for (let i = 0; i <= landscapeRes; i++) {
        for (let j = 0; j <= landscapeRes; j++) {
          const idx = (i * (landscapeRes + 1) + j) * 3;
          const x = (j / landscapeRes) * landscapeSize - halfSize;
          const y = (i / landscapeRes) * landscapeSize - halfSize;
          positions[idx + 2] = lossFunction(x, y, time);
        }
      }
      landscapeGeometry.attributes.position.needsUpdate = true;
    };

    // Animation variables
    let animationId: number;
    let globalLoss = 1.0;
    let prevLoss = 1.0;
    let convergedCount = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Update landscape
      updateLandscape(time);

      // Update contours rotation
      contourGroup.rotation.y = time * 0.1;

      // Update optimizers - sequential, one at a time
      convergedCount = 0;
      let totalLoss = 0;
      let activeCount = 0;

      optimizers.forEach((opt, idx) => {
        // Only process active optimizer
        if (opt.active && !opt.converged) {
          activeCount++;

          // Compute gradient
          const grad = computeGradient(opt.x, opt.y, time);

          // Momentum - slower
          opt.vx = 0.85 * opt.vx - opt.learningRate * grad.dx;
          opt.vy = 0.85 * opt.vy - opt.learningRate * grad.dy;

          // Update position
          opt.x += opt.vx;
          opt.y += opt.vy;

          // Boundary check
          const bound = landscapeSize / 2 - 2;
          opt.x = Math.max(-bound, Math.min(bound, opt.x));
          opt.y = Math.max(-bound, Math.min(bound, opt.y));

          // Check convergence (reached center minimum)
          const distToCenter = Math.sqrt(opt.x * opt.x + opt.y * opt.y);
          const speed = Math.sqrt(opt.vx * opt.vx + opt.vy * opt.vy);

          if (speed < 0.008 || distToCenter < 3) {
            opt.converged = true;
          }
        }

        // Handle fade out for converged optimizers
        if (opt.converged && opt.fadeOut > 0) {
          opt.fadeOut -= 0.02; // Fade out speed

          const meshMat = opt.mesh.material as THREE.MeshBasicMaterial;
          const glowMat = opt.glow.material as THREE.MeshBasicMaterial;
          const trailMat = opt.trail.material as THREE.LineBasicMaterial;

          meshMat.opacity = opt.fadeOut * 0.9;
          glowMat.opacity = opt.fadeOut * 0.3;
          trailMat.opacity = opt.fadeOut * 0.3;

          // When fully faded, activate next optimizer
          if (opt.fadeOut <= 0) {
            opt.fadeOut = 0;
            convergedCount++;

            // Activate next optimizer
            const nextIdx = idx + 1;
            if (nextIdx < optimizers.length && !optimizers[nextIdx].active) {
              const nextOpt = optimizers[nextIdx];
              nextOpt.active = true;
              nextOpt.fadeOut = 1.0;

              const nextMeshMat = nextOpt.mesh.material as THREE.MeshBasicMaterial;
              const nextGlowMat = nextOpt.glow.material as THREE.MeshBasicMaterial;
              const nextTrailMat = nextOpt.trail.material as THREE.LineBasicMaterial;

              nextMeshMat.opacity = 0.9;
              nextGlowMat.opacity = 0.3;
              nextTrailMat.opacity = 0.3;
            }
          }
        } else if (opt.converged) {
          convergedCount++;
        }

        // Update mesh position for active/visible optimizers
        if (opt.fadeOut > 0 || opt.active) {
          const z = lossFunction(opt.x, opt.y, time);
          opt.mesh.position.set(opt.x, z + 1, opt.y);
          opt.glow.position.copy(opt.mesh.position);

          // Subtle pulse glow
          const pulse = 1 + Math.sin(time * 3 + idx) * 0.15;
          opt.glow.scale.setScalar(pulse);

          // Update trail
          if (opt.active && !opt.converged) {
            opt.trailPositions.unshift(opt.mesh.position.clone());
            if (opt.trailPositions.length > 50) opt.trailPositions.pop();
          }

          const trailArray = opt.trail.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < 50; i++) {
            if (i < opt.trailPositions.length) {
              trailArray[i * 3] = opt.trailPositions[i].x;
              trailArray[i * 3 + 1] = opt.trailPositions[i].y;
              trailArray[i * 3 + 2] = opt.trailPositions[i].z;
            }
          }
          opt.trail.geometry.attributes.position.needsUpdate = true;

          totalLoss += Math.abs(z);
        }
      });

      // Average loss of active optimizers
      globalLoss = activeCount > 0 ? totalLoss / activeCount : prevLoss;

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        loss: parseFloat(globalLoss.toFixed(4)),
        lossDirection: globalLoss < prevLoss ? 'down' : globalLoss > prevLoss ? 'up' : 'stable',
        optimizerCount: numOptimizers,
        converged: convergedCount
      }));
      prevLoss = globalLoss;

      // Reset all optimizers when all have converged and faded
      if (convergedCount === numOptimizers) {
        currentOptimizerIndex = 0;
        optimizers.forEach((opt, idx) => {
          const startPos = startPositions[idx];
          opt.x = startPos.x + (Math.random() - 0.5) * 8;
          opt.y = startPos.y + (Math.random() - 0.5) * 8;
          opt.vx = 0;
          opt.vy = 0;
          opt.converged = false;
          opt.active = idx === 0; // Only first is active
          opt.fadeOut = idx === 0 ? 1.0 : 0.0;
          opt.trailPositions = [];

          const meshMat = opt.mesh.material as THREE.MeshBasicMaterial;
          const glowMat = opt.glow.material as THREE.MeshBasicMaterial;
          const trailMat = opt.trail.material as THREE.LineBasicMaterial;

          meshMat.opacity = idx === 0 ? 0.9 : 0;
          glowMat.opacity = idx === 0 ? 0.3 : 0;
          trailMat.opacity = idx === 0 ? 0.3 : 0;
        });
      }

      // Camera orbit
      const camRadius = 55;
      camera.position.x = Math.sin(time * 0.15) * camRadius;
      camera.position.z = Math.cos(time * 0.15) * camRadius;
      camera.position.y = 35 + Math.sin(time * 0.1) * 5;
      camera.lookAt(0, -5, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);

      // Dispose of all geometries and materials to prevent GPU memory leaks
      landscapeGeometry.dispose();
      landscapeMaterial.dispose();

      // Dispose contour rings
      contourGroup.children.forEach(child => {
        if (child instanceof THREE.Line) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });

      // Dispose optimizer resources
      optimizers.forEach(opt => {
        opt.mesh.geometry.dispose();
        (opt.mesh.material as THREE.Material).dispose();
        opt.glow.geometry.dispose();
        (opt.glow.material as THREE.Material).dispose();
        opt.trail.geometry.dispose();
        (opt.trail.material as THREE.Material).dispose();
      });

      // Clean up scene
      scene.clear();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Get best action for a cell
  const getBestAction = (x: number, y: number): number => {
    const key = `${x},${y}`;
    const qValues = qTable[key];
    if (!qValues) return 0;
    const maxQ = Math.max(...qValues);
    if (maxQ === 0) return -1; // No learned preference yet
    return qValues.indexOf(maxQ);
  };

  // Get Q-value intensity for coloring
  const getQIntensity = (x: number, y: number): number => {
    const key = `${x},${y}`;
    const qValues = qTable[key];
    if (!qValues) return 0;
    const maxQ = Math.max(...qValues);
    return Math.min(1, maxQ / 50); // Normalize to 0-1
  };

  return (
    <div className="learning-container">
      <div ref={mountRef} className="learning-canvas-container" />

      {/* Training Metrics - Bottom Left */}
      <div className="learning-metrics">
        <div className="metric-entry">
          EPOCH: <span className="metric-value">{metrics.epoch}</span>
        </div>
        <div className="metric-entry">
          LOSS: <span className={`metric-value ${metrics.lossDirection === 'down' ? 'improving' : ''}`}>
            {metrics.loss.toFixed(4)} {metrics.lossDirection === 'down' ? '\u2193' : metrics.lossDirection === 'up' ? '\u2191' : '\u2194'}
          </span>
        </div>
        <div className="metric-entry">
          ε-GREEDY: <span className={`metric-value ${metrics.epsilon < 0.2 ? 'improving' : metrics.epsilon > 0.5 ? 'warning' : ''}`}>
            {metrics.epsilon.toFixed(3)}
          </span>
        </div>
        <div className="metric-entry">
          Q-MAX: <span className="metric-value">{metrics.qMax.toFixed(2)}</span>
        </div>
        <div className="metric-entry">
          OPTIMIZERS: <span className="metric-value">{metrics.converged}/{metrics.optimizerCount} CONVERGED</span>
        </div>
        <div className="metric-entry">
          REWARD: <span className={`metric-value ${metrics.reward > 0 ? 'improving' : ''}`}>
            {metrics.reward > 0 ? '+' : ''}{metrics.reward}
          </span>
        </div>
      </div>

      {/* Q-Learning Grid - Bottom Right */}
      <div className="learning-grid-container">
        <div
          className="q-grid"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);
            const isAgent = agentPos.x === x && agentPos.y === y;
            const isGoal = GOAL_POS.x === x && GOAL_POS.y === y;
            const isObstacle = OBSTACLES.some(o => o.x === x && o.y === y);
            const bestAction = getBestAction(x, y);
            const intensity = getQIntensity(x, y);

            return (
              <div
                key={idx}
                className={`q-cell ${isAgent ? 'agent' : ''} ${isGoal ? 'goal' : ''} ${isObstacle ? 'obstacle' : ''}`}
                style={{
                  backgroundColor: isObstacle
                    ? undefined
                    : `rgba(255, 255, 255, ${intensity * 0.3})`,
                }}
              >
                {isGoal ? '\u2605' : isObstacle ? '\u2716' : isAgent ? '\u25CF' :
                  bestAction >= 0 ? <span className="q-arrow">{ACTION_ARROWS[bestAction]}</span> : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
