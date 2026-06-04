import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ExportFrame } from '../ExportFrame/ExportFrame';
import { decayVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';
import './Decay.css';

// ── Shell constants ──────────────────────────────────────────────────────────
const OUTER_RADIUS = 2.6;
const INNER_RADIUS = 2.1;
const SUBDIVISIONS = 3;
const PARTICLE_COUNT = 260;
const CAMERA_FOV = 50;
const BASE_CAMERA_Z = 7.2;
const EXPORT_FRAMING_RADIUS = OUTER_RADIUS * 1.16;
const EXPORT_CAMERA_MOTION_ALLOWANCE = 0.75;
const NARROW_VIEWPORT_FIT_THRESHOLD = 1;

const getCameraBaseZ = (aspect: number, isExportMode: boolean) => {
    const shouldFitSubject = isExportMode || aspect < NARROW_VIEWPORT_FIT_THRESHOLD;

    if (!shouldFitSubject) {
        return BASE_CAMERA_Z;
    }

    const verticalHalfFov = THREE.MathUtils.degToRad(CAMERA_FOV / 2);
    const verticalDistance = EXPORT_FRAMING_RADIUS / Math.tan(verticalHalfFov);
    const horizontalDistance = EXPORT_FRAMING_RADIUS / (Math.tan(verticalHalfFov) * aspect);

    return Math.max(BASE_CAMERA_Z, verticalDistance, horizontalDistance) + EXPORT_CAMERA_MOTION_ALLOWANCE;
};

interface Fragment {
    homeA: THREE.Vector3;
    homeB: THREE.Vector3;
    homeC: THREE.Vector3;
    center: THREE.Vector3;
    normal: THREE.Vector3;
    // Per-fragment noise phases for idiosyncratic micro-wobble
    noisePhaseA: number;
    noisePhaseB: number;
    // Regional timing seed so the shell doesn't breathe perfectly uniform
    regionSeed: number;
    // 0→1 instantaneous strain, decays exponentially toward 0 after a spasm
    stressAccumulator: number;
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
            homeA: a,
            homeB: b,
            homeC: c,
            center,
            normal,
            noisePhaseA: Math.random() * Math.PI * 2,
            noisePhaseB: Math.random() * Math.PI * 2,
            regionSeed: Math.random(),
            stressAccumulator: 0,
        });
    }
    return fragments;
}

export const Decay: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(decayVisualExport);
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

    useEffect(() => {
        if (!mountRef.current) return;
        let isComponentMounted = true;
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

        // ── Scene ────────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.025);

        const camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            initialSize.width / initialSize.height,
            0.1,
            1000
        );
        let cameraBaseZ = getCameraBaseZ(camera.aspect, exportSettings.isExportMode);
        camera.position.z = cameraBaseZ;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initialSize.width, initialSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ReinhardToneMapping;
        renderer.toneMappingExposure = 1.05;
        mountElement.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        const handleContextLost = (event: Event) => event.preventDefault();

        // ── Post-processing ──────────────────────────────────────────────
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height),
            0.8,
            0.55,
            0.22
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
                    float vig = 1.0 - dot(uv, uv) * 1.45;
                    color.rgb *= clamp(vig, 0.0, 1.0);
                    gl_FragColor = color;
                }
            `,
        });
        composer.addPass(grainPass);

        // ── Lighting ─────────────────────────────────────────────────────
        const keyLight = new THREE.PointLight(0x6688cc, 1.4, 30);
        keyLight.position.set(4, 4, 6);
        scene.add(keyLight);

        const backLight = new THREE.PointLight(0x4455aa, 0.7, 25);
        backLight.position.set(-5, -2, -3);
        scene.add(backLight);

        const rimLight = new THREE.PointLight(0x334488, 0.5, 20);
        rimLight.position.set(0, -3, 5);
        scene.add(rimLight);

        // The molten core — warm light at the sphere's center. Intensity ramps
        // up during strain so light floods through any gaps that open.
        const coreLight = new THREE.PointLight(0xff5522, 0.4, 18);
        coreLight.position.set(0, 0, 0);
        scene.add(coreLight);

        scene.add(new THREE.AmbientLight(0x222244, 0.7));

        // ── Build outer icosahedron fragments ────────────────────────────
        const baseGeom = new THREE.IcosahedronGeometry(OUTER_RADIUS, SUBDIVISIONS);
        const nonIndexed = baseGeom.toNonIndexed();
        const fragments = buildFragments(nonIndexed);
        baseGeom.dispose();
        nonIndexed.dispose();

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
                colors[i9 + v * 3]     = 0.12;
                colors[i9 + v * 3 + 1] = 0.14;
                colors[i9 + v * 3 + 2] = 0.22;
            }
        }

        const shellGeom = new THREE.BufferGeometry();
        shellGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        shellGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        shellGeom.computeVertexNormals();

        const shellMat = new THREE.MeshPhongMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.94,
            side: THREE.DoubleSide,
            shininess: 40,
            specular: new THREE.Color(0x3355bb),
            emissive: new THREE.Color(0x0a0e1a),
        });
        const shellMesh = new THREE.Mesh(shellGeom, shellMat);
        scene.add(shellMesh);

        // Wireframe overlay — subtle seam highlight
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x5588cc,
            transparent: true,
            opacity: 0.14,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const wireMesh = new THREE.Mesh(shellGeom, wireMat);
        scene.add(wireMesh);

        // ── Inner molten core ────────────────────────────────────────────
        // A smaller sphere seen through the gaps when plates strain outward.
        const coreGeom = new THREE.IcosahedronGeometry(INNER_RADIUS, 2);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xff6633,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const coreMesh = new THREE.Mesh(coreGeom, coreMat);
        scene.add(coreMesh);

        // Secondary inner wireframe — gives depth inside the core glow
        const coreWireGeom = new THREE.IcosahedronGeometry(INNER_RADIUS * 0.85, 1);
        const coreWireMat = new THREE.LineBasicMaterial({
            color: 0xff8844,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const coreWireMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(coreWireGeom),
            coreWireMat
        );
        scene.add(coreWireMesh);
        coreWireGeom.dispose();

        // ── Ambient dust ─────────────────────────────────────────────────
        const dustGeom = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(PARTICLE_COUNT * 3);
        const dustSpeeds = new Float32Array(PARTICLE_COUNT);
        const dustDrifts = new Float32Array(PARTICLE_COUNT * 2);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            dustPositions[i * 3]     = (Math.random() - 0.5) * 14;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
            dustSpeeds[i] = 0.0006 + Math.random() * 0.002;
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
            size: 0.04,
            map: dustSprite,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            color: 0x667799,
        });
        const dustPoints = new THREE.Points(dustGeom, dustMat);
        scene.add(dustPoints);

        // ── Animation state ──────────────────────────────────────────────
        let lastFrameTime = performance.now() * 0.001;
        let breathPhase = 0;        // phase accumulator in cycles
        let panicLevel = 0;         // 0→1, slowly builds, discharges on spasm
        let spasmCooldown = 1.5;    // refractory period after spasm
        let shakeTime = 0;          // remaining camera shake duration
        let shakeMag = 0;           // amplitude of current shake

        const triggerSpasm = () => {
            // Pick a random region on the unit sphere
            const region = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();

            const intensity = 0.55 + Math.random() * 0.45;

            for (const f of fragments) {
                const dot = f.normal.dot(region);
                if (dot > 0.1) {
                    // Quadratic falloff — epicenter pushes hard, edges mild
                    const falloff = Math.pow((dot - 0.1) / 0.9, 2);
                    f.stressAccumulator = Math.min(
                        1.0,
                        f.stressAccumulator + intensity * falloff
                    );
                }
            }

            shakeTime = 0.45;
            shakeMag = 0.08 + intensity * 0.14;
        };

        // Pre-allocated scratch
        const _v = new THREE.Vector3();

        // ── Resize handling ──────────────────────────────────────────────
        const resizeToMount = () => {
            const { width, height } = getMountSize();
            camera.aspect = width / height;
            cameraBaseZ = getCameraBaseZ(camera.aspect, exportSettings.isExportMode);
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            composer.setSize(width, height);
            bloomPass.resolution.set(width, height);
        };

        const handleContextRestored = () => {
            resizeToMount();
        };
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

        resizeToMount();

        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        // ── Animation loop ───────────────────────────────────────────────
        let animationId = 0;
        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);

            const time = performance.now() * 0.001;
            const dt = Math.min(time - lastFrameTime, 0.05);
            lastFrameTime = time;

            // Panic ambient accumulation; discharges on spasm
            panicLevel = Math.min(1.0, panicLevel + dt * (0.05 + Math.random() * 0.04));
            spasmCooldown -= dt;

            if (spasmCooldown <= 0 && Math.random() < dt * panicLevel * 2.4) {
                triggerSpasm();
                spasmCooldown = 0.7 + Math.random() * 1.8;
                panicLevel *= 0.15 + Math.random() * 0.3;
            }

            // Breath quickens with panic
            const breathSpeed = 0.38 + panicLevel * 1.05;
            breathPhase += dt * breathSpeed;
            const mainBreath = Math.sin(breathPhase * Math.PI * 2);
            const fastBreath = Math.sin(breathPhase * Math.PI * 6.3) * 0.28;

            // ── Update outer shell fragments ─────────────────────────────
            let totalStress = 0;
            for (let i = 0; i < fragments.length; i++) {
                const f = fragments[i];
                totalStress += f.stressAccumulator;

                // Synchronized breath
                let offset = mainBreath * 0.045 + fastBreath * 0.015;
                // Per-fragment micro-wobble (two octaves out of phase)
                offset += Math.sin(time * 1.3 + f.noisePhaseA) * 0.009;
                offset += Math.sin(time * 2.7 + f.noisePhaseB) * 0.006;
                // Panic amplifies
                offset *= 1 + panicLevel * 0.7;
                // Regional phase delay so the shell isn't perfectly uniform
                offset += Math.sin(time * 1.1 + f.regionSeed * 6.28) * 0.012;
                // Spasm — sharp outward push
                offset += f.stressAccumulator * 0.32;
                // Stress decays fast — plates "slam shut" after straining
                f.stressAccumulator *= Math.pow(0.08, dt);

                // During strain, shrink each triangle around its centroid
                // so visible gaps open between neighbors as they bulge out
                const stressScale = 1 - f.stressAccumulator * 0.38 - panicLevel * 0.05;

                const i9 = i * 9;

                // Vertex A
                _v.copy(f.homeA).sub(f.center).multiplyScalar(stressScale).add(f.center);
                _v.addScaledVector(f.normal, offset);
                positions[i9]     = _v.x; positions[i9 + 1] = _v.y; positions[i9 + 2] = _v.z;
                // Vertex B
                _v.copy(f.homeB).sub(f.center).multiplyScalar(stressScale).add(f.center);
                _v.addScaledVector(f.normal, offset);
                positions[i9 + 3] = _v.x; positions[i9 + 4] = _v.y; positions[i9 + 5] = _v.z;
                // Vertex C
                _v.copy(f.homeC).sub(f.center).multiplyScalar(stressScale).add(f.center);
                _v.addScaledVector(f.normal, offset);
                positions[i9 + 6] = _v.x; positions[i9 + 7] = _v.y; positions[i9 + 8] = _v.z;

                // Vertex color — base cool, warm reveals stress
                const stressLocal = Math.min(1, f.stressAccumulator + panicLevel * 0.22);
                const r = 0.12 + stressLocal * 0.55;
                const g = 0.14 + stressLocal * 0.18;
                const b = 0.22 - stressLocal * 0.12;
                for (let v = 0; v < 3; v++) {
                    colors[i9 + v * 3]     = r;
                    colors[i9 + v * 3 + 1] = g;
                    colors[i9 + v * 3 + 2] = b;
                }
            }
            const avgStress = totalStress / fragments.length;

            shellGeom.attributes.position.needsUpdate = true;
            shellGeom.attributes.color.needsUpdate = true;
            shellGeom.computeVertexNormals();

            // ── Inner core responds to breath + strain ───────────────────
            const coreBreath = 1 + mainBreath * 0.025 + panicLevel * 0.04;
            coreMesh.scale.setScalar(coreBreath);
            coreWireMesh.scale.setScalar(coreBreath * 0.98);
            coreMat.opacity = 0.2 + avgStress * 0.75 + panicLevel * 0.22;
            coreWireMat.opacity = 0.18 + avgStress * 0.55;

            // Core light — floods out during strain
            coreLight.intensity = 0.4 + avgStress * 22 + panicLevel * 2.5;

            // Bloom swells with strain
            bloomPass.strength = 0.75 + avgStress * 1.4 + panicLevel * 0.35;

            // ── Rotations ────────────────────────────────────────────────
            shellMesh.rotation.y = time * 0.11;
            shellMesh.rotation.x = Math.sin(time * 0.17) * 0.08;
            wireMesh.rotation.copy(shellMesh.rotation);
            coreMesh.rotation.y = -time * 0.07;
            coreMesh.rotation.x = time * 0.04;
            coreWireMesh.rotation.y = time * 0.13;
            coreWireMesh.rotation.z = time * 0.05;

            // ── Camera — drift + shake on spasm + pull-in on panic ───────
            const shakeX = shakeTime > 0
                ? (Math.random() - 0.5) * shakeMag * (shakeTime / 0.45)
                : 0;
            const shakeY = shakeTime > 0
                ? (Math.random() - 0.5) * shakeMag * (shakeTime / 0.45)
                : 0;
            shakeTime = Math.max(0, shakeTime - dt);

            camera.position.x = Math.sin(time * 0.08) * 0.25 + shakeX;
            camera.position.y = Math.cos(time * 0.06) * 0.2 + shakeY;
            camera.position.z = cameraBaseZ - panicLevel * 0.55 - avgStress * 0.3;
            camera.lookAt(0, 0, 0);

            // ── Dust drift ───────────────────────────────────────────────
            const dPos = dustGeom.attributes.position.array as Float32Array;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                dPos[i * 3]     += dustDrifts[i * 2];
                dPos[i * 3 + 1] += dustSpeeds[i];
                dPos[i * 3 + 2] += dustDrifts[i * 2 + 1];
                if (dPos[i * 3 + 1] > 7) {
                    dPos[i * 3 + 1] = -7;
                    dPos[i * 3]     = (Math.random() - 0.5) * 14;
                    dPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
                }
            }
            dustGeom.attributes.position.needsUpdate = true;
            dustPoints.rotation.y = time * 0.015;

            grainPass.uniforms.time.value = time;
            composer.render();
        };

        animate();

        // ── Cleanup ──────────────────────────────────────────────────────
        return () => {
            isComponentMounted = false;
            if (animationId) cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            composer.dispose();
            shellGeom.dispose();
            shellMat.dispose();
            wireMat.dispose();
            coreGeom.dispose();
            coreMat.dispose();
            (coreWireMesh.geometry as THREE.BufferGeometry).dispose();
            coreWireMat.dispose();
            dustGeom.dispose();
            dustMat.dispose();
            dustSprite.dispose();
            renderer.dispose();
            if (
                mountElement &&
                renderer.domElement &&
                mountElement.contains(renderer.domElement)
            ) {
                mountElement.removeChild(renderer.domElement);
            }
        };
    }, [exportSettings.isExportMode]);

    return (
        <ExportFrame aspect={exportSettings.aspect} active={exportSettings.isExportMode}>
            <div className="decay-container">
                <div ref={mountRef} className="decay-canvas" />
                {process.env.NODE_ENV !== 'production' && !exportSettings.isExportMode && (
                    <button
                        className={`record-button ${isRecording ? 'recording' : ''}`}
                        onClick={toggleRecording}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                        <span className="record-icon" />
                        {isRecording && (
                            <span className="record-time">
                                {Math.floor(recordingTime / 60)}:
                                {(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                        )}
                    </button>
                )}
            </div>
        </ExportFrame>
    );
};
