import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './Nerve.css';

interface Node {
    position: THREE.Vector3;
    connections: number[];
    isCentral: boolean;
}

interface Pulse {
    startNodeIndex: number;
    endNodeIndex: number;
    progress: number;
    speed: number;
    color: THREE.Color;
}

export const Nerve: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Recording logic
    const toggleRecording = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const startRecording = () => {
        if (!canvasRef.current) return;
        try {
            const stream = canvasRef.current.captureStream(60);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 8000000
            });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nerve-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) { console.error('Recording failed:', err); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // --- Geometries and Materials ---
        const nodes: Node[] = [];
        const connections: { start: number, end: number }[] = [];

        // CENTRAL CLUSTER
        const centralCount = 100;
        for (let i = 0; i < centralCount; i++) {
            const pos = new THREE.Vector3(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 30
            );
            nodes.push({ position: pos, connections: [], isCentral: true });
        }

        // Connect central nodes
        for (let i = 0; i < centralCount; i++) {
            for (let j = i + 1; j < centralCount; j++) {
                if (nodes[i].position.distanceTo(nodes[j].position) < 15) {
                    nodes[i].connections.push(j);
                    nodes[j].connections.push(i);
                    connections.push({ start: i, end: j });
                }
            }
        }

        // TENDRILS
        const tendrilCount = 16;
        for (let t = 0; t < tendrilCount; t++) {
            let lastNodeIndex = Math.floor(Math.random() * centralCount);
            const direction = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            let length = 7 + Math.random() * 7;
            for (let segment = 0; segment < 10; segment++) {
                const lastPos = nodes[lastNodeIndex].position;
                const nextPos = lastPos.clone().add(
                    direction.clone().multiplyScalar(length)
                ).add(
                    new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(length * 0.4)
                );

                const newNodeIndex = nodes.length;
                nodes.push({ position: nextPos, connections: [], isCentral: false });
                nodes[lastNodeIndex].connections.push(newNodeIndex);
                nodes[newNodeIndex].connections.push(lastNodeIndex);
                connections.push({ start: lastNodeIndex, end: newNodeIndex });

                lastNodeIndex = newNodeIndex;
                length *= 0.85;
            }
        }

        // Draw the network with dynamic edge lighting
        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.6
        });

        const lineGeom = new THREE.BufferGeometry().setFromPoints(
            connections.flatMap(c => [nodes[c.start].position, nodes[c.end].position])
        );

        const edgeBrightness = new Float32Array(connections.length);
        const colorArr = new Float32Array(connections.length * 2 * 3);
        // Initialize with base brightness
        for (let i = 0; i < colorArr.length; i++) colorArr[i] = 0.2;
        lineGeom.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

        const networkLines = new THREE.LineSegments(lineGeom, lineMaterial);
        scene.add(networkLines);

        // Nodes visualization
        const nodeSprite = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'white');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        })();

        const centralNodeMat = new THREE.PointsMaterial({
            size: 2.1,
            map: nodeSprite,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const tendrilNodeMat = new THREE.PointsMaterial({
            size: 1.0,
            map: nodeSprite,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const centralPosArr = new Float32Array(nodes.filter(n => n.isCentral).flatMap(n => [n.position.x, n.position.y, n.position.z]));
        const tendrilPosArr = new Float32Array(nodes.filter(n => !n.isCentral).flatMap(n => [n.position.x, n.position.y, n.position.z]));

        const centralPointsGeom = new THREE.BufferGeometry();
        centralPointsGeom.setAttribute('position', new THREE.BufferAttribute(centralPosArr, 3));
        const centralPoints = new THREE.Points(centralPointsGeom, centralNodeMat);
        scene.add(centralPoints);

        const tendrilPointsGeom = new THREE.BufferGeometry();
        tendrilPointsGeom.setAttribute('position', new THREE.BufferAttribute(tendrilPosArr, 3));
        const tendrilPoints = new THREE.Points(tendrilPointsGeom, tendrilNodeMat);
        scene.add(tendrilPoints);

        // --- Thoughts Propagation ---
        let activePulses: Pulse[] = [];
        const pulseMax = 60;
        const pulseMaterial = new THREE.PointsMaterial({
            size: 2.5, // Fixed size
            map: nodeSprite,
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        // PRE-ALLOCATE pulse buffer to avoid memory leak
        const maxPulses = pulseMax;
        const pulsePosArr = new Float32Array(maxPulses * 3);
        const pulseGeom = new THREE.BufferGeometry();
        pulseGeom.setAttribute('position', new THREE.BufferAttribute(pulsePosArr, 3));
        pulseGeom.setDrawRange(0, 0); // Start with nothing drawn
        const pulsePoints = new THREE.Points(pulseGeom, pulseMaterial);
        scene.add(pulsePoints);

        const spawnPulse = () => {
            if (activePulses.length >= pulseMax) return;
            const startIndex = Math.floor(Math.random() * nodes.length);
            const node = nodes[startIndex];
            if (node.connections.length === 0) return;

            const endIndex = node.connections[Math.floor(Math.random() * node.connections.length)];
            activePulses.push({
                startNodeIndex: startIndex,
                endNodeIndex: endIndex,
                progress: 0,
                speed: 0.015 + Math.random() * 0.025,
                color: new THREE.Color(0xffffff)
            });
        };

        // --- Animation Loop ---
        let animationId: number;
        let seizureMode = false;
        let seizureCooldown = 0;
        let seizureTimeoutId: NodeJS.Timeout | null = null;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const time = Date.now() * 0.001;

            // Rotation
            scene.rotation.y += 0.003;
            scene.rotation.z += 0.0015;

            // Update edge brightness - REDUCED FREQUENCY
            for (let i = 0; i < connections.length; i++) {
                // Decay
                edgeBrightness[i] *= 0.94; // Faster decay

                // Random fire - much lower chance
                const fireChance = nodes[connections[i].start].isCentral ? 0.9997 : 0.9999;
                if (Math.random() > fireChance) {
                    edgeBrightness[i] = 1.0;
                }

                // Global seizure effect
                const b = seizureMode ? (0.6 + Math.random() * 0.4) : (0.15 + edgeBrightness[i] * 0.85);

                const cIdx = i * 6;
                colorArr[cIdx] = colorArr[cIdx + 1] = colorArr[cIdx + 2] = b;
                colorArr[cIdx + 3] = colorArr[cIdx + 4] = colorArr[cIdx + 5] = b;
            }
            lineGeom.attributes.color.needsUpdate = true;

            // Update pulses
            activePulses.forEach((p, i) => {
                p.progress += p.speed;
                if (p.progress >= 1) {
                    // Chain pulse?
                    const lastNode = nodes[p.endNodeIndex];
                    if (lastNode.connections.length > 0 && Math.random() > 0.3) {
                        p.startNodeIndex = p.endNodeIndex;
                        p.endNodeIndex = lastNode.connections[Math.floor(Math.random() * lastNode.connections.length)];
                        p.progress = 0;
                    } else {
                        activePulses.splice(i, 1);
                    }
                }
            });

            // Occasional spawn
            if (Math.random() > 0.94) spawnPulse();

            // Update pulse geometry - REUSE pre-allocated buffer
            const posArray = pulseGeom.attributes.position.array as Float32Array;
            activePulses.forEach((p, i) => {
                const start = nodes[p.startNodeIndex].position;
                const end = nodes[p.endNodeIndex].position;
                // Lerp without creating new Vector3
                const t = p.progress;
                posArray[i * 3] = start.x + (end.x - start.x) * t;
                posArray[i * 3 + 1] = start.y + (end.y - start.y) * t;
                posArray[i * 3 + 2] = start.z + (end.z - start.z) * t;
            });
            pulseGeom.attributes.position.needsUpdate = true;
            pulseGeom.setDrawRange(0, activePulses.length); // Only draw active pulses

            // Seizure Mode
            if (!seizureMode && Math.random() > 0.998 && seizureCooldown <= 0) {
                seizureMode = true;
                seizureTimeoutId = setTimeout(() => {
                    seizureMode = false;
                    seizureCooldown = 500;
                    seizureTimeoutId = null;
                }, 2000);
            }
            if (seizureCooldown > 0) seizureCooldown--;

            // Visual effects for nodes during seizure - NO SIZE CHANGES
            if (seizureMode) {
                centralNodeMat.opacity = 0.6 + Math.random() * 0.4;
                pulseMaterial.opacity = 0.6 + Math.random() * 0.4;
            } else {
                centralNodeMat.opacity = 0.9 + Math.sin(time * 2) * 0.1;
                pulseMaterial.opacity = 0.8 + Math.sin(time * 1.5) * 0.2;
            }

            camera.position.z = 115 + Math.sin(time * 0.4) * 15;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);

            // Clear seizure timeout
            if (seizureTimeoutId) clearTimeout(seizureTimeoutId);

            // Clear recording interval
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            // Disposal
            lineGeom.dispose();
            lineMaterial.dispose();
            centralPointsGeom.dispose();
            tendrilPointsGeom.dispose();
            centralNodeMat.dispose();
            tendrilNodeMat.dispose();
            pulseGeom.dispose();
            pulseMaterial.dispose();
            nodeSprite.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="nerve-container">
            <div ref={mountRef} className="nerve-canvas" />

            {/* Record Button */}
            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`nerve-record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                >
                    <span className="nerve-record-icon" />
                    {isRecording && <span className="nerve-record-time">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>}
                </button>
            )}
        </div>
    );
};
