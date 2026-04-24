import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Reclamation.css';

// ── Cycle timing ─────────────────────────────────────────────────────────────
const CYCLE_DURATION = 60;
const DORMANT_END = 4;      // Cold wireframe structure alone
const EMERGENCE_END = 14;   // First vines emerging from ground
const GROWTH_END = 38;      // Vines fully grown
const BLOOM_END = 52;       // Peak reclamation — full bloom
// 52→60: quiet fade, reset

const SEED_COUNT = 12;
const TOWER_COUNT = 9;
const POLLEN_COUNT = 150;
const ASH_COUNT = 100;

const LOG_MESSAGES = [
    'ATMOSPHERIC_CO2: DECREASING',
    'STRUCTURE_INTEGRITY: 99.8%',
    'NATURE_SIGNAL_DETECTED',
    'RECLAMATION_PROGRESS: 0.112',
    'ROOT_SYSTEM_INITIALIZING...',
    'MYCELIAL_NETWORK_ONLINE',
    'CHLOROPHYLL_GRADIENT_ACTIVE',
    'URBAN_DECAY_CONFIRMED',
    'PHOTOSYNTHESIS_RATE: 0.847',
    'CARBON_SEQUESTRATION: NOMINAL',
    'STRUCTURAL_RESONANCE_LOST',
    'BLOOM_CYCLE_INITIATED',
    'SEED_DISPERSAL_COMPLETE',
    'TENDRIL_EXPANSION_PHASE',
    'BIOLUMINESCENCE_DETECTED',
    'CONCRETE_INDEX: FAILING',
    'POLLINATOR_COUNT: +INFINITY',
    'WEIGHTS_LEARNED: 0.982301',
    'THERMODYNAMIC_GRADIENT_STABLE',
    'SILICON_EROSION: 0.0012 m/s',
    'BIOMASS_OVERRIDE_CONFIRMED',
    'GRID_POWER: 0.04%',
];

interface VineSegment {
    start: THREE.Vector3;
    end: THREE.Vector3;
    depth: number;
    sortKey: number;
}

export const Reclamation: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [showText, setShowText] = useState(false);

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
                videoBitsPerSecond: 8000000,
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
                a.download = `reclamation-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(
                () => setRecordingTime((p) => p + 1),
                1000
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
        let isComponentMounted = true;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < 768;

        // ── Scene ────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.006);

        const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
        camera.position.set(0, 30, 180);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.1;
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        const handleContextLost = (event: Event) => event.preventDefault();
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
            new THREE.Vector2(width, height),
            0.7,
            0.6,
            0.25
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
                    float vig = 1.0 - dot(uv, uv) * 1.35;
                    color.rgb *= clamp(vig, 0.0, 1.0);
                    gl_FragColor = color;
                }
            `,
        });
        composer.addPass(grainPass);

        // ── Lights ───────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x223344, 0.8));
        const warmKey = new THREE.PointLight(0xaaffaa, 1.2, 300);
        warmKey.position.set(60, 80, 60);
        scene.add(warmKey);
        const coolRim = new THREE.PointLight(0x5588cc, 0.9, 250);
        coolRim.position.set(-80, 30, -60);
        scene.add(coolRim);
        const underLight = new THREE.PointLight(0x446688, 0.6, 200);
        underLight.position.set(0, -35, 0);
        scene.add(underLight);

        // ── Glow texture (used by flowers + particles) ────────────────────
        const createGlowTexture = () => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d')!;
            const grad = ctx.createRadialGradient(
                size / 2, size / 2, 0,
                size / 2, size / 2, size / 2
            );
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.75)');
            grad.addColorStop(0.45, 'rgba(255, 240, 220, 0.22)');
            grad.addColorStop(1, 'rgba(255, 240, 220, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
            return new THREE.CanvasTexture(canvas);
        };
        const glowTexture = createGlowTexture();

        // ── Dystopian cityscape ──────────────────────────────────────────
        const cityGroup = new THREE.Group();
        const towerMaterial = new THREE.LineBasicMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.6,
        });
        const towers: THREE.LineSegments[] = [];
        const towerBases: Array<{ x: number; z: number; h: number }> = [];

        for (let i = 0; i < TOWER_COUNT; i++) {
            const angle = (i / TOWER_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const radius = 25 + Math.random() * 35;
            const tx = Math.cos(angle) * radius;
            const tz = Math.sin(angle) * radius;

            const isWide = Math.random() < 0.3;
            const tw = isWide ? 14 + Math.random() * 10 : 6 + Math.random() * 4;
            const td = isWide ? 14 + Math.random() * 10 : 6 + Math.random() * 4;
            const th = isWide ? 20 + Math.random() * 20 : 45 + Math.random() * 40;

            const boxGeo = new THREE.BoxGeometry(tw, th, td);
            const edges = new THREE.EdgesGeometry(boxGeo);
            const tower = new THREE.LineSegments(edges, towerMaterial);
            tower.position.set(tx, -40 + th / 2, tz);
            cityGroup.add(tower);
            towers.push(tower);
            towerBases.push({ x: tx, z: tz, h: th });
            boxGeo.dispose();
        }
        scene.add(cityGroup);

        // ── Ground grid ──────────────────────────────────────────────────
        const gridHelper = new THREE.GridHelper(400, 40, 0x2255aa, 0x112244);
        gridHelper.position.y = -40;
        const gridMat = gridHelper.material as THREE.Material;
        (gridMat as any).transparent = true;
        (gridMat as any).opacity = 0.35;
        scene.add(gridHelper);

        // ── Generate vines (L-system) ────────────────────────────────────
        const ALL_VINES: VineSegment[] = [];

        const generateVine = (
            origin: THREE.Vector3,
            dir: THREE.Vector3,
            length: number,
            depth: number,
            maxDepth: number
        ) => {
            const end = origin.clone().add(dir.clone().multiplyScalar(length));
            ALL_VINES.push({
                start: origin.clone(),
                end: end.clone(),
                depth,
                sortKey: depth + Math.random() * 0.85,
            });

            if (depth < maxDepth) {
                const numBranches = 2 + Math.floor(Math.random() * 2);
                for (let b = 0; b < numBranches; b++) {
                    const nextDir = dir.clone();
                    nextDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 1.1);
                    nextDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 1.1);
                    // Upward bias when young (so the trunk goes up), relaxing with depth
                    nextDir.y += (1 - depth / maxDepth) * 0.18;
                    nextDir.normalize();
                    generateVine(end, nextDir, length * 0.78, depth + 1, maxDepth);
                }
            }
        };

        for (let i = 0; i < SEED_COUNT; i++) {
            let sx: number;
            let sz: number;

            // 45% chance: plant a seed at the base of an existing tower ("climbing")
            if (Math.random() < 0.45 && towerBases.length > 0) {
                const t = towerBases[Math.floor(Math.random() * towerBases.length)];
                sx = t.x + (Math.random() - 0.5) * 10;
                sz = t.z + (Math.random() - 0.5) * 10;
            } else {
                const angle = (i / SEED_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
                const radius = 40 + Math.random() * 35;
                sx = Math.cos(angle) * radius;
                sz = Math.sin(angle) * radius;
            }

            const initialDir = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                1,
                (Math.random() - 0.5) * 0.3
            ).normalize();

            generateVine(
                new THREE.Vector3(sx, -40, sz),
                initialDir,
                18 + Math.random() * 8,
                0,
                5
            );
        }

        // Sort so segments reveal shallow-first across all seeds (spreading feel)
        ALL_VINES.sort((a, b) => a.sortKey - b.sortKey);

        const totalSegments = ALL_VINES.length;
        const vinePositions = new Float32Array(totalSegments * 6);
        const vineColors = new Float32Array(totalSegments * 6);
        ALL_VINES.forEach((v, i) => {
            vinePositions[i * 6]     = v.start.x;
            vinePositions[i * 6 + 1] = v.start.y;
            vinePositions[i * 6 + 2] = v.start.z;
            vinePositions[i * 6 + 3] = v.end.x;
            vinePositions[i * 6 + 4] = v.end.y;
            vinePositions[i * 6 + 5] = v.end.z;
        });

        const vineGeom = new THREE.BufferGeometry();
        vineGeom.setAttribute('position', new THREE.BufferAttribute(vinePositions, 3));
        vineGeom.setAttribute('color', new THREE.BufferAttribute(vineColors, 3));
        vineGeom.setDrawRange(0, 0);

        const vineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
        });
        const vines = new THREE.LineSegments(vineGeom, vineMat);
        scene.add(vines);

        // ── Flowers (at deep branch tips) ─────────────────────────────────
        const flowers = ALL_VINES.filter((v) => v.depth >= 3);
        const flowerPositions = new Float32Array(flowers.length * 3);
        flowers.forEach((f, i) => {
            flowerPositions[i * 3]     = f.end.x;
            flowerPositions[i * 3 + 1] = f.end.y;
            flowerPositions[i * 3 + 2] = f.end.z;
        });

        const flowerGeom = new THREE.BufferGeometry();
        flowerGeom.setAttribute('position', new THREE.BufferAttribute(flowerPositions, 3));
        flowerGeom.setDrawRange(0, 0);

        const flowerMat = new THREE.PointsMaterial({
            color: 0xffddaa,
            size: isMobile ? 2.6 : 3.4,
            transparent: true,
            opacity: 0.9,
            map: glowTexture,
            alphaTest: 0.01,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const flowerPoints = new THREE.Points(flowerGeom, flowerMat);
        scene.add(flowerPoints);

        // ── Ash falling (tech decay, always present) ──────────────────────
        const ashGeom = new THREE.BufferGeometry();
        const ashPos = new Float32Array(ASH_COUNT * 3);
        const ashSpeed = new Float32Array(ASH_COUNT);
        for (let i = 0; i < ASH_COUNT; i++) {
            ashPos[i * 3]     = (Math.random() - 0.5) * 300;
            ashPos[i * 3 + 1] = -40 + Math.random() * 160;
            ashPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
            ashSpeed[i] = 0.05 + Math.random() * 0.18;
        }
        ashGeom.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
        const ashMat = new THREE.PointsMaterial({
            color: 0x8899bb,
            size: 0.7,
            transparent: true,
            opacity: 0.45,
            map: glowTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const ashPoints = new THREE.Points(ashGeom, ashMat);
        scene.add(ashPoints);

        // ── Pollen rising (nature signal, ramps up during bloom) ──────────
        const pollenGeom = new THREE.BufferGeometry();
        const pollenPos = new Float32Array(POLLEN_COUNT * 3);
        const pollenSpeed = new Float32Array(POLLEN_COUNT);
        const pollenDrift = new Float32Array(POLLEN_COUNT * 2);
        for (let i = 0; i < POLLEN_COUNT; i++) {
            pollenPos[i * 3]     = (Math.random() - 0.5) * 220;
            pollenPos[i * 3 + 1] = -40 + Math.random() * 140;
            pollenPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
            pollenSpeed[i] = 0.04 + Math.random() * 0.1;
            pollenDrift[i * 2]     = (Math.random() - 0.5) * 0.04;
            pollenDrift[i * 2 + 1] = (Math.random() - 0.5) * 0.04;
        }
        pollenGeom.setAttribute('position', new THREE.BufferAttribute(pollenPos, 3));
        const pollenMat = new THREE.PointsMaterial({
            color: 0xffe6aa,
            size: 1.3,
            transparent: true,
            opacity: 0,
            map: glowTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });
        const pollenPoints = new THREE.Points(pollenGeom, pollenMat);
        scene.add(pollenPoints);

        // ── Color helpers ─────────────────────────────────────────────────
        const _lerpA = new THREE.Color();
        const _lerpB = new THREE.Color();
        const lerpColorInto = (out: THREE.Color, hex1: number, hex2: number, t: number) => {
            const clamped = Math.max(0, Math.min(1, t));
            _lerpA.setHex(hex1);
            _lerpB.setHex(hex2);
            out.copy(_lerpA).lerp(_lerpB, clamped);
        };

        // ── Resize ───────────────────────────────────────────────────────
        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            composer.setSize(w, h);
            bloomPass.resolution.set(w, h);
        };
        window.addEventListener('resize', handleResize);

        // ── Animation ────────────────────────────────────────────────────
        let animationId = 0;
        let cycleTime = 0;
        let lastFrameTime = performance.now() * 0.001;
        const vineColorTmp = new THREE.Color();
        const towerColorTmp = new THREE.Color();

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;
            const dt = Math.min(time - lastFrameTime, 0.05);
            lastFrameTime = time;
            cycleTime += dt;
            if (cycleTime >= CYCLE_DURATION) cycleTime = 0;

            // Growth progress (0 during dormant, 0→1 during emergence+growth, 1 after)
            let growthProgress = 0;
            if (cycleTime >= DORMANT_END && cycleTime < GROWTH_END) {
                growthProgress = (cycleTime - DORMANT_END) / (GROWTH_END - DORMANT_END);
            } else if (cycleTime >= GROWTH_END) {
                growthProgress = 1;
            }

            // Reveal vine segments
            const segmentsToShow = Math.floor(totalSegments * growthProgress);
            vineGeom.setDrawRange(0, segmentsToShow * 2);

            // Flowers reveal slightly lagged — after emergence phase
            let flowersVisible = 0;
            if (cycleTime >= EMERGENCE_END) {
                const flowerDuration = BLOOM_END - EMERGENCE_END;
                const flowerProgress = Math.min(1, (cycleTime - EMERGENCE_END) / flowerDuration);
                flowersVisible = Math.floor(flowers.length * flowerProgress);
            }
            flowerGeom.setDrawRange(0, flowersVisible);

            // Vine color — phased palette (teal → green → gold → fade)
            if (cycleTime < EMERGENCE_END) {
                const t = (cycleTime - DORMANT_END) / (EMERGENCE_END - DORMANT_END);
                lerpColorInto(vineColorTmp, 0x226677, 0x44aa99, t);
            } else if (cycleTime < GROWTH_END) {
                const t = (cycleTime - EMERGENCE_END) / (GROWTH_END - EMERGENCE_END);
                lerpColorInto(vineColorTmp, 0x44aa99, 0x88dd55, t);
            } else if (cycleTime < BLOOM_END) {
                const t = (cycleTime - GROWTH_END) / (BLOOM_END - GROWTH_END);
                lerpColorInto(vineColorTmp, 0x88dd55, 0xddaa44, t);
            } else {
                const t = (cycleTime - BLOOM_END) / (CYCLE_DURATION - BLOOM_END);
                lerpColorInto(vineColorTmp, 0xddaa44, 0x221100, t);
            }

            for (let i = 0; i < totalSegments; i++) {
                const v = ALL_VINES[i];
                // Deeper branches brighter, adds organic highlight at tips
                const depthBrightness = 0.65 + (v.depth / 5) * 0.45;
                const r = vineColorTmp.r * depthBrightness;
                const g = vineColorTmp.g * depthBrightness;
                const b = vineColorTmp.b * depthBrightness;
                vineColors[i * 6]     = r;
                vineColors[i * 6 + 1] = g;
                vineColors[i * 6 + 2] = b;
                vineColors[i * 6 + 3] = r;
                vineColors[i * 6 + 4] = g;
                vineColors[i * 6 + 5] = b;
            }
            vineGeom.attributes.color.needsUpdate = true;

            // Flower bloom — warm pulse, size breathing
            if (cycleTime >= BLOOM_END) {
                const fadeT = (cycleTime - BLOOM_END) / (CYCLE_DURATION - BLOOM_END);
                flowerMat.opacity = Math.max(0, 0.9 - fadeT * 0.9);
            } else {
                flowerMat.opacity = 0.75 + Math.sin(time * 1.2) * 0.2;
            }
            flowerMat.size = (isMobile ? 2.6 : 3.4) + Math.sin(time * 1.4) * 0.3;

            // Tower dimming + color cooling
            const structureHealth = Math.max(0.08, 1 - growthProgress * 0.85);
            const flicker = 0.55 + Math.sin(time * 0.6) * 0.08 + Math.sin(time * 4.7) * 0.04;
            towerMaterial.opacity = structureHealth * flicker;
            lerpColorInto(towerColorTmp, 0x4488cc, 0x223344, growthProgress);
            towerMaterial.color.copy(towerColorTmp);

            // Ground grid fades
            (gridMat as any).opacity = Math.max(0.08, 0.35 - growthProgress * 0.25);

            // Ash (falling tech debris)
            const aPos = ashGeom.attributes.position.array as Float32Array;
            for (let i = 0; i < ASH_COUNT; i++) {
                aPos[i * 3 + 1] -= ashSpeed[i];
                if (aPos[i * 3 + 1] < -40) {
                    aPos[i * 3 + 1] = 120;
                    aPos[i * 3]     = (Math.random() - 0.5) * 300;
                    aPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
                }
            }
            ashGeom.attributes.position.needsUpdate = true;
            ashMat.opacity = Math.max(0.1, 0.5 - growthProgress * 0.35);

            // Pollen (rising organic life signal)
            const pPos = pollenGeom.attributes.position.array as Float32Array;
            for (let i = 0; i < POLLEN_COUNT; i++) {
                pPos[i * 3]     += pollenDrift[i * 2];
                pPos[i * 3 + 1] += pollenSpeed[i];
                pPos[i * 3 + 2] += pollenDrift[i * 2 + 1];
                if (pPos[i * 3 + 1] > 100) {
                    pPos[i * 3 + 1] = -40;
                    pPos[i * 3]     = (Math.random() - 0.5) * 220;
                    pPos[i * 3 + 2] = (Math.random() - 0.5) * 220;
                }
            }
            pollenGeom.attributes.position.needsUpdate = true;

            let pollenOpacity = 0;
            if (cycleTime > EMERGENCE_END && cycleTime < BLOOM_END) {
                pollenOpacity = Math.min(
                    0.7,
                    ((cycleTime - EMERGENCE_END) / (BLOOM_END - EMERGENCE_END)) * 0.7
                );
            } else if (cycleTime >= BLOOM_END) {
                pollenOpacity = Math.max(
                    0,
                    0.7 -
                        ((cycleTime - BLOOM_END) / (CYCLE_DURATION - BLOOM_END)) * 0.7
                );
            }
            pollenMat.opacity = pollenOpacity;

            // Bloom intensity ramps with growth
            bloomPass.strength = 0.6 + growthProgress * 0.85;

            // Camera — meditative orbit, rises as bloom peaks
            const orbitRadius = isMobile ? 220 : 175;
            const orbitSpeed = 0.045;
            camera.position.x = Math.sin(time * orbitSpeed) * orbitRadius;
            camera.position.z = Math.cos(time * orbitSpeed) * orbitRadius;
            camera.position.y = 20 + Math.sin(time * 0.03) * 18 + growthProgress * 12;
            camera.lookAt(0, 5 + growthProgress * 12, 0);

            // Subtle swaying on the organic elements
            const sway = 0.018;
            cityGroup.rotation.z = Math.sin(time * 0.4) * sway * 0.25;
            vines.rotation.z = Math.sin(time * 0.35) * sway;
            vines.rotation.x = Math.cos(time * 0.25) * sway;
            flowerPoints.rotation.copy(vines.rotation);

            grainPass.uniforms.time.value = time;
            composer.render();
        };

        animate();

        // ── Cleanup ──────────────────────────────────────────────────────
        return () => {
            isComponentMounted = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            composer.dispose();
            vineGeom.dispose();
            vineMat.dispose();
            flowerGeom.dispose();
            flowerMat.dispose();
            ashGeom.dispose();
            ashMat.dispose();
            pollenGeom.dispose();
            pollenMat.dispose();
            towers.forEach((t) => t.geometry.dispose());
            towerMaterial.dispose();
            gridHelper.geometry.dispose();
            (gridHelper.material as THREE.Material).dispose();
            glowTexture.dispose();
            renderer.dispose();
            if (
                mountRef.current &&
                renderer.domElement &&
                mountRef.current.contains(renderer.domElement)
            ) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Log simulation (toggle-visible HUD)
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs((prev) => {
                const nextLog =
                    LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
                const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
                const updated = [...prev, `[${timestamp}] ${nextLog}`];
                const limit = window.innerWidth < 768 ? 10 : 20;
                return updated.slice(-limit);
            });
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        return () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === 'recording'
            ) {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div
            className="reclamation-container"
            onClick={() => setShowText((p) => !p)}
        >
            <div ref={mountRef} className="reclamation-canvas" />

            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    <span className="record-icon" />
                    {isRecording && (
                        <span className="record-time">{formatTime(recordingTime)}</span>
                    )}
                </button>
            )}

            {showText && (
                <div className="reclamation-hud">
                    <div className="reclamation-hud-bottom">
                        <div className="reclamation-logs" ref={logContainerRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
