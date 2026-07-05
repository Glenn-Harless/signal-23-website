import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Cloud.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { cloudVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

const MAX_CENTERS = 22;

// Metaball fill: the soft cloud body. The scalar field is a sum of inverse-
// square "puffs"; the isosurface is the billowing outline. Shaded with a
// top light so the crown reads sunlit-bone and the base falls to shadow-blue.
const fillFrag = `
    precision highp float;
    uniform vec4 uCenters[${MAX_CENTERS}]; // xy = position (virtual space), z = radius, w = strength
    uniform int uCount;
    uniform float uAspect;
    uniform float uIso;
    varying vec2 vUv;

    float field(vec2 p) {
        float f = 0.0;
        for (int i = 0; i < ${MAX_CENTERS}; i++) {
            if (i >= uCount) break;
            vec4 c = uCenters[i];
            vec2 d = p - c.xy;
            f += c.w * (c.z * c.z) / (dot(d, d) + 0.00035);
        }
        return f;
    }

    void main() {
        vec2 vp = vec2(vUv.x * uAspect, vUv.y);
        float f = field(vp);
        // density: tight transition across the isosurface
        float dns = smoothstep(uIso * 0.78, uIso * 1.35, f);

        // finite-difference gradient → fake surface normal for lighting.
        // The field increases *inward*, so the outward normal is -gradient.
        float e = 0.004;
        float fx = field(vp + vec2(e, 0.0)) - field(vp - vec2(e, 0.0));
        float fy = field(vp + vec2(0.0, e)) - field(vp - vec2(0.0, e));
        vec2 n = normalize(-vec2(fx, fy) + 1e-5);
        vec2 lightDir = normalize(vec2(0.15, 1.0));
        float ndl = clamp(dot(n, lightDir), 0.0, 1.0); // top-facing surfaces are sunlit

        vec3 sky    = vec3(0.008, 0.024, 0.047);
        vec3 shadow = vec3(0.20, 0.30, 0.42); // shadowed underside — soft blue, not black
        vec3 mid    = vec3(0.44, 0.60, 0.71);
        vec3 sun    = vec3(0.80, 0.87, 0.93); // sunlit crown, bone (kept < 1 so bloom adds glow)

        vec3 body = mix(shadow, mid, smoothstep(-0.2, 0.6, ndl));
        body = mix(body, sun, smoothstep(0.45, 0.95, ndl));

        // deep interior sits a touch darker so the body isn't a flat fill
        float core = smoothstep(uIso * 1.3, uIso * 5.0, f);
        body *= (1.0 - 0.12 * core);

        // subtle bright rim right at the isosurface
        float rim = exp(-pow((f - uIso) / (uIso * 0.4), 2.0));
        body += vec3(0.4, 0.5, 0.6) * rim * 0.3;

        vec3 col = mix(sky, body, dns);
        gl_FragColor = vec4(col, 1.0);
    }
`;

const fillVert = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

type Puff = {
    kind: 'body' | 'wisp';
    // body: offset from the cluster centroid, in virtual units
    ox: number; oy: number;
    r0: number;
    // wobble
    ax: number; ay: number; ar: number;
    fx: number; fy: number; fr: number;
    px: number; py: number; pr: number;
    // wisp lifecycle
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; strength: number;
};

// Marching-squares contour → an ordered membrane of edges over the isosurface.
// This is the anti-mess move: the nodes ride the outline, not the interior.
const MS_TABLE: number[][] = [
    [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2],
    [2, 3], [2, 0], [0, 1, 2, 3], [2, 1], [1, 3], [1, 0], [0, 3], [],
];

export const Cloud: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(cloudVisualExport);

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
                a.href = url; a.download = `cloud-${Date.now()}.webm`; a.click();
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
        let aspect = initialSize.width / initialSize.height;

        const scene = new THREE.Scene();
        const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        renderer.setSize(initialSize.width, initialSize.height, false);
        const canvas = renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        mountElement.appendChild(canvas);
        canvasRef.current = canvas;

        // ── The cloud: persistent body lumps (a cumulus silhouette) + wisps ──
        const ISO = 1.18;
        const centerUniform = Array.from({ length: MAX_CENTERS }, () => new THREE.Vector4(0, 0, 0, 0));

        const rand = (a: number, b: number) => a + Math.random() * (b - a);

        // body lumps as offsets around the cluster centroid: a flat-ish base
        // with a domed, lumpy crown — a compact cumulus that sits in the sky
        const bodyLayout: [number, number, number][] = [
            // [offsetX, offsetY, radius]
            [-0.26, 0.00, 0.075], [-0.13, 0.005, 0.085], [0.00, 0.00, 0.090],
            [0.13, 0.005, 0.085], [0.26, 0.00, 0.075],
            [-0.18, 0.075, 0.078], [-0.05, 0.090, 0.085], [0.08, 0.085, 0.080],
            [0.20, 0.070, 0.072],
            [-0.10, 0.150, 0.065], [0.04, 0.160, 0.068], [0.15, 0.140, 0.060],
            [-0.02, 0.210, 0.052],
        ];

        const puffs: Puff[] = bodyLayout.map(([ox, oy, r0]) => ({
            kind: 'body', ox, oy, r0,
            ax: rand(0.006, 0.018), ay: rand(0.006, 0.016), ar: rand(0.10, 0.22),
            fx: rand(0.12, 0.32), fy: rand(0.10, 0.28), fr: rand(0.15, 0.4),
            px: rand(0, 6.28), py: rand(0, 6.28), pr: rand(0, 6.28),
            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, strength: 1,
        }));

        const MAX_WISPS = MAX_CENTERS - bodyLayout.length; // headroom in the uniform array
        const wisps: Puff[] = [];

        // cluster centroid — base sits near mid-height; drifts gently
        const baseCx = aspect * 0.5;
        const baseCy = 0.50;

        const spawnWisp = (cx: number, t: number) => {
            if (wisps.length >= MAX_WISPS) return;
            // peel off the crown or a shoulder and drift up/outward
            const side = Math.random() < 0.5 ? -1 : 1;
            const sx = cx + side * rand(0.05, 0.28);
            const sy = baseCy + rand(0.14, 0.26);
            wisps.push({
                kind: 'wisp', ox: 0, oy: 0, r0: rand(0.028, 0.05),
                ax: 0, ay: 0, ar: rand(0.2, 0.5),
                fx: 0, fy: 0, fr: rand(0.3, 0.7),
                px: 0, py: 0, pr: rand(0, 6.28),
                x: sx, y: sy,
                vx: side * rand(0.01, 0.03), vy: rand(0.015, 0.04),
                life: 0, maxLife: rand(6, 12), strength: 0,
            });
        };
        let nextWispAt = 2.5;

        // ── Fill (cloud body) ──
        const quadGeo = new THREE.PlaneGeometry(2, 2);
        const fillMat = new THREE.ShaderMaterial({
            uniforms: {
                uCenters: { value: centerUniform },
                uCount: { value: 0 },
                uAspect: { value: aspect },
                uIso: { value: ISO },
            },
            vertexShader: fillVert, fragmentShader: fillFrag,
            depthTest: false, depthWrite: false,
        });
        const fillMesh = new THREE.Mesh(quadGeo, fillMat);
        fillMesh.frustumCulled = false;
        fillMesh.renderOrder = 0;
        scene.add(fillMesh);

        // ── Membrane (marching-squares contour) + surface nodes ──
        const NY = 80;
        let NX = Math.max(8, Math.ceil(aspect * NY));
        const gridCap = (dim: number) => (dim + 1) * (dim + 1);
        let field = new Float32Array(gridCap(Math.max(NX, NY)));
        const maxSegFloats = () => NX * NY * 2 /*seg*/ * 2 /*pt*/ * 3;
        let linePos = new Float32Array(maxSegFloats());
        let nodePos = new Float32Array(Math.ceil(maxSegFloats() / 6) * 3);

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x86e6ff, transparent: true, opacity: 0.7,
            blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
        });
        const lineSeg = new THREE.LineSegments(lineGeo, lineMat);
        lineSeg.frustumCulled = false;
        lineSeg.renderOrder = 1;
        scene.add(lineSeg);

        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
        const nodeMat = new THREE.PointsMaterial({
            color: 0xe6ecf2, size: 2.4, sizeAttenuation: false,
            transparent: true, opacity: 0.95,
            blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
        });
        const nodePoints = new THREE.Points(nodeGeo, nodeMat);
        nodePoints.frustumCulled = false;
        nodePoints.renderOrder = 2;
        scene.add(nodePoints);

        // ── Post: bloom for the soft luminous edge ──
        const BASE_BLOOM = 0.5;
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, passCam));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), BASE_BLOOM, 0.5, 0.55);
        composer.addPass(bloomPass);
        composer.setSize(initialSize.width, initialSize.height);
        let bloomPulse = 0;

        // metaball field on the CPU (same formula as the shader)
        const fieldAt = (px: number, py: number, count: number): number => {
            let f = 0;
            for (let i = 0; i < count; i++) {
                const c = centerUniform[i];
                const dx = px - c.x, dy = py - c.y;
                f += c.w * (c.z * c.z) / (dx * dx + dy * dy + 0.00035);
            }
            return f;
        };

        const virtualToClip = (vx: number, vy: number): [number, number] =>
            [(vx / aspect) * 2 - 1, vy * 2 - 1];

        // marching squares → fill linePos / nodePos, return { segFloats, nodeFloats }
        const march = (count: number) => {
            const cell = 1 / NY;
            const stride = NX + 1;
            for (let j = 0; j <= NY; j++) {
                const y = j * cell;
                for (let i = 0; i <= NX; i++) {
                    field[j * stride + i] = fieldAt(i * cell, y, count);
                }
            }
            let s = 0; // line float cursor
            let np = 0; // node float cursor
            let segIdx = 0;
            for (let j = 0; j < NY; j++) {
                const y0 = j * cell, y1 = y0 + cell;
                for (let i = 0; i < NX; i++) {
                    const x0 = i * cell, x1 = x0 + cell;
                    const bl = field[j * stride + i];
                    const br = field[j * stride + i + 1];
                    const tr = field[(j + 1) * stride + i + 1];
                    const tl = field[(j + 1) * stride + i];
                    let ci = 0;
                    if (bl > ISO) ci |= 1;
                    if (br > ISO) ci |= 2;
                    if (tr > ISO) ci |= 4;
                    if (tl > ISO) ci |= 8;
                    const edges = MS_TABLE[ci];
                    if (edges.length === 0) continue;
                    // edge crossing points (compute lazily per referenced edge)
                    for (let k = 0; k < edges.length; k += 2) {
                        for (let m = 0; m < 2; m++) {
                            const edge = edges[k + m];
                            let vx = 0, vy = 0;
                            if (edge === 0) { const t = (ISO - bl) / (br - bl); vx = x0 + t * cell; vy = y0; }
                            else if (edge === 1) { const t = (ISO - br) / (tr - br); vx = x1; vy = y0 + t * cell; }
                            else if (edge === 2) { const t = (ISO - tr) / (tl - tr); vx = x1 - t * cell; vy = y1; }
                            else { const t = (ISO - tl) / (bl - tl); vx = x0; vy = y1 - t * cell; }
                            const [cx, cy] = virtualToClip(vx, vy);
                            linePos[s++] = cx; linePos[s++] = cy; linePos[s++] = 0;
                            // decimate nodes: one every few segments, at the first endpoint
                            if (m === 0 && (segIdx % 3) === 0) {
                                nodePos[np++] = cx; nodePos[np++] = cy; nodePos[np++] = 0;
                            }
                        }
                        segIdx++;
                    }
                }
            }
            return { segFloats: s, nodeFloats: np };
        };

        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

            // cluster centroid drifts gently, staying in frame
            const cx = baseCx + Math.sin(t * 0.06) * aspect * 0.06 + Math.sin(t * 0.017) * aspect * 0.03;
            const cy = baseCy + Math.sin(t * 0.05) * 0.015;

            // pack body lumps
            let count = 0;
            for (const p of puffs) {
                const x = cx + p.ox + Math.sin(t * p.fx + p.px) * p.ax;
                const y = cy + p.oy + Math.sin(t * p.fy + p.py) * p.ay;
                const r = p.r0 * (1 + Math.sin(t * p.fr + p.pr) * p.ar * 0.5);
                centerUniform[count].set(x, y, r, 1.0);
                count++;
            }

            // wisps: spawn, drift, fade
            if (t > nextWispAt) {
                spawnWisp(cx, t);
                nextWispAt = t + rand(1.5, 3.5);
                bloomPulse = Math.max(bloomPulse, 0.22);
            }
            for (let wi = wisps.length - 1; wi >= 0; wi--) {
                const w = wisps[wi];
                w.life += dt;
                w.x += w.vx * dt * 8;
                w.y += w.vy * dt * 8;
                w.vy += dt * 0.02; // gentle lift
                const k = w.life / w.maxLife;
                // fade in then out
                w.strength = Math.sin(Math.min(1, k) * Math.PI) * 0.85;
                const r = w.r0 * (1 + Math.sin(t * w.fr + w.pr) * 0.3);
                if (k >= 1 || count >= MAX_CENTERS) {
                    wisps.splice(wi, 1);
                    continue;
                }
                centerUniform[count].set(w.x, w.y, r, w.strength);
                count++;
            }

            fillMat.uniforms.uCount.value = count;

            const { segFloats, nodeFloats } = march(count);
            lineGeo.setDrawRange(0, segFloats / 3);
            (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            nodeGeo.setDrawRange(0, nodeFloats / 3);
            (nodeGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

            const breath = 0.62 + 0.12 * Math.sin(t * 0.5);
            lineMat.opacity = breath;
            bloomPulse *= Math.exp(-dt * 1.8);
            bloomPass.strength = BASE_BLOOM + bloomPulse;

            renderer.setRenderTarget(null);
            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            aspect = width / height;
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
            bloomPass.setSize(width, height);
            fillMat.uniforms.uAspect.value = aspect;
            NX = Math.max(8, Math.ceil(aspect * NY));
            const needGrid = gridCap(Math.max(NX, NY));
            if (field.length < needGrid) field = new Float32Array(needGrid);
            const needLine = maxSegFloats();
            if (linePos.length < needLine) {
                linePos = new Float32Array(needLine);
                nodePos = new Float32Array(Math.ceil(needLine / 6) * 3);
                lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
                nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
            }
        };
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            quadGeo.dispose();
            lineGeo.dispose(); nodeGeo.dispose();
            fillMat.dispose(); lineMat.dispose(); nodeMat.dispose();
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
            <div ref={containerRef} className="cloud-stage">
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

export default Cloud;
