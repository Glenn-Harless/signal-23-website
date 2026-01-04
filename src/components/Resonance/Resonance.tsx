import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './Resonance.css';

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

export const Resonance: React.FC = () => {
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

        // Hyperbolic Surface Parameters
        const hyperbolicZ = (r: number, theta: number, time: number) => {
            const amplitude = 8;
            const frequency = 2.5;
            const scale = 15;
            return Math.sinh(r / scale) * amplitude * Math.sin(theta * frequency + time * 0.5);
        };

        // Disposal Helper
        const disposeObject = (obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: any) => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        };

        // --- Persistent Grid Structures ---
        const gridGroup = new THREE.Group();
        scene.add(gridGroup);
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });

        const rings = 8;
        const segments = 64;
        const maxRadius = 60;
        const ringObjects: THREE.Line[] = [];
        const spokeObjects: THREE.Line[] = [];

        // Pre-initialize Rings
        for (let i = 1; i <= rings; i++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((segments + 1) * 3), 3));
            const ring = new THREE.Line(geo, gridMaterial);
            gridGroup.add(ring);
            ringObjects.push(ring);
        }

        // Pre-initialize Spokes
        const spokes = 12;
        const spokeSteps = 12;
        for (let i = 0; i < spokes; i++) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spokeSteps * 3), 3));
            const spoke = new THREE.Line(geo, gridMaterial);
            gridGroup.add(spoke);
            spokeObjects.push(spoke);
        }

        const updateGrid = (time: number) => {
            ringObjects.forEach((ring, i) => {
                const r = ((i + 1) / rings) * maxRadius;
                const positions = ring.geometry.attributes.position.array as Float32Array;
                for (let j = 0; j <= segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    positions[j * 3] = r * Math.cos(theta);
                    positions[j * 3 + 1] = r * Math.sin(theta);
                    positions[j * 3 + 2] = hyperbolicZ(r, theta, time);
                }
                ring.geometry.attributes.position.needsUpdate = true;
            });

            spokeObjects.forEach((spoke, i) => {
                const theta = (i / spokes) * Math.PI * 2;
                const positions = spoke.geometry.attributes.position.array as Float32Array;
                for (let step = 0; step < spokeSteps; step++) {
                    const r = (step / (spokeSteps - 1)) * maxRadius;
                    positions[step * 3] = r * Math.cos(theta);
                    positions[step * 3 + 1] = r * Math.sin(theta);
                    positions[step * 3 + 2] = hyperbolicZ(r, theta, time);
                }
                spoke.geometry.attributes.position.needsUpdate = true;
            });
        };

        // --- Persistent Point Cloud ---
        const numPoints = 150;
        const pointsData = Array.from({ length: numPoints }, () => ({
            r: Math.random() * 60,
            theta: Math.random() * Math.PI * 2,
            jitter: (Math.random() - 0.5) * 1.5,
            zOffset: (Math.random() - 0.5) * 2
        }));

        const pointGeom = new THREE.BufferGeometry();
        pointGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numPoints * 3), 3));
        const pointMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.8 });
        const nodes = new THREE.Points(pointGeom, pointMaterial);
        scene.add(nodes);

        // --- Consolidated Synapses ---
        const maxSynapses = 400;
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxSynapses * 2 * 3), 3));
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
        const synapses = new THREE.LineSegments(lineGeom, lineMaterial);
        scene.add(synapses);

        // Resize handler
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        });

        if (mountRef.current) resizeObserver.observe(mountRef.current);

        // Animation
        const animate = () => {
            const frameId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            updateGrid(time);

            // Update Points
            const positions = pointGeom.attributes.position.array as Float32Array;
            const currentVecs: THREE.Vector3[] = [];
            for (let i = 0; i < numPoints; i++) {
                const p = pointsData[i];
                const x = p.r * Math.cos(p.theta) + p.jitter;
                const y = p.r * Math.sin(p.theta) + p.jitter;
                const z = hyperbolicZ(p.r, p.theta, time) + p.zOffset;
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                currentVecs.push(new THREE.Vector3(x, y, z));
            }
            pointGeom.attributes.position.needsUpdate = true;

            // Update Synapses
            const linePositions = lineGeom.attributes.position.array as Float32Array;
            let lineIdx = 0;
            for (let i = 0; i < numPoints && lineIdx < maxSynapses; i++) {
                let connections = 0;
                for (let j = i + 1; j < numPoints && connections < 2 && lineIdx < maxSynapses; j++) {
                    const distSq = currentVecs[i].distanceToSquared(currentVecs[j]);
                    if (distSq < 100) {
                        linePositions[lineIdx * 6] = currentVecs[i].x;
                        linePositions[lineIdx * 6 + 1] = currentVecs[i].y;
                        linePositions[lineIdx * 6 + 2] = currentVecs[i].z;
                        linePositions[lineIdx * 6 + 3] = currentVecs[j].x;
                        linePositions[lineIdx * 6 + 4] = currentVecs[j].y;
                        linePositions[lineIdx * 6 + 5] = currentVecs[j].z;
                        lineIdx++;
                        connections++;
                    }
                }
            }
            for (let k = lineIdx; k < maxSynapses; k++) {
                linePositions[k * 6] = linePositions[k * 6 + 1] = linePositions[k * 6 + 2] = 0;
                linePositions[k * 6 + 3] = linePositions[k * 6 + 4] = linePositions[k * 6 + 5] = 0;
            }
            lineGeom.attributes.position.needsUpdate = true;

            const isMobile = window.innerWidth < 768;
            camera.position.x = Math.sin(time * 0.15) * 45 * (isMobile ? 1.5 : 1.0);
            camera.position.y = Math.cos(time * 0.1) * 35 * (isMobile ? 1.5 : 1.0);
            camera.position.z = 50 + Math.sin(time * 0.2) * 15;
            camera.lookAt(0, 0, 0);

            pointMaterial.opacity = 0.6 + Math.sin(time * 1.5) * 0.2;
            lineMaterial.opacity = 0.1 + Math.sin(time * 0.8) * 0.05;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            resizeObserver.disconnect();
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);

            scene.traverse((child) => {
                if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
                    disposeObject(child);
                }
            });
            renderer.dispose();
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
        <div className="resonance-container">
            <div ref={mountRef} className="nn-canvas" />

            <div className="test-hud">
                {/* Right Edge Side Title */}
                {/* 
                <div className="hud-side-title">
                    <h1 className="test-main-title">SIGNAL-3</h1>
                </div>
                */}

                {/* Bottom-Right Logs */}
                <div className="test-hud-bottom">
                    <div className="learning-logs" ref={logContainerRef}>
                        {logs.map((log, i) => (
                            <div key={i} className="log-entry">{log}</div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
