import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './Growth.css';

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

export const Growth: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [showText, setShowText] = useState(false);

    // Neural Network / Tree Simulation Logic
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

        // Helper to create a circular glow texture
        const createCircleTexture = () => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const context = canvas.getContext('2d');
            if (!context) return null;

            context.beginPath();
            context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            const gradient = context.createRadialGradient(
                size / 2, size / 2, 0,
                size / 2, size / 2, size / 2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            context.fillStyle = gradient;
            context.fill();

            return new THREE.CanvasTexture(canvas);
        };

        const circleTexture = createCircleTexture();

        // --- Tree Structure ---
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x888888, // Brighter grey
            transparent: true,
            opacity: 0.5
        });

        interface TreeNode {
            pos: THREE.Vector3;
            depth: number;
        }

        const treeNodes: TreeNode[] = [];
        const treeLines: THREE.Vector3[] = [];

        const generateTree = (
            start: THREE.Vector3,
            dir: THREE.Vector3,
            length: number,
            depth: number,
            maxDepth: number
        ) => {
            const end = start.clone().add(dir.clone().multiplyScalar(length));
            treeNodes.push({ pos: end, depth });

            treeLines.push(start);
            treeLines.push(end);

            if (depth < maxDepth) {
                const numBranches = Math.floor(Math.random() * 2) + 2;
                for (let i = 0; i < numBranches; i++) {
                    const nextDir = dir.clone();
                    // Organic branching angles
                    nextDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 1.2);
                    nextDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 1.2);
                    nextDir.normalize();
                    generateTree(end, nextDir, length * 0.75, depth + 1, maxDepth);
                }
            }
        };

        // Plant the much larger tree
        generateTree(new THREE.Vector3(0, -60, 0), new THREE.Vector3(0, 1, 0), 28, 0, 5);

        const treeGeom = new THREE.BufferGeometry().setFromPoints(treeLines);
        const treeMesh = new THREE.LineSegments(treeGeom, gridMaterial);
        scene.add(treeMesh);

        // --- Nodes (Buds) ---
        const outerNodes = treeNodes.filter(n => n.depth >= 4);
        const numPoints = outerNodes.length;
        const pointGeom = new THREE.BufferGeometry();
        const pointPositions = new Float32Array(numPoints * 3);

        outerNodes.forEach((node, i) => {
            pointPositions[i * 3] = node.pos.x;
            pointPositions[i * 3 + 1] = node.pos.y;
            pointPositions[i * 3 + 2] = node.pos.z;
        });

        pointGeom.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));

        const pointMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2.8, // Bigger nodes
            transparent: true,
            opacity: 0.9,
            map: circleTexture,
            alphaTest: 0.01,
            blending: THREE.AdditiveBlending
        });
        const nodes = new THREE.Points(pointGeom, pointMaterial);
        scene.add(nodes);

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
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            // Swaying effect
            const swayAmount = 0.03;
            treeMesh.rotation.z = Math.sin(time * 0.5) * swayAmount;
            nodes.rotation.z = Math.sin(time * 0.5) * swayAmount;
            treeMesh.rotation.x = Math.cos(time * 0.3) * swayAmount;
            nodes.rotation.x = Math.cos(time * 0.3) * swayAmount;

            const isMobile = window.innerWidth < 768;
            camera.position.x = Math.sin(time * 0.1) * 60;
            camera.position.y = 10 + Math.cos(time * 0.05) * 10;
            camera.position.z = isMobile ? 140 : 110;
            camera.lookAt(0, 0, 0);

            pointMaterial.opacity = 0.9 + Math.sin(time * 1.5) * 0.15;
            gridMaterial.opacity = 0.9 + Math.sin(time * 0.8) * 0.15;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();

            // Dispose texture
            if (circleTexture) circleTexture.dispose();

            // Dispose all scene objects
            scene.traverse((child) => {
                if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line || child instanceof THREE.LineSegments) {
                    disposeObject(child);
                }
            });

            scene.clear();

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
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
        <div className="growth-container" onClick={() => setShowText(prev => !prev)}>
            <div ref={mountRef} className="nn-canvas" />

            {showText && (
                <div className="test-hud">
                    {/* Bottom-Right Logs */}
                    <div className="test-hud-bottom">
                        <div className="learning-logs" ref={logContainerRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="log-entry">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
