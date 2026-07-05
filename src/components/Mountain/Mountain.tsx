import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Mountain.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { mountainVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// A single peak node-ified by elevation: stacked contour rings (loops of
// nodes) wired to the rings above/below into a wireframe massif. Survey data
// streams in base→summit, holds, then erodes. Angular, crystalline.

const NLEV = 30;   // contour rings, base → summit
const NSEG = 64;   // nodes per ring
const H = 120;     // summit height
const BASE_R = 96; // base radius

type Ridge = { m: number; amp: number; phase: number };
type MountainParams = {
    ridges: Ridge[]; noiseAmp: number; sharpness: number; seed: number;
    leanX: number; leanZ: number;
};

const makeParams = (): MountainParams => ({
    ridges: [
        { m: 2, amp: 0.20 + Math.random() * 0.18, phase: Math.random() * 6.283 },
        { m: 3, amp: 0.16 + Math.random() * 0.14, phase: Math.random() * 6.283 },
        { m: 5, amp: 0.10 + Math.random() * 0.10, phase: Math.random() * 6.283 },
        { m: 8, amp: 0.05 + Math.random() * 0.07, phase: Math.random() * 6.283 },
    ],
    noiseAmp: 0.07 + Math.random() * 0.06,
    sharpness: 0.68 + Math.random() * 0.28,
    seed: Math.floor(Math.random() * 100000),
    leanX: (Math.random() - 0.5) * 0.5,
    leanZ: (Math.random() - 0.5) * 0.5,
});

const hash = (a: number, b: number, seed: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7 + seed * 0.017) * 43758.5453;
    return s - Math.floor(s);
};

// Reveal-driven fade so the lattice builds/erodes across a moving front.
const revealChunk = `
    uniform float uReveal;
    uniform float uH;
    attribute float aHeight;
    varying float vH;
    varying float vFront;
`;

const nodeMat = () => new THREE.ShaderMaterial({
    uniforms: { uReveal: { value: 0 }, uH: { value: H }, uSize: { value: 3.2 } },
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
        ${revealChunk}
        uniform float uSize;
        void main() {
            vH = aHeight;
            vFront = 1.0 - smoothstep(0.0, 10.0, abs(uReveal - aHeight));
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * (1.0 + vFront * 1.6) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
        }
    `,
    fragmentShader: `
        varying float vH;
        varying float vFront;
        uniform float uReveal;
        uniform float uH;
        void main() {
            if (vH > uReveal) discard;
            vec2 d = gl_PointCoord - 0.5;
            if (dot(d, d) > 0.25) discard;
            float summit = smoothstep(0.35, 1.0, vH / uH);
            // fade the pile-up of nodes converging on the summit point
            float conv = 1.0 - smoothstep(0.9, 1.0, vH / uH);
            vec3 c = mix(vec3(0.50, 0.74, 0.92), vec3(0.86, 0.92, 0.98), summit);
            c += vec3(0.6, 0.78, 0.95) * vFront * 0.8;
            gl_FragColor = vec4(c, (0.5 + 0.28 * summit + vFront * 0.3) * conv);
        }
    `,
});

const edgeMat = () => new THREE.ShaderMaterial({
    uniforms: { uReveal: { value: 0 }, uH: { value: H } },
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
        ${revealChunk}
        void main() {
            vH = aHeight;
            vFront = 1.0 - smoothstep(0.0, 9.0, abs(uReveal - aHeight));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying float vH;
        varying float vFront;
        uniform float uReveal;
        uniform float uH;
        void main() {
            if (vH > uReveal) discard;
            float summit = smoothstep(0.3, 1.0, vH / uH);
            float conv = 1.0 - smoothstep(0.9, 1.0, vH / uH);
            vec3 c = vec3(0.28, 0.58, 0.78) * (0.55 + 0.4 * summit);
            c += vec3(0.55, 0.75, 0.95) * vFront * 0.7;
            gl_FragColor = vec4(c, ((0.30 + 0.32 * summit) + vFront * 0.4) * conv);
        }
    `,
});

const faceMat = () => new THREE.ShaderMaterial({
    uniforms: { uReveal: { value: 0 }, uH: { value: H } },
    transparent: false, depthWrite: true, depthTest: true,
    polygonOffset: true, polygonOffsetFactor: 1.2, polygonOffsetUnits: 1.2,
    vertexShader: `
        ${revealChunk}
        attribute vec3 aNormal;
        varying vec3 vN;
        void main() {
            vH = aHeight;
            vN = normalize(mat3(modelViewMatrix) * aNormal);
            vFront = 0.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying float vH;
        varying vec3 vN;
        uniform float uReveal;
        uniform float uH;
        void main() {
            if (vH > uReveal) discard;
            vec3 lightDir = normalize(vec3(0.35, 0.8, 0.45));
            float ndl = clamp(dot(normalize(vN), lightDir), 0.0, 1.0);
            float summit = smoothstep(0.4, 1.0, vH / uH);
            vec3 dark = vec3(0.02, 0.05, 0.09);
            vec3 lit = vec3(0.16, 0.30, 0.44);
            vec3 c = mix(dark, lit, ndl);
            c += vec3(0.12, 0.16, 0.22) * summit; // snowlit crown
            gl_FragColor = vec4(c, 1.0);
        }
    `,
});

export const Mountain: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(mountainVisualExport);

    const [isRecording, setIsRecording] = React.useState(false);
    const [recordingTime, setRecordingTime] = React.useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startRecording = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const stream = canvas.captureStream(60);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000,
            });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `mountain-${Date.now()}.webm`; a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true); setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
        } catch (err) { console.error('Recording failed:', err); }
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
        isRecording ? stopRecording() : startRecording();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;
        const mountElement = containerRef.current;

        const getMountSize = () => {
            const rect = mountElement.getBoundingClientRect();
            const width = rect.width || mountElement.clientWidth || window.innerWidth;
            const height = rect.height || mountElement.clientHeight || window.innerHeight;
            return { width: Math.max(1, Math.floor(width)), height: Math.max(1, Math.floor(height)) };
        };
        const initialSize = getMountSize();

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02060c);

        const camera = new THREE.PerspectiveCamera(42, initialSize.width / initialSize.height, 1, 4000);
        const fitCamera = (aspect: number) => {
            camera.aspect = aspect;
            const dist = 315 - Math.min(60, (aspect < 1 ? (1 / aspect) * 40 : 0));
            camera.position.set(0, H * 0.72, dist);
            camera.lookAt(0, H * 0.40, 0);
            camera.updateProjectionMatrix();
        };
        fitCamera(initialSize.width / initialSize.height);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(initialSize.width, initialSize.height, false);
        const canvas = renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        mountElement.appendChild(canvas);
        canvasRef.current = canvas;

        const massif = new THREE.Group();
        scene.add(massif);

        // ── Geometry buffers (fixed topology; positions refilled on regen) ──
        const gridXYZ = new Float32Array((NLEV * NSEG + 1) * 3); // +1 summit
        const summitIdx = NLEV * NSEG;

        const gi = (k: number, seg: number) => (k * NSEG + seg) * 3;

        const buildGrid = (p: MountainParams) => {
            for (let k = 0; k < NLEV; k++) {
                const tk = k / (NLEV - 1);
                const y = H * tk;
                const prof = BASE_R * Math.pow(1 - tk, p.sharpness);
                const ampFade = 0.35 + 0.65 * (1 - tk);
                // the peak axis leans with height, so the summit sits off-centre
                const lean = Math.pow(tk, 1.4) * BASE_R;
                const cxk = p.leanX * lean;
                const czk = p.leanZ * lean;
                for (let seg = 0; seg < NSEG; seg++) {
                    const th = (seg / NSEG) * Math.PI * 2;
                    let rr = 1;
                    for (const rg of p.ridges) rr += rg.amp * ampFade * Math.sin(rg.m * th + rg.phase);
                    rr += (hash(k, seg, p.seed) - 0.5) * p.noiseAmp;
                    const r = Math.max(0, prof * rr);
                    const idx = gi(k, seg);
                    gridXYZ[idx] = cxk + r * Math.cos(th);
                    gridXYZ[idx + 1] = y;
                    gridXYZ[idx + 2] = czk + r * Math.sin(th);
                }
            }
            gridXYZ[summitIdx * 3] = p.leanX * BASE_R;
            gridXYZ[summitIdx * 3 + 1] = H;
            gridXYZ[summitIdx * 3 + 2] = p.leanZ * BASE_R;
        };

        // node geometry
        const nodePos = new Float32Array((NLEV * NSEG + 1) * 3);
        const nodeH = new Float32Array(NLEV * NSEG + 1);
        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
        nodeGeo.setAttribute('aHeight', new THREE.BufferAttribute(nodeH, 1));

        // edge geometry (ring loops + struts + summit spokes)
        const ringSeg = NLEV * NSEG;
        const strutSeg = (NLEV - 1) * NSEG;
        const summitSeg = NSEG;
        const edgeVerts = (ringSeg + strutSeg + summitSeg) * 2;
        const edgePos = new Float32Array(edgeVerts * 3);
        const edgeH = new Float32Array(edgeVerts);
        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
        edgeGeo.setAttribute('aHeight', new THREE.BufferAttribute(edgeH, 1));

        // face geometry (quad pairs + summit cap), flat-shaded
        const faceTris = (NLEV - 1) * NSEG * 2 + NSEG;
        const faceVerts = faceTris * 3;
        const facePos = new Float32Array(faceVerts * 3);
        const faceH = new Float32Array(faceVerts);
        const faceN = new Float32Array(faceVerts * 3);
        const faceGeo = new THREE.BufferGeometry();
        faceGeo.setAttribute('position', new THREE.BufferAttribute(facePos, 3));
        faceGeo.setAttribute('aHeight', new THREE.BufferAttribute(faceH, 1));
        faceGeo.setAttribute('aNormal', new THREE.BufferAttribute(faceN, 3));

        const getNode = (k: number, seg: number, out: THREE.Vector3) => {
            if (k >= NLEV) { out.set(gridXYZ[summitIdx * 3], gridXYZ[summitIdx * 3 + 1], gridXYZ[summitIdx * 3 + 2]); return; }
            const i = gi(k, seg % NSEG);
            out.set(gridXYZ[i], gridXYZ[i + 1], gridXYZ[i + 2]);
        };

        const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
        const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();

        const rebuild = (p: MountainParams) => {
            buildGrid(p);

            // nodes
            for (let k = 0; k < NLEV; k++) {
                for (let seg = 0; seg < NSEG; seg++) {
                    const s = gi(k, seg);
                    nodePos[s] = gridXYZ[s]; nodePos[s + 1] = gridXYZ[s + 1]; nodePos[s + 2] = gridXYZ[s + 2];
                    nodeH[k * NSEG + seg] = gridXYZ[s + 1];
                }
            }
            nodePos[summitIdx * 3] = gridXYZ[summitIdx * 3];
            nodePos[summitIdx * 3 + 1] = gridXYZ[summitIdx * 3 + 1];
            nodePos[summitIdx * 3 + 2] = gridXYZ[summitIdx * 3 + 2];
            nodeH[summitIdx] = H;

            // edges
            let e = 0, eh = 0;
            const pushEdge = (a: THREE.Vector3, b: THREE.Vector3) => {
                edgePos[e++] = a.x; edgePos[e++] = a.y; edgePos[e++] = a.z; edgeH[eh++] = a.y;
                edgePos[e++] = b.x; edgePos[e++] = b.y; edgePos[e++] = b.z; edgeH[eh++] = b.y;
            };
            for (let k = 0; k < NLEV; k++) {
                for (let seg = 0; seg < NSEG; seg++) {
                    getNode(k, seg, vA); getNode(k, seg + 1, vB); pushEdge(vA, vB); // ring loop
                }
            }
            for (let k = 0; k < NLEV - 1; k++) {
                for (let seg = 0; seg < NSEG; seg++) {
                    getNode(k, seg, vA); getNode(k + 1, seg, vB); pushEdge(vA, vB); // strut
                }
            }
            for (let seg = 0; seg < NSEG; seg++) {
                getNode(NLEV - 1, seg, vA); getNode(NLEV, seg, vB); pushEdge(vA, vB); // summit spoke
            }

            // faces
            let f = 0, fh = 0, fn = 0;
            const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
                e1.subVectors(b, a); e2.subVectors(c, a); nrm.crossVectors(e1, e2).normalize();
                const verts = [a, b, c];
                for (const v of verts) {
                    facePos[f++] = v.x; facePos[f++] = v.y; facePos[f++] = v.z;
                    faceH[fh++] = v.y;
                    faceN[fn++] = nrm.x; faceN[fn++] = nrm.y; faceN[fn++] = nrm.z;
                }
            };
            for (let k = 0; k < NLEV - 1; k++) {
                for (let seg = 0; seg < NSEG; seg++) {
                    getNode(k, seg, vA); getNode(k, seg + 1, vB); getNode(k + 1, seg, vC);
                    pushTri(vA, vB, vC);
                    getNode(k, seg + 1, vA); getNode(k + 1, seg + 1, vB); getNode(k + 1, seg, vC);
                    pushTri(vA, vB, vC);
                }
            }
            for (let seg = 0; seg < NSEG; seg++) {
                getNode(NLEV - 1, seg, vA); getNode(NLEV - 1, seg + 1, vB); getNode(NLEV, seg, vC);
                pushTri(vA, vB, vC);
            }

            nodeGeo.attributes.position.needsUpdate = true;
            nodeGeo.attributes.aHeight.needsUpdate = true;
            edgeGeo.attributes.position.needsUpdate = true;
            edgeGeo.attributes.aHeight.needsUpdate = true;
            faceGeo.attributes.position.needsUpdate = true;
            faceGeo.attributes.aHeight.needsUpdate = true;
            faceGeo.attributes.aNormal.needsUpdate = true;
        };

        const faces = new THREE.Mesh(faceGeo, faceMat());
        faces.frustumCulled = false;
        massif.add(faces);
        const edges = new THREE.LineSegments(edgeGeo, edgeMat());
        edges.frustumCulled = false;
        massif.add(edges);
        const nodes = new THREE.Points(nodeGeo, nodeMat());
        nodes.frustumCulled = false;
        massif.add(nodes);

        const setReveal = (v: number) => {
            (faces.material as THREE.ShaderMaterial).uniforms.uReveal.value = v;
            (edges.material as THREE.ShaderMaterial).uniforms.uReveal.value = v;
            (nodes.material as THREE.ShaderMaterial).uniforms.uReveal.value = v;
        };

        rebuild(makeParams());

        // ── Post ──
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), 0.55, 0.55, 0.35);
        composer.addPass(bloomPass);
        composer.setSize(initialSize.width, initialSize.height);

        // ── Cycle: build → hold → erode → regen ──
        const T_BUILD = 8, T_HOLD = 7, T_ERODE = 5;
        let phaseT = 0;
        let phase: 'build' | 'hold' | 'erode' = 'build';
        setReveal(-1);

        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            phaseT += dt;

            massif.rotation.y += dt * 0.16;

            if (phase === 'build') {
                const k = Math.min(1, phaseT / T_BUILD);
                setReveal(-2 + (H + 6) * k);
                if (k >= 1) { phase = 'hold'; phaseT = 0; }
            } else if (phase === 'hold') {
                setReveal(H + 6);
                if (phaseT >= T_HOLD) { phase = 'erode'; phaseT = 0; }
            } else {
                const k = Math.min(1, phaseT / T_ERODE);
                setReveal((H + 6) * (1 - k) - 2);
                if (k >= 1) { rebuild(makeParams()); phase = 'build'; phaseT = 0; }
            }

            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
            bloomPass.setSize(width, height);
            fitCamera(width / height);
        };
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            nodeGeo.dispose(); edgeGeo.dispose(); faceGeo.dispose();
            (nodes.material as THREE.Material).dispose();
            (edges.material as THREE.Material).dispose();
            (faces.material as THREE.Material).dispose();
            composer.dispose();
            renderer.dispose();
            if (mountElement.contains(canvas)) mountElement.removeChild(canvas);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, [exportSettings.isExportMode]);

    return (
        <ExportFrame aspect={exportSettings.aspect} active={exportSettings.isExportMode}>
            <div ref={containerRef} className="mountain-stage">
                {!exportSettings.isExportMode && (
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
        </ExportFrame>
    );
};

export default Mountain;
