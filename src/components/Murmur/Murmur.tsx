import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ExportFrame } from '../ExportFrame/ExportFrame';
import { murmurVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';
import './Murmur.css';

const BOID_COUNT = 8000;
const PERCEPTION_RADIUS = 0.5;
const MAX_SPEED = 0.05;
const MAX_FORCE = 0.003;
const BOUNDARY_RADIUS = 6;
const CYCLE_DURATION = 26;
const MAX_NEIGHBORS = 25; // cap neighbor checks to prevent slowdown when dense

// Spatial hash for O(n) neighbor lookups - zero-allocation after warmup
class SpatialHash {
    private cellSize: number;
    // Integer key hash: pack 3 ints into one via prime multiplication
    private cells: Map<number, number[]>;
    private activeCells: number[];
    private activeCount: number;
    // Pre-allocated query result buffer
    public queryBuf: number[];
    public queryLen: number;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.activeCells = [];
        this.activeCount = 0;
        this.queryBuf = new Array(256);
        this.queryLen = 0;
    }

    private hashKey(cx: number, cy: number, cz: number): number {
        return (cx * 73856093) ^ (cy * 19349663) ^ (cz * 83492791);
    }

    clear() {
        for (let i = 0; i < this.activeCount; i++) {
            const cell = this.cells.get(this.activeCells[i]);
            if (cell) cell.length = 0; // reuse array, don't dealloc
        }
        this.activeCount = 0;
    }

    insert(index: number, x: number, y: number, z: number) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        const k = this.hashKey(cx, cy, cz);
        let cell = this.cells.get(k);
        if (!cell) {
            cell = [];
            this.cells.set(k, cell);
        }
        if (cell.length === 0) {
            this.activeCells[this.activeCount++] = k;
        }
        cell.push(index);
    }

    // Writes results into internal buffer, capped at maxResults to avoid
    // copying thousands of entries when boids are dense in few cells
    query(x: number, y: number, z: number, maxResults: number) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const cz = Math.floor(z / this.cellSize);
        let len = 0;
        outer:
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const cell = this.cells.get(this.hashKey(cx + dx, cy + dy, cz + dz));
                    if (cell) {
                        for (let n = 0; n < cell.length; n++) {
                            if (len >= this.queryBuf.length) this.queryBuf.length = len * 2;
                            this.queryBuf[len++] = cell[n];
                            if (len >= maxResults) break outer;
                        }
                    }
                }
            }
        }
        this.queryLen = len;
    }
}

// Generate target points: two concentric ellipses + "S-23" text
function generateTargets(count: number): Float32Array {
    const result = new Float32Array(count * 3);

    const outerCount = Math.floor(count * 0.18);
    const innerCount = Math.floor(count * 0.15);
    const textCount = count - outerCount - innerCount;
    const band = 0.16;

    // Outer ellipse (halved for compact fit on mobile)
    const oa = 1.9, ob = 1.0;
    for (let i = 0; i < outerCount; i++) {
        const t = (i / outerCount) * Math.PI * 2;
        const r = 1 + (Math.random() - 0.5) * band;
        result[i * 3] = oa * Math.cos(t) * r;
        result[i * 3 + 1] = ob * Math.sin(t) * r;
        result[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }

    // Inner ellipse - between outer and text
    const ia = 1.3, ib = 0.7;
    const off = outerCount;
    for (let i = 0; i < innerCount; i++) {
        const t = (i / innerCount) * Math.PI * 2;
        const r = 1 + (Math.random() - 0.5) * band;
        result[(off + i) * 3] = ia * Math.cos(t) * r;
        result[(off + i) * 3 + 1] = ib * Math.sin(t) * r;
        result[(off + i) * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }

    const ellipseTotal = outerCount + innerCount;

    // Text "S-23": render to offscreen canvas with Neo Brutalist font
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 512, 200);
    ctx.fillStyle = 'black';
    ctx.font = '150px "Neo Brutalist", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S-23', 256, 105);

    const imgData = ctx.getImageData(0, 0, 512, 200);
    const darkPixels: number[] = [];
    for (let y = 0; y < 200; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            if (imgData.data[idx] < 80) {
                darkPixels.push(x, y);
            }
        }
    }

    const numDark = darkPixels.length / 2;
    if (numDark > 0) {
        // Map text to fit inside ellipse (~55% of ellipse width)
        const textW = 2.1, textH = textW * (200 / 512);
        for (let i = ellipseTotal; i < count; i++) {
            const pi = Math.floor(Math.random() * numDark) * 2;
            result[i * 3] = (darkPixels[pi] / 512 - 0.5) * textW;
            result[i * 3 + 1] = -(darkPixels[pi + 1] / 200 - 0.5) * textH;
            result[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
        }
    }

    return result;
}

// Attractor strength curve within a shape cycle (phase 0-1)
function getAttractorStrength(phase: number): number {
    if (phase < 0.22) return 0;           // free flock
    if (phase < 0.6) {                    // converge
        const t = (phase - 0.22) / 0.38;
        return t * t * 0.8;
    }
    if (phase < 0.78) return 0.8;         // hold - strong so logo reads clearly
    const t = (phase - 0.78) / 0.22;
    return 0.8 * (1 - t * t);             // release
}

function getScatterBurst(phase: number): number {
    if (phase < 0.80 || phase > 0.92) return 0;
    const t = (phase - 0.80) / 0.12;
    return Math.exp(-t * 4) * 0.04;
}

export const Murmur: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(murmurVisualExport);
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
                a.download = `murmur-${Date.now()}.webm`;
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
        const mountElement = mountRef.current;

        const getMountSize = () => {
            const rect = mountElement.getBoundingClientRect();
            const width = rect.width || mountElement.clientWidth || window.innerWidth;
            const height = rect.height || mountElement.clientHeight || window.innerHeight;

            return {
                width: Math.max(1, Math.floor(width)),
                height: Math.max(1, Math.floor(height)),
            };
        };

        const initialSize = getMountSize();
        let mountAspect = initialSize.width / initialSize.height;

        let isComponentMounted = true;

        // Scene
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.04);

        const camera = new THREE.PerspectiveCamera(50, mountAspect, 0.1, 1000);
        camera.position.z = mountAspect < 0.8 ? 9 : 7;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initialSize.width, initialSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.0;
        mountElement.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // Post-processing
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height),
            1.0, 0.6, 0.3
        );
        composer.addPass(bloomPass);

        const grainPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                grainIntensity: { value: 0.06 },
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
                    float vig = 1.0 - dot(uv, uv) * 1.4;
                    color.rgb *= clamp(vig, 0.0, 1.0);
                    gl_FragColor = color;
                }
            `,
        });
        composer.addPass(grainPass);

        // Context loss
        const handleContextLost = (event: Event) => {
            event.preventDefault();
            if (animationId) cancelAnimationFrame(animationId);
        };
        const handleContextRestored = () => {
            resizeToMount();
            if (!animationId && isComponentMounted) animate();
        };
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

        // Sprite texture
        const sprite = (() => {
            const c = document.createElement('canvas');
            c.width = 64; c.height = 64;
            const ctx = c.getContext('2d')!;
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.15, 'rgba(220,230,255,0.7)');
            g.addColorStop(0.4, 'rgba(180,200,255,0.15)');
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(c);
        })();

        // Boid state - flat typed arrays for performance
        const positions = new Float32Array(BOID_COUNT * 3);
        const velocities = new Float32Array(BOID_COUNT * 3);
        const speedVariation = new Float32Array(BOID_COUNT);

        // Initialize boids in a random sphere
        for (let i = 0; i < BOID_COUNT; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = Math.pow(Math.random(), 0.33) * BOUNDARY_RADIUS * 0.7;
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

            speedVariation[i] = 0.85 + Math.random() * 0.3;
        }

        // Points geometry - shares the positions buffer directly
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.07,
            map: sprite,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0xccddff,
        });

        const points = new THREE.Points(geom, mat);
        scene.add(points);

        // Spatial hash
        const hash = new SpatialHash(PERCEPTION_RADIUS);

        // Explicitly load Neo Brutalist font, then generate targets
        let logoTargets: Float32Array | null = null;
        document.fonts.load('150px "Neo Brutalist"').then(() => {
            if (!isComponentMounted) return;
            logoTargets = generateTargets(BOID_COUNT);
        });

        // Animation
        let animationId: number = 0;
        const percRadSq = PERCEPTION_RADIUS * PERCEPTION_RADIUS;

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            // Single shape cycle: scatter -> converge to logo -> hold -> scatter -> repeat
            const phase = (time % CYCLE_DURATION) / CYCLE_DURATION;
            const attractorStr = getAttractorStrength(phase);
            const scatter = getScatterBurst(phase);
            const currentTargets = logoTargets;

            // Build spatial hash
            hash.clear();
            for (let i = 0; i < BOID_COUNT; i++) {
                hash.insert(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            }

            // Update boids
            for (let i = 0; i < BOID_COUNT; i++) {
                const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
                const px = positions[ix], py = positions[iy], pz = positions[iz];

                let sepX = 0, sepY = 0, sepZ = 0, sepN = 0;
                let aliX = 0, aliY = 0, aliZ = 0, aliN = 0;
                let cohX = 0, cohY = 0, cohZ = 0, cohN = 0;

                hash.query(px, py, pz, MAX_NEIGHBORS + 1); // +1 for self
                let checked = 0;
                for (let n = 0; n < hash.queryLen && checked < MAX_NEIGHBORS; n++) {
                    const j = hash.queryBuf[n];
                    if (i === j) continue;
                    const jx = j * 3, jy = j * 3 + 1, jz = j * 3 + 2;
                    const dx = px - positions[jx];
                    const dy = py - positions[jy];
                    const dz = pz - positions[jz];
                    const dSq = dx * dx + dy * dy + dz * dz;

                    if (dSq < percRadSq && dSq > 0.0001) {
                        const d = Math.sqrt(dSq);
                        const invD = 1 / d;
                        checked++;

                        sepX += dx * invD * invD;
                        sepY += dy * invD * invD;
                        sepZ += dz * invD * invD;
                        sepN++;

                        aliX += velocities[jx];
                        aliY += velocities[jy];
                        aliZ += velocities[jz];
                        aliN++;

                        cohX += positions[jx];
                        cohY += positions[jy];
                        cohZ += positions[jz];
                        cohN++;
                    }
                }

                let fx = 0, fy = 0, fz = 0;

                // Flocking forces fade out as attractor takes over
                const flockWeight = 1 - attractorStr * 0.9;

                // Separation
                if (sepN > 0) {
                    sepX /= sepN; sepY /= sepN; sepZ /= sepN;
                    const m = Math.sqrt(sepX * sepX + sepY * sepY + sepZ * sepZ) || 1;
                    fx += (sepX / m) * MAX_FORCE * 1.8 * flockWeight;
                    fy += (sepY / m) * MAX_FORCE * 1.8 * flockWeight;
                    fz += (sepZ / m) * MAX_FORCE * 1.8 * flockWeight;
                }

                // Alignment
                if (aliN > 0) {
                    aliX /= aliN; aliY /= aliN; aliZ /= aliN;
                    fx += (aliX - velocities[ix]) * MAX_FORCE * 0.8 * flockWeight;
                    fy += (aliY - velocities[iy]) * MAX_FORCE * 0.8 * flockWeight;
                    fz += (aliZ - velocities[iz]) * MAX_FORCE * 0.8 * flockWeight;
                }

                // Cohesion
                if (cohN > 0) {
                    cohX /= cohN; cohY /= cohN; cohZ /= cohN;
                    const dx = cohX - px, dy = cohY - py, dz = cohZ - pz;
                    const m = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                    fx += (dx / m) * MAX_FORCE * flockWeight;
                    fy += (dy / m) * MAX_FORCE * flockWeight;
                    fz += (dz / m) * MAX_FORCE * flockWeight;
                }

                // Attractor toward target - stronger pull, with velocity damping
                if (currentTargets && attractorStr > 0) {
                    const tx = currentTargets[ix] - px;
                    const ty = currentTargets[iy] - py;
                    const tz = currentTargets[iz] - pz;
                    const pull = attractorStr * 0.025;
                    fx += tx * pull;
                    fy += ty * pull;
                    fz += tz * pull;

                    // Dampen velocity when near target - makes them settle
                    const distToTarget = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    if (distToTarget < 0.3) {
                        const damp = 0.85;
                        velocities[ix] *= damp;
                        velocities[iy] *= damp;
                        velocities[iz] *= damp;
                    }
                }

                // Scatter burst
                if (scatter > 0) {
                    const dm = Math.sqrt(px * px + py * py + pz * pz) || 1;
                    fx += (px / dm) * scatter + (Math.random() - 0.5) * scatter * 0.6;
                    fy += (py / dm) * scatter + (Math.random() - 0.5) * scatter * 0.6;
                    fz += (pz / dm) * scatter + (Math.random() - 0.5) * scatter * 0.6;
                }

                // Soft boundary
                const dist = Math.sqrt(px * px + py * py + pz * pz);
                if (dist > BOUNDARY_RADIUS) {
                    const push = (dist - BOUNDARY_RADIUS) * 0.008;
                    fx -= (px / dist) * push;
                    fy -= (py / dist) * push;
                    fz -= (pz / dist) * push;
                }

                // Update velocity
                velocities[ix] += fx;
                velocities[iy] += fy;
                velocities[iz] += fz;

                // Clamp speed
                const spd = Math.sqrt(velocities[ix] ** 2 + velocities[iy] ** 2 + velocities[iz] ** 2);
                const maxSpd = MAX_SPEED * speedVariation[i];
                if (spd > maxSpd) {
                    const scale = maxSpd / spd;
                    velocities[ix] *= scale;
                    velocities[iy] *= scale;
                    velocities[iz] *= scale;
                }

                // Update position
                positions[ix] += velocities[ix];
                positions[iy] += velocities[iy];
                positions[iz] += velocities[iz];
            }

            // Flag buffer for GPU upload
            geom.attributes.position.needsUpdate = true;

            // Subtle pulse, reduce bloom when converged to prevent white-out
            mat.opacity = 0.65 + Math.sin(time * 0.8) * 0.08;
            bloomPass.strength = 1.0 - attractorStr * 0.5;

            // Camera - mostly head-on to flat logo, gentle sway
            camera.position.x = Math.sin(time * 0.04) * 0.6;
            camera.position.y = Math.cos(time * 0.03) * 0.4;
            const cameraBaseZ = mountAspect < 0.8 ? 9 : 7;
            camera.position.z = cameraBaseZ + Math.sin(time * 0.02) * 0.3;
            camera.lookAt(0, 0, 0);

            // Update grain
            grainPass.uniforms.time.value = time;

            composer.render();
        };

        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            mountAspect = width / height;
            camera.aspect = mountAspect;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            composer.setSize(width, height);
            bloomPass.resolution.set(width, height);
        };
        resizeToMount();

        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            isComponentMounted = false;
            if (animationId) cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            composer.dispose();
            geom.dispose();
            mat.dispose();
            sprite.dispose();
            renderer.dispose();
            if (mountElement && renderer.domElement && mountElement.contains(renderer.domElement)) {
                mountElement.removeChild(renderer.domElement);
            }
        };
    }, [exportSettings.isExportMode]);

    return (
        <ExportFrame aspect={exportSettings.aspect} active={exportSettings.isExportMode}>
            <div className="murmur-container">
                <div ref={mountRef} className="murmur-canvas" />
                {process.env.NODE_ENV !== 'production' && !exportSettings.isExportMode && (
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
        </ExportFrame>
    );
};
