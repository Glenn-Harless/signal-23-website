import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { gsap } from 'gsap';
import './Stepwell.css';

// --- Custom Fog Shader ---
const CustomFogShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "tDepth": { value: null },
        "fogColor": { value: new THREE.Color(0x050505) },
        "nearColor": { value: new THREE.Color(0x333333) },
        "fogDensity": { value: 0.008 },
        "cameraNear": { value: 0.1 },
        "cameraFar": { value: 500.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #include <packing>
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform vec3 fogColor;
        uniform vec3 nearColor;
        uniform float fogDensity;
        uniform float cameraNear;
        uniform float cameraFar;
        varying vec2 vUv;

        float readDepth(sampler2D depthSampler, vec2 coord) {
            float fragCoordZ = texture2D(depthSampler, coord).x;
            float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
            return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float depth = readDepth(tDepth, vUv);
            
            // Simplified fog for debugging - ensure visibility
            float fogFactor = clamp(depth * 2.0, 0.0, 1.0);
            
            vec3 finalFogColor = mix(nearColor, fogColor, fogFactor);
            gl_FragColor = mix(texel, vec4(finalFogColor, 1.0), fogFactor);
        }
    `
};

// --- Film Grain Shader ---
const FilmGrainShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 },
        "amount": { value: 0.04 }
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
        uniform float amount;
        varying vec2 vUv;

        float random(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float noise = (random(vUv + time) - 0.5) * amount;
            gl_FragColor = vec4(texel.rgb + noise, texel.a);
        }
    `
};

const STEPWELL_LOGS = [
    "DEPTH_SCAN_ACTIVE",
    "STRUCTURAL_INTEGRITY: NOMINAL",
    "GRAVITY_PULL: 9.81m/s²",
    "AMBIENT_TEMP: 14°F",
    "VOIDING_DETECTION_POSITIVE",
    "RECURSION_DEPTH_SYNCING...",
    "OPTICAL_FOG_DENSITY: 0.015",
    "SENSORS_STABILIZED",
    "CHAND_BAORI_REF_LOADED",
    "BRUTALIST_MAPPING_COMPLETE",
    "ANOMALY_DETECTED: NULL",
    "GEOMETRY_BUFFER_SYNCING",
    "INFINITE_DESCENT_INITIALIZED",
];

const LEVEL_COUNT = 15;
const LEVEL_HEIGHT = 40;
const INNER_SIZE = 60;
const WALL_THICKNESS = 15;

export const Stepwell: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);
    const levelsRef = useRef<THREE.Group[]>([]);
    const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
    const [logs, setLogs] = useState<string[]>([]);

    // GSAP persistent values
    const animationState = useRef({
        fallProgress: 0,
        driftX: 0,
        driftZ: 0,
        driftRot: 0
    });

    useEffect(() => {
        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // --- Renderer ---
        const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x050505);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // --- Scene & Camera ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Depth texture for custom fog
        const depthTexture = new THREE.DepthTexture(width, height);
        const renderTarget = new THREE.WebGLRenderTarget(width, height, {
            depthBuffer: true,
            stencilBuffer: false
        });
        renderTarget.depthTexture = depthTexture;

        // --- Post Processing ---
        const composer = new EffectComposer(renderer, renderTarget);
        composerRef.current = composer;

        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        const fogPass = new ShaderPass(CustomFogShader);
        fogPass.uniforms.tDepth.value = depthTexture;
        composer.addPass(fogPass);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
        composer.addPass(bloomPass);

        const grainPass = new ShaderPass(FilmGrainShader);
        composer.addPass(grainPass);

        // --- Materials ---
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });

        // --- Architecture Generation ---
        const createLevel = (y: number, index: number) => {
            const group = new THREE.Group();
            group.position.y = y;

            const outerSize = INNER_SIZE + WALL_THICKNESS * 2;

            // Main Walls
            const wallGeo = new THREE.BoxGeometry(outerSize, LEVEL_HEIGHT, WALL_THICKNESS);

            // Four walls forming a square
            const wallNorth = new THREE.Mesh(wallGeo, wallMaterial);
            wallNorth.position.z = -INNER_SIZE / 2 - WALL_THICKNESS / 2;
            group.add(wallNorth);

            const wallSouth = new THREE.Mesh(wallGeo, wallMaterial);
            wallSouth.position.z = INNER_SIZE / 2 + WALL_THICKNESS / 2;
            group.add(wallSouth);

            const wallEast = new THREE.Mesh(wallGeo, wallMaterial);
            wallEast.rotation.y = Math.PI / 2;
            wallEast.position.x = INNER_SIZE / 2 + WALL_THICKNESS / 2;
            group.add(wallEast);

            const wallWest = new THREE.Mesh(wallGeo, wallMaterial);
            wallWest.rotation.y = Math.PI / 2;
            wallWest.position.x = -INNER_SIZE / 2 - WALL_THICKNESS / 2;
            group.add(wallWest);

            // Procedural Steps
            const stepCount = 12;
            const stepWidth = INNER_SIZE / stepCount;
            const stepHeight = 2;
            const stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, WALL_THICKNESS * 0.8);

            // Randomly add steps to different sides
            [wallNorth, wallSouth, wallEast, wallWest].forEach((wall, sideIndex) => {
                if (Math.random() > 0.3) {
                    for (let i = 0; i < stepCount; i++) {
                        // Inverted pyramid steps like Chand Baori
                        const step = new THREE.Mesh(stepGeo, wallMaterial);
                        const progress = i / (stepCount - 1);
                        const pyramidFactor = 1.0 - Math.abs(progress - 0.5) * 2.0;

                        step.position.y = -LEVEL_HEIGHT / 2 + i * (LEVEL_HEIGHT / stepCount);
                        step.position.x = (progress - 0.5) * INNER_SIZE;
                        step.position.z = (INNER_SIZE / 2 + WALL_THICKNESS * 0.4) * (sideIndex < 2 ? 1 : 0);

                        // Local positioning relative to wall rot is tricky, simpler to just add to group
                        // But for now, let's keep it simple and just add some boxy details
                        const detailGeo = new THREE.BoxGeometry(stepWidth, 2, 4);
                        const detail = new THREE.Mesh(detailGeo, wallMaterial);
                        detail.position.set(
                            sideIndex < 2 ? (progress - 0.5) * INNER_SIZE : (sideIndex === 2 ? INNER_SIZE / 2 : -INNER_SIZE / 2),
                            -LEVEL_HEIGHT / 2 + (i * 3),
                            sideIndex < 2 ? (sideIndex === 0 ? -INNER_SIZE / 2 : INNER_SIZE / 2) : (progress - 0.5) * INNER_SIZE
                        );
                        if (sideIndex >= 2) detail.rotation.y = Math.PI / 2;
                        group.add(detail);
                    }
                }

                // Add an occasional alcove
                if (Math.random() > 0.7) {
                    const alcoveGeo = new THREE.BoxGeometry(8, 12, 4);
                    const alcove = new THREE.Mesh(alcoveGeo, wallMaterial);
                    alcove.position.set(
                        sideIndex < 2 ? (Math.random() - 0.5) * INNER_SIZE * 0.5 : (sideIndex === 2 ? INNER_SIZE / 2 - 2 : -INNER_SIZE / 2 + 2),
                        (Math.random() - 0.5) * LEVEL_HEIGHT * 0.5,
                        sideIndex < 2 ? (sideIndex === 0 ? -INNER_SIZE / 2 + 2 : INNER_SIZE / 2 - 2) : (Math.random() - 0.5) * INNER_SIZE * 0.5
                    );
                    if (sideIndex >= 2) alcove.rotation.y = Math.PI / 2;
                    group.add(alcove);

                    // Dim light in alcove
                    const pLight = new THREE.PointLight(0xffccaa, 20, 30);
                    pLight.position.copy(alcove.position);
                    group.add(pLight);
                }
            });

            scene.add(group);
            return group;
        };

        for (let i = 0; i < LEVEL_COUNT; i++) {
            levelsRef.current.push(createLevel(-i * LEVEL_HEIGHT, i));
        }

        // --- Lighting ---
        const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambLight);

        const pointLight = new THREE.PointLight(0xffffff, 5000, 1000);
        pointLight.position.set(0, 0, 0);
        scene.add(pointLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(10, 100, 10);
        scene.add(sunLight);

        // --- Animations ---
        const driftTween = gsap.to(animationState.current, {
            driftX: 2.5,
            driftZ: 2.5,
            driftRot: 0.05,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        const descentSpeed = 0.15;
        let animId: number = 0;

        const animate = (time: number) => {
            animId = requestAnimationFrame(animate);
            const t = time * 0.001;

            animationState.current.fallProgress += descentSpeed;
            const currentY = -animationState.current.fallProgress;

            // Camera Motion
            camera.position.y = currentY + 50;
            camera.position.x = Math.sin(t * 0.4) * animationState.current.driftX;
            camera.position.z = Math.cos(t * 0.3) * animationState.current.driftZ;
            camera.rotation.x = -Math.PI / 2; // FORCE LOOK DOWN
            camera.rotation.z = Math.sin(t * 0.2) * animationState.current.driftRot;

            // Point light follows camera
            pointLight.position.set(camera.position.x, camera.position.y + 10, camera.position.z);

            // Level Recycling
            levelsRef.current.forEach(level => {
                if (level.position.y > camera.position.y + 20) {
                    level.position.y -= LEVEL_COUNT * LEVEL_HEIGHT;
                    // Slightly vary visuals on recycle would be cool, but for now just move it
                }
            });

            // Shader updates
            grainPass.uniforms.time.value = t;

            if (Math.random() > 0.98) {
                setCoords({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
            }

            composer.render();
        };

        requestAnimationFrame(animate);

        const handleResize = () => {
            const w = mountRef.current?.clientWidth || window.innerWidth;
            const h = mountRef.current?.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            composer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animId);
            driftTween.kill();

            // Dispose all scene objects
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

            // Dispose shared material
            wallMaterial.dispose();

            // Clear scene and levels ref
            scene.clear();
            levelsRef.current = [];

            // Dispose post-processing
            composer.dispose();

            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Log simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => {
                const nextLog = STEPWELL_LOGS[Math.floor(Math.random() * STEPWELL_LOGS.length)];
                const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
                return [...prev, `[${timestamp}] ${nextLog}`].slice(-12);
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="stepwell-container">
            <div ref={mountRef} className="stepwell-canvas" />

            <div className="stepwell-ui">
                <div className="ui-header">
                    <span className="scrolling-text">STEPWELL // RECURSIVE ARCHITECTURE // DEPTH ANALYSIS // BRUTALIST DESCENT</span>
                </div>

                <div className="ui-coords">
                    <div className="coord-item">
                        <span className="label">POS_X</span>
                        <span className="value">{coords.x.toFixed(4)}</span>
                    </div>
                    <div className="coord-item">
                        <span className="label">POS_Y</span>
                        <span className="value">{coords.y.toFixed(4)}</span>
                    </div>
                    <div className="coord-item">
                        <span className="label">POS_Z</span>
                        <span className="value">{coords.z.toFixed(4)}</span>
                    </div>
                </div>

                <div className="ui-logs">
                    {logs.map((log, i) => (
                        <div key={i} className="log-entry">{log}</div>
                    ))}
                </div>

                <div className="ui-footer">
                    SIGNAL-23 SYSTEM STATUS: <span className="status-ok">OPERATIONAL</span>
                </div>
            </div>

            <div className="vignette" />
        </div>
    );
};

