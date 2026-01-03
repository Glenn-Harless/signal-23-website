import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './TestLandingPage.css';

const LOG_MESSAGES = [
    "INITIALIZING NEURAL FABRIC...",
    "MAPPING SYNAPTIC PATHWAYS",
    "WEIGHTS_LEARNED: 0.823901",
    "NATURE_BIAS_DETECTED: 0.112",
    "ROOT_SYSTEM_EXPANDING...",
    "ALGORITHM_CONVERGENCE_NEAR",
    "SIGNAL_STRENGTH: 99.8%",
    "RECURSIVE_BRANCH_COMPLETE",
    "OPTIMIZING_AXONAL_FLOW",
    "EPOCH_42_SUCCESS",
    "DATA_STREAM_SYNCHRONIZED",
];

export const TestLandingPage: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Neural Network Simulation Logic
    useEffect(() => {
        if (!mountRef.current) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Vector Space Grid Geometry (Large scale for fly-through)
        const gridHelper = new THREE.GridHelper(200, 40, 0x444444, 0x222222);
        gridHelper.rotation.x = Math.PI / 2;
        scene.add(gridHelper);

        const gridHelper2 = new THREE.GridHelper(200, 40, 0x444444, 0x222222);
        gridHelper2.position.z = -50;
        gridHelper2.rotation.x = Math.PI / 2;
        scene.add(gridHelper2);

        // Data Points (aligned to grid with jitter)
        const points: THREE.Vector3[] = [];
        const gridSize = 12;
        const spacing = 4;
        for (let x = -gridSize; x <= gridSize; x++) {
            for (let y = -gridSize; y <= gridSize; y++) {
                if (Math.random() > 0.6) { // Increased density
                    const jitter = (Math.random() - 0.5) * 2;
                    points.push(new THREE.Vector3(
                        (x * spacing) + jitter,
                        (y * spacing) + jitter,
                        (Math.random() - 0.5) * 15
                    ));
                }
            }
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            transparent: true,
            opacity: 0.8
        });
        const nodes = new THREE.Points(geometry, material);
        scene.add(nodes);

        // Vector Lines (connecting data points)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1
        });
        const linesGroup = new THREE.Group();
        scene.add(linesGroup);

        const createSynapses = () => {
            linesGroup.clear();
            for (let i = 0; i < points.length; i++) {
                // Connect to a few nearest neighbors for a cleaner graph
                let connections = 0;
                for (let j = i + 1; j < points.length && connections < 4; j++) {
                    const dist = points[i].distanceTo(points[j]);
                    if (dist < 9) { // Increased radius
                        const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i], points[j]]);
                        const line = new THREE.Line(lineGeometry, lineMaterial);
                        linesGroup.add(line);
                        connections++;
                    }
                }
            }
        };
        createSynapses();

        // Resize handler using ResizeObserver for better containment
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        });

        if (mountRef.current) {
            resizeObserver.observe(mountRef.current);
        }

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            const time = Date.now() * 0.001;

            // Dynamic "Fly-Through" Camera Logic
            // Moves camera forward, then resets to create loop effect
            const isMobile = window.innerWidth < 768;
            camera.position.z = (isMobile ? 40 : 30) - (Math.sin(time * 0.2) * 10);

            // Complex multi-axis rotation with velocity variation
            const rotSpeedX = Math.sin(time * 0.1) * 0.1;
            const rotSpeedY = Math.cos(time * 0.15) * 0.1;
            const rotSpeedZ = Math.sin(time * 0.05) * 0.05;

            gridHelper.rotation.z = rotSpeedZ;
            gridHelper2.rotation.z = rotSpeedZ;
            nodes.rotation.x += 0.0005 + Math.abs(rotSpeedX * 0.01);
            nodes.rotation.y += 0.001 + Math.abs(rotSpeedY * 0.01);
            linesGroup.rotation.x += 0.0005 + Math.abs(rotSpeedX * 0.01);
            linesGroup.rotation.y += 0.001 + Math.abs(rotSpeedY * 0.01);

            // Reactive camera drift
            camera.position.x = Math.sin(time * 0.3) * 3;
            camera.position.y = Math.cos(time * 0.4) * 3;
            camera.lookAt(0, 0, -20); // Look "into" the distance

            // Pulsing effect - more prominent lines
            material.opacity = 0.5 + Math.sin(time) * 0.2;
            lineMaterial.opacity = 0.15 + Math.sin(time * 0.7) * 0.1;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            resizeObserver.disconnect();
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Algorithm Learning Logs simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => {
                const nextLog = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
                const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
                const updated = [...prev, `[${timestamp}] ${nextLog}`];
                // Limit to 10 on mobile, 20 on desktop to prevent overflow
                const limit = window.innerWidth < 768 ? 10 : 20;
                return updated.slice(-limit);
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="test-landing-container">
            <div ref={mountRef} className="nn-canvas" />

            <div className="test-hud">
                <div className="test-hud-top">
                    <div className="test-titles">
                        <h1 className="test-main-title">SIGNAL-23</h1>
                        {/* <div className="test-sub-status">NEURAL_ARRAY_ACTIVE // SYSTEM_LEARNING</div> */}
                    </div>
                    {/* <div className="test-stats font-mono text-[10px] opacity-40 text-right">
                        LATENCY: 12MS<br />
                        SOURCE: SIGNAL_23<br />
                        COORD: 34.7064 N, 137.5022 E
                    </div> */}
                </div>

                <div className="test-hud-bottom">
                    <div className="learning-logs" ref={logContainerRef}>
                        {logs.map((log, i) => (
                            <div key={i} className="log-entry">{log}</div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="nature-overlay">
                {/* Conceptual nature element - could be an SVG branch or leaf in background */}
                <svg width="400" height="400" viewBox="0 0 100 100">
                    <path d="M50,100 Q50,50 80,20 M50,100 Q50,60 20,30 M50,100 Q50,70 50,40"
                        stroke="white" strokeWidth="0.1" fill="none" opacity="0.5" />
                </svg>
            </div>
        </div>
    );
};
