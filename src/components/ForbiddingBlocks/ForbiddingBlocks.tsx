import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './ForbiddingBlocks.css';

export const ForbiddingBlocks: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

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
                videoBitsPerSecond: 12000000
            });

            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `forbidding-art-${Date.now()}.webm`;
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
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        }
    };

    const toggleRecording = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRecording) stopRecording();
        else startRecording();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth || window.innerWidth;
        const height = mountRef.current.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.FogExp2(0x000000, 0.0008); // Reduced density for better visibility

        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 4000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // --- Cinematic Lighting Orchestration ---
        const ambLight = new THREE.AmbientLight(0x444444, 1.2);
        scene.add(ambLight);

        // Primary Focused Spotlight
        const mainSpot = new THREE.SpotLight(0xffffff, 3000, 3000, Math.PI / 6, 0.8);
        mainSpot.position.set(0, 1500, 0);
        scene.add(mainSpot);

        // Rim Spotlight 1 (Cool)
        const rimSpot1 = new THREE.SpotLight(0x6a8f4c, 5000, 4000, Math.PI / 4, 0.5);
        rimSpot1.position.set(-1000, 400, -1000);
        scene.add(rimSpot1);

        // Rim Spotlight 2 (Neutral)
        const rimSpot2 = new THREE.SpotLight(0xffffff, 4000, 4000, Math.PI / 4, 0.5);
        rimSpot2.position.set(1000, 400, 1000);
        scene.add(rimSpot2);

        // Drifting Accent Lights
        const movingPoint1 = new THREE.PointLight(0x88b068, 1500, 1500);
        const movingPoint2 = new THREE.PointLight(0x6a8f4c, 1000, 1500);
        scene.add(movingPoint1, movingPoint2);

        // --- Geometric Elements: Monolith Field ---
        const monolithCount = 150; // Increased density
        const monoliths: { mesh: THREE.Mesh; wire: THREE.LineSegments; baseHeight: number; speed: number; offset: number }[] = [];
        const monolithGroup = new THREE.Group();

        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x444444, // Brighter base color
            roughness: 0.2,
            metalness: 0.9,
            flatShading: true
        });

        const wireMat = new THREE.LineBasicMaterial({ color: 0x88b068, transparent: true, opacity: 0.9 });

        for (let i = 0; i < monolithCount; i++) {
            const w = 20 + Math.random() * 40;
            const h = 100 + Math.random() * 400;
            const d = 20 + Math.random() * 40;

            const geo = new THREE.BoxGeometry(w, 1, d);
            const mesh = new THREE.Mesh(geo, wallMat);

            // Wireframe overlay
            const wireGeo = new THREE.EdgesGeometry(geo);
            const wire = new THREE.LineSegments(wireGeo, wireMat);

            const x = (Math.random() - 0.5) * 1200;
            const z = (Math.random() - 0.5) * 1200;

            mesh.position.set(x, 0, z);
            wire.position.set(x, 0, z);

            monolithGroup.add(mesh);
            monolithGroup.add(wire);

            monoliths.push({
                mesh,
                wire,
                baseHeight: h,
                speed: 0.2 + Math.random() * 0.5,
                offset: Math.random() * Math.PI * 2
            });
        }
        scene.add(monolithGroup);

        // --- Resonance Field (Particles) ---
        const particleCount = 2000;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            pPos[i] = (Math.random() - 0.5) * 2000;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

        const pMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        // --- Infinite Drift Camera ---
        camera.position.set(800, 400, 800);
        camera.lookAt(0, 0, 0);

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        if (mountRef.current) resizeObserver.observe(mountRef.current);

        let time = 0;
        const animate = () => {
            const frameId = requestAnimationFrame(animate);
            time += 0.002;

            // Camera Motion: Slow sweeping drift
            const rotSpeed = time * 0.15;
            camera.position.x = Math.sin(rotSpeed) * 900 + Math.cos(time * 0.3) * 100;
            camera.position.z = Math.cos(rotSpeed) * 900 + Math.sin(time * 0.2) * 100;
            camera.position.y = 300 + Math.sin(time * 0.4) * 150;
            camera.lookAt(0, 0, 0);

            // Animate Monoliths: Breathing heights
            monoliths.forEach(m => {
                const scaleY = m.baseHeight + Math.sin(time * m.speed + m.offset) * 50;
                m.mesh.scale.y = scaleY;
                m.wire.scale.y = scaleY;
                m.mesh.position.y = scaleY / 2;
                m.wire.position.y = scaleY / 2;

                // Subtle wireframe pulse
                (m.wire.material as THREE.LineBasicMaterial).opacity = 0.4 + Math.sin(time * 2 + m.offset) * 0.2;
            });

            // Animate Particles: Slow drift
            particles.rotation.y += 0.0005;
            particles.position.y = Math.sin(time * 0.2) * 20;

            // Animate Spotlight Rhythm
            mainSpot.intensity = 2500 + Math.sin(time * 0.5) * 500;

            // Orbiting Rim Lights for edge highlights
            rimSpot1.position.x = Math.sin(time * 0.3) * 1200;
            rimSpot1.position.z = Math.cos(time * 0.3) * 1200;

            rimSpot2.position.x = Math.sin(time * 0.4 + Math.PI) * 1200;
            rimSpot2.position.z = Math.cos(time * 0.4 + Math.PI) * 1200;

            // Animate Accent Lights
            movingPoint1.position.x = Math.sin(time * 0.8) * 600;
            movingPoint1.position.z = Math.cos(time * 0.6) * 600;
            movingPoint1.position.y = 200 + Math.sin(time * 0.5) * 100;

            movingPoint2.position.x = Math.cos(time * 0.7) * 800;
            movingPoint2.position.z = Math.sin(time * 0.9) * 800;
            movingPoint2.position.y = 300 + Math.cos(time * 0.4) * 150;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            resizeObserver.disconnect();
            if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
            wallMat.dispose();
            wireMat.dispose();
            pMat.dispose();
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div className="forbidding-container">
            <div ref={mountRef} className="blocks-canvas" />
            <div className="grain-overlay" />

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

            <div className="art-piece-watermark">FORBIDDING_BLOCKS // V_01</div>
        </div>
    );
};
