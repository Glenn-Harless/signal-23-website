import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Decay.css';

// ── Constants ────────────────────────────────────────────────────────────────
const CYCLE_DURATION = 35;
const PRISTINE_END = 8;
const CRUMBLE_END = 20;
const DUST_END = 28;
const SUBDIVISIONS = 3;
const RADIUS = 1.5;
const PARTICLE_COUNT = 200;

// ── Fragment data ────────────────────────────────────────────────────────────
interface Fragment {
    homeA: THREE.Vector3;
    homeB: THREE.Vector3;
    homeC: THREE.Vector3;
    offset: THREE.Vector3;
    normal: THREE.Vector3;
    center: THREE.Vector3;
    health: number;
    velocity: THREE.Vector3;
    rotation: THREE.Euler;
    rotVelocity: THREE.Vector3;
    neighbors: number[];
    crackDepth: number;
}

function buildFragments(geometry: THREE.BufferGeometry): Fragment[] {
    const pos = geometry.getAttribute('position');
    const fragments: Fragment[] = [];
    const triCount = pos.count / 3;

    for (let i = 0; i < triCount; i++) {
        const i3 = i * 3;
        const a = new THREE.Vector3().fromBufferAttribute(pos, i3);
        const b = new THREE.Vector3().fromBufferAttribute(pos, i3 + 1);
        const c = new THREE.Vector3().fromBufferAttribute(pos, i3 + 2);

        const center = new THREE.Vector3().addVectors(a, b).add(c).divideScalar(3);
        const ab = new THREE.Vector3().subVectors(b, a);
        const ac = new THREE.Vector3().subVectors(c, a);
        const normal = new THREE.Vector3().crossVectors(ab, ac).normalize();

        fragments.push({
            homeA: a, homeB: b, homeC: c,
            offset: new THREE.Vector3(),
            normal,
            center,
            health: 1.0,
            velocity: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            rotVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ),
            neighbors: [],
            crackDepth: 0,
        });
    }
    return fragments;
}

function buildAdjacency(fragments: Fragment[]): void {
    const vertMap = new Map<string, number[]>();
    const quantize = (v: THREE.Vector3) =>
        `${(v.x * 1000) | 0},${(v.y * 1000) | 0},${(v.z * 1000) | 0}`;

    for (let i = 0; i < fragments.length; i++) {
        const f = fragments[i];
        for (const v of [f.homeA, f.homeB, f.homeC]) {
            const key = quantize(v);
            if (!vertMap.has(key)) vertMap.set(key, []);
            vertMap.get(key)!.push(i);
        }
    }

    for (let i = 0; i < fragments.length; i++) {
        const f = fragments[i];
        const neighborCounts = new Map<number, number>();
        for (const v of [f.homeA, f.homeB, f.homeC]) {
            const key = quantize(v);
            const sharing = vertMap.get(key) || [];
            for (const j of sharing) {
                if (j !== i) neighborCounts.set(j, (neighborCounts.get(j) || 0) + 1);
            }
        }
        for (const [j, count] of neighborCounts) {
            if (count >= 2) fragments[i].neighbors.push(j);
        }
    }
}

// ── Component ────────────────────────────────────────────────────────────────
export const Decay: React.FC = () => {
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
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 3000000,
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
                a.download = `decay-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(
                () => setRecordingTime(p => p + 1), 1000
            );
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
                recordingIntervalRef.current = null;
            }
            chunksRef.current = [];
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;
        let isComponentMounted = true;

        // ── Scene ────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.03);

        const camera = new THREE.PerspectiveCamera(
            50, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.0;
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // Context loss handlers
        const handleContextLost = (event: Event) => {
            event.preventDefault();
        };
        const handleContextRestored = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

        // ── Post-processing ──────────────────────────────────────────────
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, 0.4, 0.3
        );
        composer.addPass(bloomPass);

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
                    float grain = rand(vUv + fract(time)) * grainIntensity;
                    color.rgb += grain - grainIntensity * 0.5;
                    vec2 uv = vUv - 0.5;
                    float vig = 1.0 - dot(uv, uv) * 1.6;
                    color.rgb *= clamp(vig, 0.0, 1.0);
                    gl_FragColor = color;
                }
            `,
        });
        composer.addPass(grainPass);

        // ── Lighting ─────────────────────────────────────────────────────
        const keyLight = new THREE.PointLight(0x6688cc, 1.5, 20);
        keyLight.position.set(2, 2, 4);
        scene.add(keyLight);

        const backLight = new THREE.PointLight(0x4455aa, 0.8, 15);
        backLight.position.set(-3, -1, -2);
        scene.add(backLight);

        const rimLight = new THREE.PointLight(0x334488, 0.6, 12);
        rimLight.position.set(0, -2, 3);
        scene.add(rimLight);

        scene.add(new THREE.AmbientLight(0x222244, 0.8));

        // ── Build icosahedron fragments ──────────────────────────────────
        const baseGeom = new THREE.IcosahedronGeometry(RADIUS, SUBDIVISIONS);
        const nonIndexed = baseGeom.toNonIndexed();
        const fragments = buildFragments(nonIndexed);
        buildAdjacency(fragments);
        baseGeom.dispose();
        nonIndexed.dispose();

        // ── Render geometry ──────────────────────────────────────────────
        const vertexCount = fragments.length * 3;
        const positions = new Float32Array(vertexCount * 3);
        const colors = new Float32Array(vertexCount * 3);

        for (let i = 0; i < fragments.length; i++) {
            const f = fragments[i];
            const i9 = i * 9;
            positions[i9]     = f.homeA.x; positions[i9 + 1] = f.homeA.y; positions[i9 + 2] = f.homeA.z;
            positions[i9 + 3] = f.homeB.x; positions[i9 + 4] = f.homeB.y; positions[i9 + 5] = f.homeB.z;
            positions[i9 + 6] = f.homeC.x; positions[i9 + 7] = f.homeC.y; positions[i9 + 8] = f.homeC.z;
            for (let v = 0; v < 3; v++) {
                colors[i9 + v * 3]     = 0.35;
                colors[i9 + v * 3 + 1] = 0.4;
                colors[i9 + v * 3 + 2] = 0.55;
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            shininess: 30,
            specular: new THREE.Color(0x2244aa),
            emissive: new THREE.Color(0x0a0e1a),
        });
        const mesh = new THREE.Mesh(geom, material);
        scene.add(mesh);

        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.12,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const wireMesh = new THREE.Mesh(geom, wireMat);
        scene.add(wireMesh);

        // ── Ambient dust particles ───────────────────────────────────────
        const dustGeom = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(PARTICLE_COUNT * 3);
        const dustSpeeds = new Float32Array(PARTICLE_COUNT);
        const dustDrifts = new Float32Array(PARTICLE_COUNT * 2);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            dustPositions[i * 3]     = (Math.random() - 0.5) * 8;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
            dustSpeeds[i] = 0.001 + Math.random() * 0.003;
            dustDrifts[i * 2]     = (Math.random() - 0.5) * 0.0004;
            dustDrifts[i * 2 + 1] = (Math.random() - 0.5) * 0.0004;
        }
        dustGeom.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));

        const dustSprite = (() => {
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            const ctx = c.getContext('2d')!;
            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.3, 'rgba(200,220,255,0.3)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(c);
        })();

        const dustMat = new THREE.PointsMaterial({
            size: 0.03,
            map: dustSprite,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0x556688,
        });
        const dustPoints = new THREE.Points(dustGeom, dustMat);
        scene.add(dustPoints);

        // ── Cycle state ──────────────────────────────────────────────────
        let cycleTime = 0;
        let lastFrameTime = performance.now() * 0.001;
        let crackFrontier: number[] = [];
        const crackVisited = new Set<number>();

        function resetCycle() {
            cycleTime = 0;
            crackVisited.clear();
            crackFrontier = [];
            const seedCount = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < seedCount; s++) {
                const idx = Math.floor(Math.random() * fragments.length);
                crackFrontier.push(idx);
                crackVisited.add(idx);
            }
            for (const f of fragments) {
                f.health = 1.0;
                f.offset.set(0, 0, 0);
                f.velocity.set(0, 0, 0);
                f.rotation.set(0, 0, 0);
                f.crackDepth = 0;
            }
        }
        resetCycle();

        function propagateCracks(rate: number) {
            const newFrontier: number[] = [];
            const spread = Math.max(1, Math.floor(rate));
            for (let s = 0; s < spread && crackFrontier.length > 0; s++) {
                const randIdx = Math.floor(Math.random() * crackFrontier.length);
                const fi = crackFrontier[randIdx];
                crackFrontier.splice(randIdx, 1);
                const frag = fragments[fi];
                frag.crackDepth = Math.max(frag.crackDepth, 1);

                for (const ni of frag.neighbors) {
                    if (!crackVisited.has(ni)) {
                        crackVisited.add(ni);
                        newFrontier.push(ni);
                        fragments[ni].crackDepth = frag.crackDepth + 1;
                    }
                }
            }
            crackFrontier.push(...newFrontier);
        }

        // ── Pre-allocated reusables ──────────────────────────────────────
        const _rotMatrix = new THREE.Matrix4();
        const _v = new THREE.Vector3();

        // ── Animation ────────────────────────────────────────────────────
        let animationId = 0;

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;
            const dt = Math.min(time - lastFrameTime, 0.05);
            lastFrameTime = time;
            cycleTime += dt;

            if (cycleTime >= CYCLE_DURATION) resetCycle();

            // ── Phase logic ──────────────────────────────────────────────
            if (cycleTime < PRISTINE_END) {
                const progress = cycleTime / PRISTINE_END;
                propagateCracks(1 + progress * 2);
                for (const f of fragments) {
                    if (f.crackDepth > 0 && f.health > 0.3) {
                        f.health -= dt * 0.08;
                    }
                }
            } else if (cycleTime < CRUMBLE_END) {
                propagateCracks(5);
                for (const f of fragments) {
                    if (f.crackDepth > 0) {
                        f.health -= dt * 0.15;
                        if (f.health < 0) f.health = 0;
                    }
                    if (f.health <= 0.1) {
                        f.velocity.addScaledVector(f.normal, 0.0008);
                        f.velocity.x += (Math.random() - 0.5) * 0.0003;
                        f.velocity.y += (Math.random() - 0.5) * 0.0003;
                        f.velocity.z += (Math.random() - 0.5) * 0.0003;
                        f.offset.add(f.velocity);
                        f.rotation.x += f.rotVelocity.x;
                        f.rotation.y += f.rotVelocity.y;
                        f.rotation.z += f.rotVelocity.z;
                    }
                }
            } else if (cycleTime < DUST_END) {
                for (const f of fragments) {
                    f.health = Math.max(f.health - dt * 0.1, 0);
                    if (f.health <= 0.1) {
                        f.velocity.multiplyScalar(0.995);
                        f.offset.add(f.velocity);
                        f.rotation.x += f.rotVelocity.x * 0.5;
                        f.rotation.y += f.rotVelocity.y * 0.5;
                    }
                }
            } else {
                const rebuildProgress = (cycleTime - DUST_END) / (CYCLE_DURATION - DUST_END);
                const ease = 1 - Math.pow(1 - rebuildProgress, 3);
                for (const f of fragments) {
                    f.offset.multiplyScalar(1 - ease * 0.08);
                    f.rotation.x *= 1 - ease * 0.08;
                    f.rotation.y *= 1 - ease * 0.08;
                    f.rotation.z *= 1 - ease * 0.08;
                    f.health = Math.min(1, f.health + dt * 0.5);
                    f.velocity.multiplyScalar(0.9);
                }
            }

            // ── Update geometry buffer ───────────────────────────────────
            for (let i = 0; i < fragments.length; i++) {
                const f = fragments[i];
                const i9 = i * 9;

                if (f.offset.lengthSq() > 0.0001) {
                    _rotMatrix.makeRotationFromEuler(f.rotation);
                    // Vertex A
                    _v.copy(f.homeA).sub(f.center);
                    _v.applyMatrix4(_rotMatrix);
                    _v.add(f.center).add(f.offset);
                    positions[i9]     = _v.x; positions[i9 + 1] = _v.y; positions[i9 + 2] = _v.z;
                    // Vertex B
                    _v.copy(f.homeB).sub(f.center);
                    _v.applyMatrix4(_rotMatrix);
                    _v.add(f.center).add(f.offset);
                    positions[i9 + 3] = _v.x; positions[i9 + 4] = _v.y; positions[i9 + 5] = _v.z;
                    // Vertex C
                    _v.copy(f.homeC).sub(f.center);
                    _v.applyMatrix4(_rotMatrix);
                    _v.add(f.center).add(f.offset);
                    positions[i9 + 6] = _v.x; positions[i9 + 7] = _v.y; positions[i9 + 8] = _v.z;
                } else {
                    positions[i9]     = f.homeA.x; positions[i9 + 1] = f.homeA.y; positions[i9 + 2] = f.homeA.z;
                    positions[i9 + 3] = f.homeB.x; positions[i9 + 4] = f.homeB.y; positions[i9 + 5] = f.homeB.z;
                    positions[i9 + 6] = f.homeC.x; positions[i9 + 7] = f.homeC.y; positions[i9 + 8] = f.homeC.z;
                }

                // Crack glow color
                const crackGlow = f.crackDepth > 0 ? Math.max(0, 1 - f.health) * 0.8 : 0;
                for (let v = 0; v < 3; v++) {
                    colors[i9 + v * 3]     = 0.12 + crackGlow * 0.3;
                    colors[i9 + v * 3 + 1] = 0.14 + crackGlow * 0.5;
                    colors[i9 + v * 3 + 2] = 0.22 + crackGlow * 0.8;
                }
            }

            geom.attributes.position.needsUpdate = true;
            geom.attributes.color.needsUpdate = true;
            geom.computeVertexNormals();

            // Slow rotation
            mesh.rotation.y = time * 0.15;
            mesh.rotation.x = Math.sin(time * 0.2) * 0.1;
            wireMesh.rotation.copy(mesh.rotation);

            // Bloom ramps up during dust phase
            if (cycleTime > CRUMBLE_END && cycleTime < DUST_END) {
                bloomPass.strength = 0.6 + ((cycleTime - CRUMBLE_END) / (DUST_END - CRUMBLE_END)) * 0.6;
            } else {
                bloomPass.strength = 0.6;
            }

            // Camera sway
            camera.position.x = Math.sin(time * 0.08) * 0.2;
            camera.position.y = Math.cos(time * 0.06) * 0.15;
            camera.lookAt(0, 0, 0);

            // Ambient dust
            const dPos = dustGeom.attributes.position.array as Float32Array;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                dPos[i * 3]     += dustDrifts[i * 2];
                dPos[i * 3 + 1] += dustSpeeds[i];
                dPos[i * 3 + 2] += dustDrifts[i * 2 + 1];
                if (dPos[i * 3 + 1] > 4) {
                    dPos[i * 3 + 1] = -4;
                    dPos[i * 3]     = (Math.random() - 0.5) * 8;
                    dPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
                }
            }
            dustGeom.attributes.position.needsUpdate = true;
            dustPoints.rotation.y = time * 0.01;

            grainPass.uniforms.time.value = time;
            composer.render();
        };

        animate();

        // ── Resize ───────────────────────────────────────────────────────
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
            bloomPass.resolution.set(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // ── Cleanup ──────────────────────────────────────────────────────
        return () => {
            isComponentMounted = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            composer.dispose();
            geom.dispose();
            material.dispose();
            wireMat.dispose();
            dustGeom.dispose();
            dustMat.dispose();
            dustSprite.dispose();
            renderer.dispose();
            if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div className="decay-container">
            <div ref={mountRef} className="decay-canvas" />
            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    <span className="record-icon" />
                    {isRecording && (
                        <span className="record-time">
                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};
