import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Birth.css';

export const Birth: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const toggleRecording = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRecording) stopRecording();
        else startRecording();
    };

    const startRecording = () => {
        if (!canvasRef.current) return;
        try {
            const stream = canvasRef.current.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 3000000 });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hand-${Date.now()}.webm`;
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
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            chunksRef.current = [];
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;

        let abortController = new AbortController();
        let loadedGltf: any = null;
        let isComponentMounted = true;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.035);

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 6;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.2;
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // Post-processing
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.8,   // strength - strong atmospheric glow
            0.9,   // radius - wide, soft spread
            0.15   // threshold - low so even dim elements bloom
        );
        composer.addPass(bloomPass);

        // Film grain + vignette pass
        const grainPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                grainIntensity: { value: 0.07 },
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
                uniform float grainIntensity;
                varying vec2 vUv;

                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
                }

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);

                    // Film grain
                    float grain = rand(vUv + fract(time)) * grainIntensity;
                    color.rgb += grain - grainIntensity * 0.5;

                    // Vignette
                    vec2 uv = vUv - 0.5;
                    float vig = 1.0 - dot(uv, uv) * 1.6;
                    color.rgb *= clamp(vig, 0.0, 1.0);

                    gl_FragColor = color;
                }
            `,
        });
        composer.addPass(grainPass);

        const handleContextLost = (event: Event) => {
            event.preventDefault();
            console.warn('WebGL context lost');
            if (animationId) cancelAnimationFrame(animationId);
        };

        const handleContextRestored = () => {
            console.log('WebGL context restored');
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
            if (!animationId && isComponentMounted) animate();
        };

        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

        // Spectral lighting
        const spectralLight = new THREE.PointLight(0x3355aa, 0.6, 12);
        spectralLight.position.set(0, 0.5, 3);
        scene.add(spectralLight);

        const backLight = new THREE.PointLight(0x1a1a3a, 0.3, 10);
        backLight.position.set(-2, -1, -3);
        scene.add(backLight);

        const ambientLight = new THREE.AmbientLight(0x080812, 0.4);
        scene.add(ambientLight);

        const handGroup = new THREE.Group();
        scene.add(handGroup);

        // Softer point sprite texture with blue tint falloff
        const nodeSprite = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d')!;
            const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            grad.addColorStop(0.08, 'rgba(255, 255, 255, 0.9)');
            grad.addColorStop(0.25, 'rgba(200, 220, 255, 0.35)');
            grad.addColorStop(0.5, 'rgba(150, 180, 255, 0.08)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 128, 128);
            return new THREE.CanvasTexture(canvas);
        })();

        const pointsMat = new THREE.PointsMaterial({
            size: 0.18,
            map: nodeSprite,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0xccddff
        });

        const accentMat = new THREE.PointsMaterial({
            size: 0.2,
            map: nodeSprite,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0x44ff88
        });

        const lineMat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.04,
            blending: THREE.AdditiveBlending
        });

        // Ghost mesh material (solid, translucent, responds to light)
        const ghostMat = new THREE.MeshPhongMaterial({
            color: 0x1a2a4a,
            emissive: 0x060a18,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            shininess: 40,
            specular: 0x2244aa,
        });

        // Very faint wireframe overlay - just a hint of structure
        const wireOverlayMat = new THREE.MeshBasicMaterial({
            color: 0x1a2a5a,
            transparent: true,
            opacity: 0.04,
            blending: THREE.AdditiveBlending,
            wireframe: true,
            depthWrite: false,
        });

        let bones: THREE.Bone[] = [];
        let mixer: THREE.AnimationMixer | null = null;
        let baseScale = 1;

        // Floating spectral particles
        const particleCount = 250;
        const particleGeom = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSpeeds = new Float32Array(particleCount);
        const particleDrifts = new Float32Array(particleCount * 2); // x and z drift

        for (let i = 0; i < particleCount; i++) {
            // Gaussian-ish distribution: denser near center
            const r1 = Math.random(), r2 = Math.random(), r3 = Math.random();
            particlePositions[i * 3] = (r1 + r2 - 1) * 5;
            particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            particlePositions[i * 3 + 2] = (r2 + r3 - 1) * 5;
            particleSpeeds[i] = 0.0008 + Math.random() * 0.0025;
            particleDrifts[i * 2] = (Math.random() - 0.5) * 0.0004;
            particleDrifts[i * 2 + 1] = (Math.random() - 0.5) * 0.0004;
        }

        particleGeom.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.035,
            map: nodeSprite,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0x556688,
        });
        const particles = new THREE.Points(particleGeom, particleMat);
        scene.add(particles);

        // Loading indicator
        const loadingGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const loadingMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
        const loadingCube = new THREE.Mesh(loadingGeom, loadingMat);
        scene.add(loadingCube);

        const loader = new GLTFLoader();
        const modelPath = '/models/skeleton_hand.glb';

        loader.load(
            modelPath,
            (gltf) => {
                if (abortController.signal.aborted || !isComponentMounted) return;

                loadedGltf = gltf;

                scene.remove(loadingCube);
                loadingGeom.dispose();
                loadingMat.dispose();

                const model = gltf.scene;
                handGroup.add(model);

                // Two-layer rendering: ghost body + faint wireframe hint
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Ghost layer - solid translucent mesh with lighting
                        const ghostClone = child.clone();
                        ghostClone.material = ghostMat;
                        if (child.parent) child.parent.add(ghostClone);
                        else handGroup.add(ghostClone);

                        // Very faint wireframe layer - just a whisper of structure
                        const wireClone = child.clone();
                        wireClone.material = wireOverlayMat;
                        if (child.parent) child.parent.add(wireClone);
                        else handGroup.add(wireClone);

                        // Hide original
                        child.visible = false;

                        if (!(child instanceof THREE.SkinnedMesh)) {
                            const p = new THREE.Points(child.geometry, pointsMat);
                            ghostClone.add(p);
                        }
                    }
                });

                // Joint nodes at bones
                handGroup.traverse((child) => {
                    if (child instanceof THREE.Bone) {
                        bones.push(child);

                        const jointNode = new THREE.Points(
                            new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
                            pointsMat
                        );
                        child.add(jointNode);
                    }
                });

                // Animation mixer
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                }

                // Centering
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                baseScale = 3.5 / maxDim;
                handGroup.scale.setScalar(baseScale);

                if (!isAnimating && isComponentMounted) {
                    isAnimating = true;
                    animate();
                }
            },
            undefined,
            (error) => {
                console.error('Error loading hand model:', error);
                loadingMat.color.setHex(0xff0000);
            }
        );

        // Animation state
        let animationId: number = 0;
        let isAnimating = false;

        // Pseudo-random for deterministic twitch
        const fract = (x: number) => x - Math.floor(x);
        const pseudoRand = (seed: number) => fract(Math.sin(seed * 12345.6789) * 43758.5453);

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            // Slow, deliberate rotation
            handGroup.rotation.y = time * 0.12;
            handGroup.rotation.x = Math.sin(time * 0.3) * 0.08 + 0.15;
            handGroup.position.y = Math.sin(time * 0.4) * 0.12;

            // Subtle breathing scale pulse
            const breathe = 1.0 + Math.sin(time * 0.6) * 0.008;
            handGroup.scale.setScalar(baseScale * breathe);

            // Occasional twitch
            const twitchWindow = Math.floor(time * 0.4);
            const twitchChance = pseudoRand(twitchWindow);
            if (twitchChance > 0.82) {
                const twitchPhase = (time * 0.4) - twitchWindow;
                const twitchDecay = Math.exp(-twitchPhase * 10) * 0.03;
                handGroup.rotation.z = twitchDecay * Math.sin(twitchPhase * 40);
            } else {
                handGroup.rotation.z *= 0.9; // decay back to 0
            }

            if (mixer) {
                mixer.update(0.016);
            }

            // Slow asymmetric finger clench: deliberate close, hold, release
            const baseSpeed = 0.7;
            const maxAngle = Math.PI / 1.8;

            bones.forEach(bone => {
                const name = bone.name.toLowerCase();

                if (name.includes('armature') || name.includes('root') || name.includes('wrist')) return;
                if (name === 'hand' || name.includes('hand_')) return;

                // Larger per-finger offsets for more stagger
                let offset = 0;
                if (name.includes('index')) offset = 0.0;
                if (name.includes('middle')) offset = 0.6;
                if (name.includes('ring')) offset = 1.2;
                if (name.includes('pinky')) offset = 1.8;
                if (name.includes('thumb')) offset = 2.8;

                // Asymmetric wave: slow close, hold, quicker release
                const cycle = ((time * baseSpeed + offset) % (Math.PI * 2)) / (Math.PI * 2);
                let clenchFactor;
                if (cycle < 0.45) {
                    // Slowly closing
                    clenchFactor = Math.pow(cycle / 0.45, 0.7);
                } else if (cycle < 0.65) {
                    // Hold
                    clenchFactor = 1.0;
                } else {
                    // Release
                    const release = (cycle - 0.65) / 0.35;
                    clenchFactor = 1.0 - Math.pow(release, 0.5);
                }

                bone.rotation.x = clenchFactor * maxAngle;
            });

            // Material pulse - slower, subtler
            pointsMat.opacity = 0.65 + Math.sin(time * 1.2) * 0.15;
            lineMat.opacity = 0.03 + Math.sin(time * 0.8) * 0.02;
            ghostMat.opacity = 0.1 + Math.sin(time * 0.7) * 0.03;

            // Spectral light pulse
            spectralLight.intensity = 0.4 + Math.sin(time * 0.6) * 0.2;
            spectralLight.position.x = Math.sin(time * 0.2) * 0.5;

            // Camera sway - slower
            camera.position.x = Math.sin(time * 0.08) * 0.25;
            camera.position.y = Math.cos(time * 0.06) * 0.15;
            camera.lookAt(0, 0, 0);

            // Update grain time
            grainPass.uniforms.time.value = time;

            // Animate particles - slow upward drift
            const pos = particles.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount; i++) {
                pos[i * 3] += particleDrifts[i * 2];
                pos[i * 3 + 1] += particleSpeeds[i];
                pos[i * 3 + 2] += particleDrifts[i * 2 + 1];
                if (pos[i * 3 + 1] > 5) {
                    pos[i * 3 + 1] = -5;
                    pos[i * 3] = (Math.random() - 0.5) * 6;
                    pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.rotation.y = time * 0.015;

            // Render through post-processing pipeline
            composer.render();
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
            bloomPass.resolution.set(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            isComponentMounted = false;
            abortController.abort();
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);

            // Dispose post-processing
            composer.dispose();

            // Dispose particles
            particleGeom.dispose();
            particleMat.dispose();

            // Dispose materials
            ghostMat.dispose();
            wireOverlayMat.dispose();
            pointsMat.dispose();
            accentMat.dispose();
            lineMat.dispose();
            nodeSprite.dispose();

            renderer.dispose();
            if (loadedGltf) { /* dispose traversal */ }
            if (mountRef.current && renderer.domElement) {
                if (mountRef.current.contains(renderer.domElement)) {
                    mountRef.current.removeChild(renderer.domElement);
                }
            }
        };
    }, []);

    return (
        <div className="birth-container">
            <div ref={mountRef} className="birth-canvas" />
            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    <span className="record-icon" />
                    {isRecording && <span className="record-time">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>}
                </button>
            )}
        </div>
    );
};
