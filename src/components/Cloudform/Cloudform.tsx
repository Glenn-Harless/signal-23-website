import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Cloudform.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { cloudformVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// A cumulus held as a volumetric point field — no wireframe, no fill. Motes are
// scattered through a 3D density field by rejection sampling, so concentration
// alone carries the form: cores read bright, margins fall off to wisps. The
// base is flat because the field is clipped at y=0, the way a real cumulus is
// cut off at its lifting condensation level. Condensation climbs from that
// base, the interior churns, then the turrets evaporate from the top down.

const NMOTE = 70000;
const H = 112;       // cloud depth, base → crown
const BASE_R = 104;  // horizontal half-extent (wider than tall, as cumulus are)

type Puff = { x: number; y: number; z: number; r: number; w: number };
type CloudParams = {
    puffs: Puff[];
    shear: number;      // horizontal lean accumulated with height (wind shear)
    nScale: number;     // billow frequency
    nAmp: number;       // how hard noise carves the puff envelope
    seed: number;
};

const makeParams = (): CloudParams => {
    const puffs: Puff[] = [];
    const seed = Math.floor(Math.random() * 100000);

    // Puffs are laid down in four tiers. The taper between them is deliberately
    // gentle: shrink radius too fast with height and the summed field reads as a
    // cone, keep it flat and it reads as a ball. Cumulus sit between the two —
    // near-vertical flanks over a wide flat base, closing to a lumpy dome.
    // Few, large, deliberately off-centre lobes. Many small puffs average into a
    // smooth dome no matter how they are tiered; lobes only bulge the silhouette
    // when each one is a comparable fraction of the whole and is pushed far
    // enough off-axis to stand proud of its neighbours.
    const tier = (
        n: number, y0: number, y1: number, sLo: number, sHi: number,
        rLo: number, rHi: number, wLo: number, wHi: number, even = false,
    ) => {
        for (let i = 0; i < n; i++) {
            const th = even ? (i / n) * 6.283 + Math.random() * 0.8 : Math.random() * 6.283;
            const rad = (sLo + Math.random() * (sHi - sLo)) * BASE_R;
            puffs.push({
                x: Math.cos(th) * rad,
                y: (y0 + Math.random() * (y1 - y0)) * H,
                z: Math.sin(th) * rad,
                r: (rLo + Math.random() * (rHi - rLo)) * BASE_R,
                w: wLo + Math.random() * (wHi - wLo),
            });
        }
    };

    // Base lobes — every centre sits *below* the clip plane, so density decreases
    // monotonically upward from y=0. That makes the sampled bottom the densest
    // plane in the cloud and gives the flat cumulus base a hard edge; centres
    // above the plane would put a density peak inside the body and round it off.
    tier(4, -0.18, -0.05, 0.26, 0.50, 0.28, 0.36, 1.15, 1.42, true);
    // Lower flank lobes — offset outward so the sides bulge rather than slope in.
    tier(3, 0.20, 0.38, 0.16, 0.36, 0.24, 0.32, 1.00, 1.24);
    // Crown lobes — big enough to keep their own curvature at the top.
    tier(2, 0.48, 0.68, 0.08, 0.26, 0.18, 0.26, 0.90, 1.12);
    // Turret — one or two proud bumps breaking the crown line.
    tier(1 + Math.floor(Math.random() * 2), 0.70, 0.88, 0.04, 0.18, 0.13, 0.19, 0.82, 1.02);

    return {
        puffs,
        shear: (Math.random() - 0.5) * 0.42,
        // Fine enough to read as surface texture rather than reshaping the lobes;
        // at coarser scales the noise competes with the puffs for the silhouette.
        nScale: 0.046 + Math.random() * 0.020,
        nAmp: 0.52 + Math.random() * 0.22,
        seed,
    };
};

// ── Value noise (one-shot, CPU side; only runs on regen) ──
const hash3 = (x: number, y: number, z: number, seed: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.017) * 43758.5453;
    return s - Math.floor(s);
};

const vnoise = (x: number, y: number, z: number, seed: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const w = zf * zf * (3 - 2 * zf);
    const n = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k, seed);
    const c000 = n(0, 0, 0), c100 = n(1, 0, 0), c010 = n(0, 1, 0), c110 = n(1, 1, 0);
    const c001 = n(0, 0, 1), c101 = n(1, 0, 1), c011 = n(0, 1, 1), c111 = n(1, 1, 1);
    const x00 = c000 + (c100 - c000) * u;
    const x10 = c010 + (c110 - c010) * u;
    const x01 = c001 + (c101 - c001) * u;
    const x11 = c011 + (c111 - c011) * u;
    const y0 = x00 + (x10 - x00) * v;
    const y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
};

const fbm = (x: number, y: number, z: number, seed: number) => {
    let f = 0.5 * vnoise(x, y, z, seed);
    f += 0.25 * vnoise(x * 2.03, y * 2.03, z * 2.03, seed + 17);
    f += 0.125 * vnoise(x * 4.07, y * 4.07, z * 4.07, seed + 41);
    return f / 0.875;
};

export const Cloudform: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(cloudformVisualExport);

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
                a.href = url; a.download = `cloudform-${Date.now()}.webm`; a.click();
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
            const dist = 268 - Math.min(50, (aspect < 1 ? (1 / aspect) * 34 : 0));
            camera.position.set(0, H * 0.60, dist);
            camera.lookAt(0, H * 0.46, 0);
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

        const body = new THREE.Group();
        scene.add(body);

        // ── Mote buffers (fixed count; refilled on regen) ──
        const motePos = new Float32Array(NMOTE * 3);
        const moteDen = new Float32Array(NMOTE);   // local density, drives alpha
        const motePhase = new Float32Array(NMOTE); // churn phase + front jitter
        const moteLoop = new Float32Array(NMOTE);  // convective orbit radius
        const moteSize = new Float32Array(NMOTE);

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
        geo.setAttribute('aDen', new THREE.BufferAttribute(moteDen, 1));
        geo.setAttribute('aPhase', new THREE.BufferAttribute(motePhase, 1));
        geo.setAttribute('aLoop', new THREE.BufferAttribute(moteLoop, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(moteSize, 1));

        // Density field: gaussian puffs, carved by fbm so the billows get
        // sub-structure instead of reading as smooth blobs.
        const density = (p: CloudParams, x: number, y: number, z: number) => {
            const lean = p.shear * (y / H) * BASE_R;
            let d = 0;
            for (const pf of p.puffs) {
                const dx = x - pf.x - lean;
                const dy = y - pf.y;
                const dz = z - pf.z;
                const q = (dx * dx + dy * dy + dz * dz) / (2 * pf.r * pf.r);
                if (q < 9) d += pf.w * Math.exp(-q);
            }
            if (d <= 0) return 0;
            // Noise can only scale d by at most (1 + nAmp/2), so anything that
            // still can't clear ISO is rejected before paying for the fbm.
            if (d * (1 + p.nAmp * 0.5) <= ISO) return 0;
            const n = fbm(x * p.nScale, y * p.nScale, z * p.nScale, p.seed);
            // Push the noise toward its extremes before it modulates the puffs.
            // Raw fbm sits around the middle and just fuzzes the field evenly;
            // the contrast curve turns it into distinct dense billows separated
            // by genuine creases, which is what makes the interior legible.
            const nc = n * n * (3 - 2 * n);
            return d * (1 - p.nAmp * 0.5 + p.nAmp * nc);
        };

        const ISO = 0.30;

        const buildCloud = (p: CloudParams) => {
            let filled = 0;
            let attempts = 0;
            const maxAttempts = NMOTE * 60;
            const spanX = BASE_R * 1.45;
            const spanZ = BASE_R * 1.45;

            while (filled < NMOTE && attempts < maxAttempts) {
                attempts++;
                const x = (Math.random() * 2 - 1) * spanX;
                const z = (Math.random() * 2 - 1) * spanZ;
                // y starts at 0: clipping the field here is the flat cloud base
                const y = Math.random() * H;

                const d = density(p, x, y, z);
                if (d <= ISO) continue;
                // accept proportional to density → motes concentrate in cores
                const norm = Math.min(1, (d - ISO) / 1.05);
                if (Math.random() > norm) continue;

                const i3 = filled * 3;
                motePos[i3] = x;
                motePos[i3 + 1] = y;
                motePos[i3 + 2] = z;
                moteDen[filled] = norm;
                motePhase[filled] = Math.random();
                // margins circulate more freely than the packed core
                moteLoop[filled] = (0.7 + (1 - norm) * 2.4) * (0.6 + Math.random() * 0.8);
                // only mildly density-scaled: the crown is naturally sparser, so
                // tying size hard to density would erase it
                moteSize[filled] = 1.55 + norm * 0.55 + Math.random() * 0.55;
                filled++;
            }

            // If the field came out thin, park the remainder far behind the
            // camera rather than leaving stale positions from the last cloud.
            for (let i = filled; i < NMOTE; i++) {
                const i3 = i * 3;
                motePos[i3] = 0; motePos[i3 + 1] = -9999; motePos[i3 + 2] = 0;
                moteDen[i] = 0; moteSize[i] = 0; moteLoop[i] = 0; motePhase[i] = 0;
            }

            geo.attributes.position.needsUpdate = true;
            geo.attributes.aDen.needsUpdate = true;
            geo.attributes.aPhase.needsUpdate = true;
            geo.attributes.aLoop.needsUpdate = true;
            geo.attributes.aSize.needsUpdate = true;
        };

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uForm: { value: 0 },   // condensation front, normalised height
                uPx: { value: 300 },
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float aDen;
                attribute float aPhase;
                attribute float aLoop;
                attribute float aSize;
                uniform float uTime;
                uniform float uForm;
                uniform float uPx;
                varying float vDen;
                varying float vY;
                varying float vFront;
                void main() {
                    vec3 p = position;

                    // convective churn: a small orbit, stretched vertically so
                    // the interior reads as rising rather than swirling flat
                    float a = uTime * 0.34 + aPhase * 6.283;
                    vec3 churn = vec3(cos(a), sin(a * 0.73 + aPhase * 3.1) * 1.7, sin(a * 1.17)) * aLoop;

                    // slow global billow so the silhouette is never static
                    float bx = sin(p.y * 0.021 + uTime * 0.18 + aPhase * 0.6);
                    float bz = cos(p.x * 0.019 - uTime * 0.15 + aPhase * 0.4);
                    vec3 billow = vec3(bx, bx * 0.30 + bz * 0.22, bz) * 3.2;

                    // Taper all motion to zero at the condensation level. Without
                    // this the churn drags motes across y=0 and softens the flat
                    // base into a rounded lump — the base has to stay pinned.
                    float grip = smoothstep(0.0, 0.13, position.y / ${H}.0);
                    p += (churn + billow) * grip;

                    vY = clamp(p.y / ${H}.0, 0.0, 1.0);
                    vDen = aDen;
                    // Wide, gentle band. A tight front turns the reveal into a
                    // sweeping light plane across a field this dense — readable on
                    // a wireframe, but on a cloud it has to stay diffuse.
                    vFront = 1.0 - smoothstep(0.0, 0.24, abs(uForm - vY));

                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = aSize * (1.0 + vFront * 0.35) * (uPx / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                uniform float uForm;
                varying float vDen;
                varying float vY;
                varying float vFront;
                void main() {
                    // ragged condensation front — jitter per mote so the boundary
                    // shreds instead of sweeping as a flat plane
                    float jit = fract(vDen * 97.3 + vY * 41.7) - 0.5;
                    if (vY + jit * 0.20 > uForm) discard;

                    vec2 d = gl_PointCoord - 0.5;
                    float r2 = dot(d, d);
                    if (r2 > 0.25) discard;
                    float fall = 1.0 - smoothstep(0.0, 0.25, r2);

                    // Cumulus are lit from above: shadowed blue underside climbing
                    // to a bone-white crown. The underside is lifted well clear of
                    // the background — a physically dark base against a near-black
                    // sky has nothing to read against, so the flat bottom edge
                    // disappears instead of terminating the form. Kept under 1.0 so
                    // bloom supplies the glow rather than the colour clipping.
                    vec3 shadow = vec3(0.26, 0.40, 0.56);
                    vec3 mid    = vec3(0.50, 0.65, 0.79);
                    vec3 crown  = vec3(0.86, 0.92, 0.99);
                    vec3 c = mix(shadow, mid, smoothstep(0.0, 0.52, vY));
                    c = mix(c, crown, smoothstep(0.48, 1.0, vY));
                    c += vec3(0.34, 0.52, 0.74) * vFront * 0.18;

                    // Curved rather than linear in density, so cores read solid and
                    // the margins stay genuinely wispy instead of everything
                    // averaging out to the same haze.
                    float a = (0.038 + 0.23 * pow(vDen, 1.5)) * fall + vFront * 0.035 * fall;
                    gl_FragColor = vec4(c, a);
                }
            `,
        });

        const motes = new THREE.Points(geo, mat);
        motes.frustumCulled = false;
        body.add(motes);

        buildCloud(makeParams());

        // ── Post ──
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), 0.34, 0.42, 0.48);
        composer.addPass(bloomPass);
        composer.setSize(initialSize.width, initialSize.height);

        // ── Cycle: form (condensation rises) → hold → dissipate (top down) ──
        const T_FORM = 9, T_HOLD = 9, T_DISSIPATE = 6;
        const FULL = 1.15; // past 1.0 so the crown clears the jittered front
        let phaseT = 0;
        let phase: 'form' | 'hold' | 'dissipate' = 'form';
        mat.uniforms.uForm.value = 0;

        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            phaseT += dt;

            mat.uniforms.uTime.value += dt;
            body.rotation.y += dt * 0.10;

            if (phase === 'form') {
                const k = Math.min(1, phaseT / T_FORM);
                mat.uniforms.uForm.value = FULL * k;
                if (k >= 1) { phase = 'hold'; phaseT = 0; }
            } else if (phase === 'hold') {
                mat.uniforms.uForm.value = FULL;
                if (phaseT >= T_HOLD) { phase = 'dissipate'; phaseT = 0; }
            } else {
                const k = Math.min(1, phaseT / T_DISSIPATE);
                mat.uniforms.uForm.value = FULL * (1 - k);
                if (k >= 1) { buildCloud(makeParams()); phase = 'form'; phaseT = 0; }
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
            geo.dispose();
            mat.dispose();
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
            <div ref={containerRef} className="cloudform-stage">
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

export default Cloudform;
