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
const ACTION_ARROWS = ['\u25F0', '\u25F1', '\u25F3', '\u25F2']; // Cryptic quadrants: ◰, ◱, ◳, ◲
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

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const toggleRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    canvasRef.current = renderer.domElement;

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

    // --- SIGNAL EMISSIONS (REMOVED) ---
    // User requested pure topography without rolling particles.
    // Removed SignalSpark interface and creation logic.

    // Create optimizers at different starting positions (very slow for watching)
    // let currentSparkIndex = 0; // Removed particle logic

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

      // --- SPARK UPDATES (REMOVED) ---
      // User requested pure topography.

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

      // Dispose resources

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

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="learning-container">
      <div ref={mountRef} className="learning-canvas-container" />

      {/* Record Button - Dev only */}
      {process.env.NODE_ENV !== 'production' && (
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <span className="record-icon" />
          {isRecording && <span className="record-time">{formatTime(recordingTime)}</span>}
        </button>
      )}

      {/* Training Metrics - Bottom Left (Commented Out per Request) */}
      {/* 
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
      */}

      {/* Signal Matrix - Bottom Right */}
      <div className="learning-grid-container">
        {/* <div className="matrix-title">SIGNAL MATRIX // Q-POLICY</div> */}
        <div
          className="q-matrix"
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
                className={`matrix-cell ${isAgent ? 'agent' : ''} ${isGoal ? 'goal' : ''} ${isObstacle ? 'obstacle' : ''}`}
                style={{
                  backgroundColor: isObstacle
                    ? undefined
                    : `rgba(255, 255, 255, ${intensity * 0.1})`,
                }}
              >
                {isGoal ? <div className="goal-beacon"></div> : isObstacle ? '\u2716' : isAgent ? <div className="agent-beacon"></div> :
                  bestAction >= 0 ? <span className="matrix-spark">{ACTION_ARROWS[bestAction]}</span> : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
