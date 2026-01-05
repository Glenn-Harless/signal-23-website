import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Well.css';

// Custom Shader for Chromatic Aberration, Grain, and Vignette
const PostProcessShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 },
        "vignetteIntensity": { value: 0.5 },
        "vignetteRoundness": { value: 0.5 },
        "kaleidoscopeSegments": { value: 6.0 },
        "kaleidoscopeAngle": { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float vignetteIntensity;
        uniform float vignetteRoundness;
        uniform float kaleidoscopeSegments;
        uniform float kaleidoscopeAngle;
        varying vec2 vUv;

        float noise(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv - 0.5;
            
            // Kaleidoscope
            float r = length(uv);
            float a = atan(uv.y, uv.x) + kaleidoscopeAngle;
            float dau = 6.28318530718 / kaleidoscopeSegments;
            a = mod(a, dau);
            if (a > dau / 2.0) a = dau - a;
            uv = vec2(cos(a), sin(a)) * r;
            uv += 0.5;

            // Chromatic Aberration
            float dist = distance(uv, vec2(0.5));
            float offset = dist * 0.005;
            vec4 cr = texture2D(tDiffuse, uv + vec2(offset, 0.0));
            vec4 cg = texture2D(tDiffuse, uv);
            vec4 cb = texture2D(tDiffuse, uv - vec2(offset, 0.0));
            vec4 color = vec4(cr.r, cg.g, cb.b, cg.a);

            // Grain
            float n = (noise(uv + time) - 0.5) * 0.08;
            color.rgb += n;

            // Vignette
            float vignette = 1.0 - smoothstep(vignetteRoundness, 1.0, dist * vignetteIntensity);
            color.rgb *= vignette;

            gl_FragColor = color;
        }
    `
};

export const Well: React.FC = () => {
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
                a.download = `well-fractal-descent-${Date.now()}.webm`;
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
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);

        const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 8000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // --- Composer Setup ---
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.15;
        bloomPass.strength = 1.4;
        bloomPass.radius = 0.7;
        composer.addPass(bloomPass);

        const customPass = new ShaderPass(PostProcessShader);
        composer.addPass(customPass);

        // --- Materials ---
        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x222222, // Darker stone to better show colored lights
            roughness: 0.8,
            metalness: 0.2,
            flatShading: true,
            emissive: 0x050505,
        });

        const emissiveLineMat = new THREE.LineBasicMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        const techBlueMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        // Simplified glass material (MeshPhysicalMaterial with transmission is very GPU heavy)
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x222233,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.4,
            emissive: 0x001122,
            emissiveIntensity: 0.3
        });

        // --- Geometric Constants ---
        const LEVEL_HEIGHT = 200;
        const INITIAL_SIZE = 1600;
        const NUM_LEVELS = 10;

        const levels: {
            group: THREE.Group;
            lights: THREE.PointLight[];
            subElements: THREE.Object3D[];
        }[] = [];

        // Helper to add recursive sub-structures in quadrants
        const addRecursiveElements = (parent: THREE.Group, size: number, depth: number) => {
            if (depth <= 0) return;

            const qSize = size / 2;
            const subElements: THREE.Object3D[] = [];

            // Quadrant offsets
            const offsets = [
                { x: qSize / 2, z: qSize / 2 },
                { x: -qSize / 2, z: qSize / 2 },
                { x: qSize / 2, z: -qSize / 2 },
                { x: -qSize / 2, z: -qSize / 2 }
            ];

            offsets.forEach((offset, i) => {
                const qGroup = new THREE.Group();
                qGroup.position.set(offset.x, 0, offset.z);

                // Add a complex shape in each quadrant
                if (depth === 2) {
                    // Larger shapes in the first recursive layer
                    const octGeo = new THREE.OctahedronGeometry(qSize * 0.2);
                    const oct = new THREE.Mesh(octGeo, glassMat);

                    // Add wireframe
                    const edges = new THREE.EdgesGeometry(octGeo);
                    const line = new THREE.LineSegments(edges, emissiveLineMat);
                    oct.add(line);

                    qGroup.add(oct);
                    subElements.push(oct);

                    // Add a tiny pulsing core
                    const coreGeo = new THREE.IcosahedronGeometry(qSize * 0.05);
                    const core = new THREE.Mesh(coreGeo, techBlueMat);
                    oct.add(core);

                    // Add local lighting
                    if (Math.random() > 0.5) {
                        const pLight = new THREE.PointLight(0x00ffff, 500, qSize * 2);
                        qGroup.add(pLight);
                    }
                } else {
                    // Smaller fractal details
                    const torGeo = new THREE.TorusGeometry(qSize * 0.15, qSize * 0.02, 8, 24);
                    const tor = new THREE.Mesh(torGeo, stoneMat);
                    tor.rotation.x = Math.PI / 2;
                    qGroup.add(tor);
                    subElements.push(tor);
                }

                parent.add(qGroup);
            });

            return subElements;
        };

        const createLevelGroup = (y: number, size: number, index: number) => {
            const group = new THREE.Group();
            group.position.y = y;
            const levelLights: THREE.PointLight[] = [];
            const subElements: THREE.Object3D[] = [];

            // Frame setup
            const thickness = size * 0.15;
            const frameGeo = new THREE.BoxGeometry(size, 10, thickness);

            for (let i = 0; i < 4; i++) {
                const side = new THREE.Group();
                side.rotation.y = (Math.PI / 2) * i;

                // Beams with wireframes
                const beam = new THREE.Mesh(frameGeo, stoneMat);
                beam.position.z = -size / 2;
                side.add(beam);

                const edges = new THREE.EdgesGeometry(frameGeo);
                const line = new THREE.LineSegments(edges, emissiveLineMat);
                line.position.z = -size / 2;
                side.add(line);

                // Add vertical towers at the corners
                const towerGeo = new THREE.CylinderGeometry(thickness * 0.2, thickness * 0.2, LEVEL_HEIGHT, 4);
                const tower = new THREE.Mesh(towerGeo, stoneMat);
                tower.position.set(-size / 2, -LEVEL_HEIGHT / 2, -size / 2);
                side.add(tower);

                group.add(side);
            }

            // Central "Halving" Cross
            const crossGeo = new THREE.BoxGeometry(size, 4, 4);
            const crossH = new THREE.Mesh(crossGeo, stoneMat);
            const crossV = new THREE.Mesh(crossGeo, stoneMat);
            crossV.rotation.y = Math.PI / 2;
            group.add(crossH, crossV);

            // Add wireframe to crosses
            const crossEdges = new THREE.EdgesGeometry(crossGeo);
            const cl1 = new THREE.LineSegments(crossEdges, emissiveLineMat);
            const cl2 = new THREE.LineSegments(crossEdges, emissiveLineMat);
            cl2.rotation.y = Math.PI / 2;
            group.add(cl1, cl2);

            // Recursive Sub-structures in quadrants
            const fractals = addRecursiveElements(group, size, 2);
            if (fractals) subElements.push(...fractals);

            return { group, lights: levelLights, subElements };
        };

        // Initialize levels
        for (let i = 0; i < NUM_LEVELS; i++) {
            const data = createLevelGroup(-i * LEVEL_HEIGHT, INITIAL_SIZE, i);
            levels.push(data);
            scene.add(data.group);
        }

        // --- Global Lighting ---
        const ambLight = new THREE.AmbientLight(0x444444, 0.4); // Muted, slightly colored ambient
        scene.add(ambLight);

        // headlamp and voidGlow are now colored and cycling in animate()

        const headlamp = new THREE.PointLight(0x00ffff, 2000, 1500); // Start colored
        scene.add(headlamp);

        const voidGlow = new THREE.PointLight(0xff00ff, 10000, 4000); // Start colored
        scene.add(voidGlow);

        // --- Particles ---
        const createParticles = (count: number, color: number, size: number) => {
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count * 3; i++) {
                pos[i] = (Math.random() - 0.5) * 4000;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.3 });
            return new THREE.Points(geo, mat);
        };
        const dust = createParticles(800, 0xaaaaaa, 2);
        const embers = createParticles(200, 0xffaa44, 4);
        scene.add(dust, embers);

        camera.position.set(0, 0, 0);
        camera.lookAt(0, -100, 0);

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            composer.setSize(w, h);
        });
        if (mountRef.current) resizeObserver.observe(mountRef.current);

        let time = 0;
        let fallProgress = 0;
        let animationId: number;
        // Reusable color objects to avoid garbage collection
        const mainColor = new THREE.Color();
        const secondaryColor = new THREE.Color();

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            time += 0.01;
            fallProgress += 0.6;

            camera.position.y = -fallProgress;
            camera.position.x = Math.sin(time * 0.4) * 8;
            camera.position.z = Math.cos(time * 0.3) * 8;
            camera.rotation.z = Math.sin(time * 0.1) * 0.05;

            // Chromatic Lighting Update
            const hue = (time * 0.1) % 1;
            mainColor.setHSL(hue, 0.8, 0.5);
            secondaryColor.setHSL((hue + 0.3) % 1, 0.8, 0.5);

            headlamp.color.copy(mainColor);
            headlamp.position.set(
                camera.position.x,
                camera.position.y - 40, // Increased offset further
                camera.position.z
            );

            voidGlow.color.copy(secondaryColor);
            voidGlow.position.y = camera.position.y - 1000; // Pushed deeper
            voidGlow.intensity = 8000 + Math.sin(time * 2) * 2000;

            levels.forEach((data, lIdx) => {
                if (camera.position.y < data.group.position.y - LEVEL_HEIGHT) {
                    data.group.position.y -= LEVEL_HEIGHT * NUM_LEVELS;

                    data.subElements.forEach(el => {
                        el.rotation.x = Math.random() * Math.PI;
                        el.rotation.y = Math.random() * Math.PI;
                    });
                }

                // Animate sub-elements inside the levels
                data.subElements.forEach((el, eIdx) => {
                    el.rotation.x += 0.01 * (eIdx % 3 + 1);
                    el.rotation.y += 0.015 * (eIdx % 2 + 1);

                    const s = 1 + Math.sin(time * 2 + eIdx) * 0.1;
                    el.scale.set(s, s, s);
                });
            });

            // Particles
            dust.position.y = camera.position.y;
            embers.position.y = camera.position.y - 400;
            dust.rotation.y += 0.0002;
            embers.rotation.y += 0.001;

            // Kaleidoscope Animation
            customPass.uniforms.time.value = time;
            customPass.uniforms.kaleidoscopeAngle.value = time * 0.2;
            customPass.uniforms.kaleidoscopeSegments.value = 6.0 + Math.sin(time * 0.5);

            composer.render();
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();

            // Dispose all geometries and materials in scene
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                }
                if (obj instanceof THREE.Light) {
                    obj.dispose?.();
                }
            });

            // Dispose shared materials
            stoneMat.dispose();
            emissiveLineMat.dispose();
            techBlueMat.dispose();
            glassMat.dispose();

            // Clear scene
            scene.clear();

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            composer.dispose();
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
        <div className="well-container">
            <div ref={mountRef} className="well-canvas" />

            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    <span className="record-icon" />
                    {isRecording && <span className="record-time">{formatTime(recordingTime)}</span>}
                </button>
            )}

            <div className="art-piece-watermark">RECURSIVE_DESCENT // FRACTAL_WELL_03</div>
        </div>
    );
};
