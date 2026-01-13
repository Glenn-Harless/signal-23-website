import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Forest.css';

import { createInstancedForest } from './InstancedForest';
import { createFireflies, updateFireflies } from './Fireflies';
import { ActiveTreeOverlay } from './ActiveTreeOverlay';

const Forest: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);

    const [isRecording, setIsRecording] = React.useState(false);
    const [recordingTime, setRecordingTime] = React.useState(0);
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
                videoBitsPerSecond: 8000000 // 8 Mbps for good quality
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
                a.download = `forest-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };

            mediaRecorderRef.current = recorder;
            recorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            setRecordingTime(0);

            // Timer for recording duration display
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

    useEffect(() => {
        if (!containerRef.current) return;

        // SCENE SETUP
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x000205); // Very deep blue-black
        scene.fog = new THREE.FogExp2(0x000205, 0.035); // Slightly thicker fog

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 10, 40); // Pull back slightly for more awe

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement; // Set canvas ref

        // INSTANCED FOREST
        const { mesh: forestMesh, treeData } = createInstancedForest(450, 6); // More dense
        scene.add(forestMesh);

        // FIREFLIES
        const fireflies = createFireflies(120); // Slightly fewer for focus
        scene.add(fireflies);

        // ACTIVE TREE OVERLAY
        const activeOverlay = new ActiveTreeOverlay();
        scene.add(activeOverlay.getGroup());

        // GROUND FOG LAYER
        const planeGeo = new THREE.PlaneGeometry(300, 300);
        const planeMat = new THREE.MeshBasicMaterial({
            color: 0x020408,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const groundFog = new THREE.Mesh(planeGeo, planeMat);
        groundFog.rotation.x = -Math.PI / 2;
        groundFog.position.y = 0.2;
        scene.add(groundFog);

        // POST PROCESSING
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        // TUNE BLOOM - Lower it significantly
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, 0.4, 0.85
        );
        composer.addPass(bloomPass);

        // ANIMATION LOOP
        const clock = new THREE.Clock();

        // Tracking tree activation cooldowns
        const treeCooldowns: Map<string, number> = new Map();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update Forest Shader Uniforms
            const forestMat = forestMesh.material as THREE.ShaderMaterial;
            forestMat.uniforms.uTime.value = elapsedTime;
            forestMat.uniforms.uWindIntensity.value = 0.05 + Math.sin(elapsedTime * 0.2) * 0.03;

            // Update Fireflies
            updateFireflies(fireflies, elapsedTime);

            // Update Trace animations
            activeOverlay.update(elapsedTime);

            // FIREFLY PROXIMITY LOGIC - Lower Frequency
            const fireflyPos = fireflies.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < 120; i++) {
                const fy = fireflyPos[i * 3 + 1];
                // Only particles near "ground"
                if (fy < 3.0) {
                    const fx = fireflyPos[i * 3];
                    const fz = fireflyPos[i * 3 + 2];

                    for (const tree of treeData) {
                        const cooldown = treeCooldowns.get(tree.id) || 0;
                        if (elapsedTime > cooldown) {
                            const dx = fx - tree.position.x;
                            const dz = fz - tree.position.z;
                            const distSq = dx * dx + dz * dz;

                            if (distSq < 1.0) { // Tighter activation radius
                                activeOverlay.tracePath(
                                    tree.position,
                                    tree.rotation,
                                    tree.scale,
                                    6,
                                    scene
                                );
                                // Prevent rapid re-activation - longer cooldown
                                treeCooldowns.set(tree.id, elapsedTime + 25);
                                break;
                            }
                        }
                    }
                }
            }

            composer.render();
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100vh', background: 'black', overflow: 'hidden' }}>
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
        </div>
    );
};

export default Forest;
