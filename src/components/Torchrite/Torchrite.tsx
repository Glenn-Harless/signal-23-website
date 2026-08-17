import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Torchrite.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { torchriteVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// A torch rite: fire is passed, and no flame is diminished by lighting another.
//
// The subject is not the fire — it is the propagation. A congregation of unlit
// staffs stands in the dark, cold and barely legible. One catches. From there
// the flame travels by contact only: a bearer can light a neighbour it can
// physically reach, and nothing else. So the front does not expand as a clean
// circle. It races down the dense lanes, hesitates at the thin places, and
// where the crowd opens wider than an arm's reach it simply stops — leaving
// staffs that stay dark for the whole rite. That failure is the point; a
// percolation front is what makes the spread read as transmission rather than
// as an animated gradient.
//
// Every torch carries the same fuel, so the field goes out in the order it lit.
// The extinction is the same wave running through a second time.

const NBEARER = 240;      // congregation size (must stay <= STATE_W)
const MOTES = 260;        // flame parcels per bearer
const FIELD_R = 130;      // horizontal half-extent of the crowd
const REACH = 26;         // furthest a flame can be handed across
const MIN_GAP = 7.5;      // closest two bearers will stand
const STATE_W = 256;      // width of the per-bearer state texture

const ARC_POOL = 64;      // concurrent hand-off sparks
const ARC_MOTES = 16;

// ── Rite timing (seconds) ──
const OFFER_DELAY = 0.15; // beat before a lit bearer turns to offer the flame
const REACH_RATE = 40;    // units/sec the flame crosses a gap
const CATCH_MIN = 0.20;   // a real torch takes a moment to take
const CATCH_MAX = 0.52;
const FUEL = 23;          // healthy burn before the fuel runs down
const FUEL_JITTER = 3;
const GUTTER = 3.2;       // flame collapsing into embers
const EMBER = 4.0;        // head still glowing after the flame is gone
const DARK_HOLD = 2.6;
const REVEAL = 3.4;       // new congregation fading up out of the dark

// States
const COLD = 0, CATCHING = 1, BURNING = 2, GUTTERING = 3, SPENT = 4;

// ── Value noise, used once at build time to give the crowd structure ──
const hash2 = (x: number, y: number, seed: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 0.017) * 43758.5453;
    return s - Math.floor(s);
};

const vnoise2 = (x: number, y: number, seed: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const c00 = hash2(xi, yi, seed), c10 = hash2(xi + 1, yi, seed);
    const c01 = hash2(xi, yi + 1, seed), c11 = hash2(xi + 1, yi + 1, seed);
    const a = c00 + (c10 - c00) * u;
    const b = c01 + (c11 - c01) * u;
    return a + (b - a) * v;
};

const fbm2 = (x: number, y: number, seed: number) => {
    let f = 0.5 * vnoise2(x, y, seed);
    f += 0.25 * vnoise2(x * 2.07, y * 2.07, seed + 19);
    f += 0.125 * vnoise2(x * 4.13, y * 4.13, seed + 47);
    return f / 0.875;
};

type Field = {
    baseX: Float32Array; baseY: Float32Array; baseZ: Float32Array; // foot of the staff
    headX: Float32Array; headY: Float32Array; headZ: Float32Array; // where the flame sits
    height: Float32Array;
    neighbours: number[][];
    count: number;      // real bearers; slots past this are parked out of the world
};

// The crowd is laid down by dart-throwing against an fbm density field rather
// than sampled uniformly. Uniform scatter gives an even mat with no lanes and
// no knots, and a front crossing it advances at a constant rate — which looks
// exactly like a radial wipe. The noise is what creates places the fire can run
// and places it has to work at.
const buildField = (): Field => {
    const seed = Math.floor(Math.random() * 100000);
    const bx: number[] = [], bz: number[] = [];

    // Spatial hash so the minimum-separation test stays cheap.
    const cell = MIN_GAP;
    const grid = new Map<string, number[]>();
    const key = (cx: number, cz: number) => `${cx}|${cz}`;

    let attempts = 0;
    while (bx.length < NBEARER && attempts < NBEARER * 400) {
        attempts++;
        // Uniform in the disc, then squeezed elliptically — a perfectly round
        // crowd reads as a target from any angle.
        const a = Math.random() * 6.283;
        const rr = Math.sqrt(Math.random()) * FIELD_R;
        const x = Math.cos(a) * rr * 1.06;
        const z = Math.sin(a) * rr * 0.92;

        // Density: knots and voids. Biased upward at the centre so the crowd
        // thins toward its edge instead of ending on a hard rim.
        const d = fbm2(x * 0.0125, z * 0.0125, seed);
        const edge = 1 - Math.min(1, rr / FIELD_R) ** 2.2;
        if (Math.random() > (0.10 + d * 1.25) * edge) continue;

        const cx = Math.floor(x / cell), cz = Math.floor(z / cell);
        let tooClose = false;
        for (let i = -1; i <= 1 && !tooClose; i++) {
            for (let j = -1; j <= 1 && !tooClose; j++) {
                const bucket = grid.get(key(cx + i, cz + j));
                if (!bucket) continue;
                for (const k of bucket) {
                    const dx = x - bx[k], dz = z - bz[k];
                    if (dx * dx + dz * dz < MIN_GAP * MIN_GAP) { tooClose = true; break; }
                }
            }
        }
        if (tooClose) continue;

        const idx = bx.length;
        bx.push(x); bz.push(z);
        const bucket = grid.get(key(cx, cz));
        if (bucket) bucket.push(idx); else grid.set(key(cx, cz), [idx]);
    }

    // Every field is exactly NBEARER slots wide whether or not dart-throwing
    // managed to place that many. Buffers, the state texture and the contact
    // graph are all sized once at NBEARER, so a short field has to pad rather
    // than shrink — a graph holding indices past the end of the state arrays
    // would silently poison the simulation with NaN.
    const count = bx.length;
    const baseX = new Float32Array(NBEARER), baseY = new Float32Array(NBEARER), baseZ = new Float32Array(NBEARER);
    const headX = new Float32Array(NBEARER), headY = new Float32Array(NBEARER), headZ = new Float32Array(NBEARER);
    const height = new Float32Array(NBEARER);
    baseY.fill(-9999); headY.fill(-9999);

    for (let i = 0; i < count; i++) {
        const x = bx[i], z = bz[i];
        // Gentle ground relief. The lit floor itself is drawn flat, and it can
        // afford to be: it carries no texture of its own, only light, so a few
        // units of mismatch under a bearer is invisible. The relief is here for
        // the heads — off a single plane, the crowd reads as standing on
        // something; on one, as marks ruled onto a grid.
        const g = (fbm2(x * 0.0075 + 40, z * 0.0075 + 40, seed + 7) - 0.5) * 7;
        // Short staffs, tall flames. A torch is mostly fire — give the handle
        // the proportions of a real one and the field reads as a crowd holding
        // light; give it stem proportions and the same scene reads as a meadow.
        const h = 6 + Math.random() * 5;
        // Nobody holds a torch plumb. A few degrees of lean per bearer is the
        // single cheapest thing that separates a congregation from a bar chart.
        const la = Math.random() * 6.283;
        const lr = Math.random() * 1.9;

        baseX[i] = x; baseY[i] = g; baseZ[i] = z;
        headX[i] = x + Math.cos(la) * lr;
        headY[i] = g + h;
        headZ[i] = z + Math.sin(la) * lr;
        height[i] = h;
    }

    // Contact graph. A bearer can only pass fire to someone it can reach, and
    // only to a handful of them — a torch is offered to the people beside you,
    // not broadcast to everyone within a radius.
    const neighbours: number[][] = [];
    for (let i = 0; i < NBEARER; i++) {
        if (i >= count) { neighbours.push([]); continue; }
        const near: { j: number; d: number }[] = [];
        for (let j = 0; j < count; j++) {
            if (i === j) continue;
            const dx = baseX[i] - baseX[j], dz = baseZ[i] - baseZ[j];
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < REACH) near.push({ j, d });
        }
        near.sort((p, q) => p.d - q.d);
        neighbours.push(near.slice(0, 6).map((p) => p.j));
    }

    return { baseX, baseY, baseZ, headX, headY, headZ, height, neighbours, count };
};

export const Torchrite: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(torchriteVisualExport);

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
                a.href = url; a.download = `torchrite-${Date.now()}.webm`; a.click();
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
        scene.background = new THREE.Color(0x05030a);

        const camera = new THREE.PerspectiveCamera(40, initialSize.width / initialSize.height, 1, 3000);
        // The camera has to sit high enough to see the crowd as a crowd. Level
        // with the field, the depth collapses and two hundred staffs project
        // onto one horizontal band — a bar chart, which is exactly what a
        // congregation must not look like. Around thirty degrees of elevation
        // opens the ground back up, so the ignition front reads as a shape
        // moving across a floor, while the torches are still tall enough in
        // frame to read as things people are holding.
        let orbitR = 202, orbitY = 96;
        const fitCamera = (aspect: number) => {
            camera.aspect = aspect;
            // Portrait frames get a nearer, slightly higher camera. Shrinking a
            // wide composition into 9:16 leaves the crowd as a thin band across
            // the middle; pushing in and tipping down instead turns the field's
            // depth into the long axis, so the near torches read large at the
            // bottom of the frame and the front recedes up it.
            const portrait = Math.max(0, Math.min(1, (1.0 - aspect) / 0.44));
            orbitR = 202 - portrait * 48;
            orbitY = 96 + portrait * 18;
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

        let field = buildField();
        const n = NBEARER;

        // ── Per-bearer state, shared by every material through one texture ──
        // R: flame amplitude   G: flame heat (colour temperature)
        // B: warm light landing on this staff (its own, plus its neighbours')
        // A: the staff's own cold visibility
        const stateData = new Uint8Array(STATE_W * 4);
        const stateTex = new THREE.DataTexture(stateData, STATE_W, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
        stateTex.colorSpace = THREE.NoColorSpace;
        stateTex.minFilter = THREE.NearestFilter;
        stateTex.magFilter = THREE.NearestFilter;
        stateTex.needsUpdate = true;

        const shared = {
            uState: { value: stateTex },
            uTime: { value: 0 },
        };

        const SAMPLE_STATE = `
            uniform sampler2D uState;
            vec4 bearerState(float idx) {
                return texture2D(uState, vec2((idx + 0.5) / ${STATE_W}.0, 0.5));
            }
        `;

        // ── Staffs ──────────────────────────────────────────────────────────
        // Two vertices each. Unlit they are barely present; lit, the firelight
        // falls hardest at the top and drains down the shaft.
        const staffPos = new Float32Array(n * 2 * 3);
        const staffIdx = new Float32Array(n * 2);
        const staffUp = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) {
            const a = i * 6;
            staffPos[a] = field.baseX[i]; staffPos[a + 1] = field.baseY[i]; staffPos[a + 2] = field.baseZ[i];
            staffPos[a + 3] = field.headX[i]; staffPos[a + 4] = field.headY[i]; staffPos[a + 5] = field.headZ[i];
            staffIdx[i * 2] = i; staffIdx[i * 2 + 1] = i;
            staffUp[i * 2] = 0; staffUp[i * 2 + 1] = 1;
        }
        const staffGeo = new THREE.BufferGeometry();
        staffGeo.setAttribute('position', new THREE.BufferAttribute(staffPos, 3));
        staffGeo.setAttribute('aIdx', new THREE.BufferAttribute(staffIdx, 1));
        staffGeo.setAttribute('aUp', new THREE.BufferAttribute(staffUp, 1));

        const staffMat = new THREE.ShaderMaterial({
            uniforms: shared,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float aIdx;
                attribute float aUp;
                ${SAMPLE_STATE}
                varying vec3 vCol;
                varying float vA;
                void main() {
                    vec4 st = bearerState(aIdx);
                    float glow = st.b;
                    float presence = st.a;

                    // Firelight is a point source at the head, so it falls off
                    // down the shaft rather than washing it evenly.
                    float lit = glow * (0.18 + 0.82 * aUp * aUp);

                    vec3 cold = vec3(0.26, 0.38, 0.55);
                    vec3 warm = vec3(1.00, 0.47, 0.16);
                    vCol = mix(cold, warm, clamp(lit * 1.7, 0.0, 1.0));
                    // Cold staffs sit only just above the background — the crowd
                    // should be sensed before the fire finds it, not read. The
                    // foot is dimmer than the head so a staff fades into the
                    // ground rather than ending on a hard line.
                    // Kept deliberately faint. The staff is the reason the flame
                    // is where it is, not a thing to look at — drawn any brighter
                    // it reads as a wire holding the fire up.
                    vA = presence * (0.014 + 0.105 * aUp * aUp) + lit * 0.085;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vCol;
                varying float vA;
                void main() { gl_FragColor = vec4(vCol, vA); }
            `,
        });
        scene.add(new THREE.LineSegments(staffGeo, staffMat));

        // ── Ground light ────────────────────────────────────────────────
        // There is no floor mesh in the scene until here, and the crowd needs
        // one: without light landing on something, the staffs simply stop in
        // mid-air and the whole rite floats.
        //
        // The obvious approach — an additive disc under each torch — does not
        // survive contact with two hundred of them. Discs that overlap enough to
        // merge blow out to white in the middle of the field, and discs that do
        // not overlap draw their own outlines at its edge, so the lit ground ends
        // in a chain of visible circles. Either way the ground reads as a pile of
        // sprites rather than as illumination.
        //
        // So the light is accumulated into a coarse map instead — every torch
        // splats into a shared grid, and one plane samples it bilinearly. Summing
        // before rasterising rather than after is what makes the result
        // continuous: there are no individual pool edges left to see, only a
        // field that happens to be brighter where more torches are burning.
        const LIGHT_RES = 112;
        const LIGHT_SPAN = FIELD_R * 2.7;   // comfortably past the crowd, so the map fades out before its own edge
        const LIGHT_R = 20;                 // world radius one torch lights
        const COLD_R = 18;                  // footprint of a bearer merely standing there

        const lightWarm = new Float32Array(LIGHT_RES * LIGHT_RES);
        const lightHeat = new Float32Array(LIGHT_RES * LIGHT_RES);
        const lightCold = new Float32Array(LIGHT_RES * LIGHT_RES);
        const lightData = new Uint8Array(LIGHT_RES * LIGHT_RES * 4);
        const lightTex = new THREE.DataTexture(
            lightData, LIGHT_RES, LIGHT_RES, THREE.RGBAFormat, THREE.UnsignedByteType);
        lightTex.colorSpace = THREE.NoColorSpace;
        lightTex.minFilter = THREE.LinearFilter;
        lightTex.magFilter = THREE.LinearFilter;
        lightTex.needsUpdate = true;

        const splat = (arr: Float32Array, x: number, z: number, v: number, radius: number) => {
            const cu = (x / LIGHT_SPAN + 0.5) * LIGHT_RES;
            const cv = (z / LIGHT_SPAN + 0.5) * LIGHT_RES;
            const rt = radius * (LIGHT_RES / LIGHT_SPAN);
            const i0 = Math.max(0, Math.floor(cu - rt)), i1 = Math.min(LIGHT_RES - 1, Math.ceil(cu + rt));
            const j0 = Math.max(0, Math.floor(cv - rt)), j1 = Math.min(LIGHT_RES - 1, Math.ceil(cv + rt));
            const inv = 1 / (rt * rt);
            for (let j = j0; j <= j1; j++) {
                const dz = j + 0.5 - cv;
                const row = j * LIGHT_RES;
                for (let i = i0; i <= i1; i++) {
                    const dx = i + 0.5 - cu;
                    const q = 1 - (dx * dx + dz * dz) * inv;
                    if (q <= 0) continue;
                    arr[row + i] += v * q * q;
                }
            }
        };

        // The cold footprint never changes while a congregation stands, so it is
        // splatted once per field and only scaled by the reveal each frame.
        const bakeColdLight = () => {
            lightCold.fill(0);
            for (let i = 0; i < field.count; i++) {
                splat(lightCold, field.baseX[i], field.baseZ[i], 1, COLD_R);
            }
        };
        bakeColdLight();

        const groundGeo = new THREE.PlaneGeometry(LIGHT_SPAN, LIGHT_SPAN, 1, 1);
        groundGeo.rotateX(Math.PI / 2);   // +v of the map now runs along +z, matching the splat
        const groundMat = new THREE.ShaderMaterial({
            uniforms: { uLight: { value: lightTex } },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                varying vec2 vL;
                void main() {
                    vL = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uLight;
                varying vec2 vL;
                void main() {
                    vec4 L = texture2D(uLight, vL);
                    float aWarm = L.r * 0.16;
                    float aCold = L.b * 0.028;
                    float a = aWarm + aCold;
                    if (a < 0.002) discard;
                    // Ground under a healthy flame is lit near the flame's own
                    // colour; under a guttering one it goes red, because that is
                    // the only light left to fall on it.
                    vec3 warm = mix(vec3(0.72, 0.18, 0.03), vec3(0.95, 0.42, 0.13), L.g);
                    vec3 cold = vec3(0.20, 0.31, 0.48);
                    gl_FragColor = vec4(mix(cold, warm, clamp(aWarm / a, 0.0, 1.0)), a);
                }
            `,
        });
        scene.add(new THREE.Mesh(groundGeo, groundMat));

        // ── Flame ───────────────────────────────────────────────────────────
        // Fire is rendered as parcels of burning gas, not as a flame-shaped
        // sprite. Nothing in the mote knows what a flame looks like; the shape
        // comes out of the motion — narrow and fuel-rich at the wick, widening
        // as entrained air breaks the column up, cooling along the way. Get the
        // motion right and it reads as fire from any angle. Draw the shape
        // directly and it reads as a sticker the moment the camera moves.
        const NM = n * MOTES;
        const mHead = new Float32Array(NM * 3);
        const mIdx = new Float32Array(NM);
        const mSeed = new Float32Array(NM);
        const mOff = new Float32Array(NM);
        const mRad = new Float32Array(NM);
        const mAng = new Float32Array(NM);
        const mScale = new Float32Array(NM);
        for (let i = 0; i < n; i++) {
            const s = field.height[i] / 8.5;
            for (let k = 0; k < MOTES; k++) {
                const o = i * MOTES + k;
                mHead[o * 3] = field.headX[i];
                mHead[o * 3 + 1] = field.headY[i];
                mHead[o * 3 + 2] = field.headZ[i];
                mIdx[o] = i;
                mSeed[o] = Math.random();
                mOff[o] = Math.random();
                // Biased toward the axis. Area-uniform sampling spreads the
                // parcels evenly across the wick, which fills the plume out into
                // a fuzzy ball; a flame is dense on its centreline and thin at
                // the skin, and the distribution has to say so.
                mRad[o] = Math.random() ** 1.7;
                mAng[o] = Math.random() * 6.283;
                mScale[o] = s;
            }
        }
        const flameGeo = new THREE.BufferGeometry();
        flameGeo.setAttribute('position', new THREE.BufferAttribute(mHead, 3));
        flameGeo.setAttribute('aIdx', new THREE.BufferAttribute(mIdx, 1));
        flameGeo.setAttribute('aSeed', new THREE.BufferAttribute(mSeed, 1));
        flameGeo.setAttribute('aOff', new THREE.BufferAttribute(mOff, 1));
        flameGeo.setAttribute('aRad', new THREE.BufferAttribute(mRad, 1));
        flameGeo.setAttribute('aAng', new THREE.BufferAttribute(mAng, 1));
        flameGeo.setAttribute('aScale', new THREE.BufferAttribute(mScale, 1));

        const flameMat = new THREE.ShaderMaterial({
            uniforms: { ...shared, uPx: { value: 240 }, uWind: { value: new THREE.Vector3() } },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute float aIdx, aSeed, aOff, aRad, aAng, aScale;
                uniform float uTime;
                uniform float uPx;
                uniform vec3 uWind;
                ${SAMPLE_STATE}
                varying float vLife, vHeat, vEdge, vAmp;
                void main() {
                    vec4 st = bearerState(aIdx);
                    float amp = st.r;
                    if (amp < 0.004) {
                        // Unlit bearers cost one clipped vertex and no fragments.
                        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                        gl_PointSize = 0.0;
                        return;
                    }

                    // Each parcel runs its own loop up the column at its own
                    // rate, so the plume shears instead of pulsing in lockstep.
                    float rate = 0.44 + aSeed * 0.34;
                    float life = fract(uTime * rate + aOff);

                    float plume = (6.5 + aScale * 6.5) * (0.55 + amp * 0.65);

                    // The silhouette of a flame is not a fountain. It is narrow
                    // at the wick where the fuel vapour is dense and moving fast,
                    // widest a fifth of the way up where entrained air has slowed
                    // it, and then it closes to a tip as the last of the fuel
                    // burns out. Only above that tip — where there is nothing
                    // left burning — does the column open out again into soot.
                    // Widening monotonically instead is what turns a torch into a
                    // sheaf of wheat.
                    float bulge = 0.20 + 1.15 * smoothstep(0.0, 0.26, life)
                                       - 1.00 * smoothstep(0.28, 0.62, life);
                    float soot = 2.2 * pow(max(0.0, life - 0.52), 1.6);
                    float spread = bulge + soot;
                    float r = aRad * (0.85 + aScale * 0.55) * spread;

                    // Two incommensurate oscillations stand in for the curl of a
                    // buoyant plume — cheap, and the lack of a common period is
                    // what keeps a field of 200 flames from beating together.
                    float w1 = sin(uTime * 2.30 + aSeed * 37.0 + life * 6.1);
                    float w2 = cos(uTime * 1.77 + aSeed * 61.0 + life * 4.7);
                    float wob = life * life * (0.8 + aScale * 0.6);

                    vec3 p = position;
                    p.x += cos(aAng) * r + w1 * wob;
                    p.z += sin(aAng) * r + w2 * wob;
                    p.y += life * plume;
                    // Crosswind integrates over the parcel's time aloft, so its
                    // effect grows with the square of how far it has risen. This
                    // is also what leans the whole field the same way at once,
                    // and makes the room feel like one room.
                    p += uWind * life * life * plume * 0.20;

                    vLife = life;
                    vHeat = st.g;
                    vAmp = amp;
                    vEdge = clamp(r / (1.0 + aScale * 1.1), 0.0, 1.0);

                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    // Parcels are drawn large and faint rather than small and
                    // opaque: a flame has no visible grain, and points small
                    // enough to be individually resolved read as sparks.
                    float size = (1.7 + aScale * 1.1) * (0.7 + life * 1.3) * (0.6 + amp * 0.7);
                    gl_PointSize = size * (uPx / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying float vLife, vHeat, vEdge, vAmp;
                void main() {
                    vec2 d = gl_PointCoord - 0.5;
                    float r2 = dot(d, d);
                    if (r2 > 0.25) discard;
                    float fall = 1.0 - smoothstep(0.0, 0.25, r2);

                    // Not a Planck curve — but it is the sequence a real flame
                    // actually shows as a parcel cools on its way up: white core,
                    // yellow shoulder, orange body, red tip, then soot.
                    vec3 core   = vec3(1.00, 0.94, 0.78);
                    vec3 yellow = vec3(1.00, 0.71, 0.25);
                    vec3 orange = vec3(1.00, 0.38, 0.08);
                    vec3 deep   = vec3(0.60, 0.10, 0.02);

                    float t = vLife;
                    vec3 c = mix(core, yellow, smoothstep(0.00, 0.15, t));
                    c = mix(c, orange, smoothstep(0.13, 0.40, t));
                    c = mix(c, deep,   smoothstep(0.36, 0.76, t));

                    // The skin of the column has entrained the most air and is
                    // the coolest part of it. Without this the plume flattens
                    // into an even orange smear.
                    c = mix(c, deep * 0.85, vEdge * 0.55);

                    // Guttering drains the top of the ramp rather than just
                    // dimming: a dying torch goes red before it goes out.
                    c = mix(deep * 0.75, c, 0.28 + vHeat * 0.72);

                    // Opacity dies with the fuel, well before the parcel reaches
                    // the top of its arc — so the flame ends in a tip and the
                    // soot above it is only just visible. The axis of the column
                    // is far denser than its skin, which is what gives the flame
                    // a hot core to bloom off instead of an even orange haze.
                    float a = (1.0 - smoothstep(0.30, 0.72, t)) * (0.020 + 0.23 * pow(1.0 - vEdge, 1.6));
                    gl_FragColor = vec4(c, a * fall * vAmp);
                }
            `,
        });
        const flame = new THREE.Points(flameGeo, flameMat);
        flame.frustumCulled = false;
        scene.add(flame);

        // ── Hand-off sparks ─────────────────────────────────────────────────
        // The visible act of passing. Struck once per ignition, travelling from
        // the giving head to the taking one along a bowed path — the rite itself,
        // rather than its result.
        const NA = ARC_POOL * ARC_MOTES;
        const aStart = new Float32Array(NA * 3);
        const aEnd = new Float32Array(NA * 3);
        const aT0 = new Float32Array(NA).fill(-999);
        const aDur = new Float32Array(NA).fill(1);
        const aFrac = new Float32Array(NA);
        const aRand = new Float32Array(NA);
        for (let s = 0; s < ARC_POOL; s++) {
            for (let k = 0; k < ARC_MOTES; k++) {
                const o = s * ARC_MOTES + k;
                aFrac[o] = k / (ARC_MOTES - 1);
                aRand[o] = Math.random();
            }
        }
        const arcGeo = new THREE.BufferGeometry();
        arcGeo.setAttribute('position', new THREE.BufferAttribute(aStart, 3));
        arcGeo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3));
        arcGeo.setAttribute('aT0', new THREE.BufferAttribute(aT0, 1));
        arcGeo.setAttribute('aDur', new THREE.BufferAttribute(aDur, 1));
        arcGeo.setAttribute('aFrac', new THREE.BufferAttribute(aFrac, 1));
        arcGeo.setAttribute('aRand', new THREE.BufferAttribute(aRand, 1));

        const arcMat = new THREE.ShaderMaterial({
            uniforms: { uTime: shared.uTime, uPx: { value: 240 } },
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader: `
                attribute vec3 aEnd;
                attribute float aT0, aDur, aFrac, aRand;
                uniform float uTime;
                uniform float uPx;
                varying float vA;
                void main() {
                    float age = (uTime - aT0) / aDur;
                    if (age < 0.0 || age > 1.0) {
                        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
                        gl_PointSize = 0.0;
                        return;
                    }
                    // The chain is staggered so the spark reads as something
                    // travelling, not as a line switching on.
                    float t = clamp(age * 1.4 - aFrac * 0.4, 0.0, 1.0);
                    vec3 p = mix(position, aEnd, t);
                    // Fire is offered upward and over, never straight across.
                    p.y += sin(t * 3.14159) * (2.0 + aRand * 2.4);
                    p.x += sin(uTime * 24.0 + aRand * 51.0) * 0.4 * t;
                    p.z += cos(uTime * 21.0 + aRand * 33.0) * 0.4 * t;

                    vA = (1.0 - age) * (1.0 - aFrac * 0.55);

                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_PointSize = (0.9 + aRand * 0.7) * (uPx / -mv.z);
                    gl_Position = projectionMatrix * mv;
                }
            `,
            fragmentShader: `
                varying float vA;
                void main() {
                    vec2 d = gl_PointCoord - 0.5;
                    float r2 = dot(d, d);
                    if (r2 > 0.25) discard;
                    float fall = 1.0 - smoothstep(0.0, 0.25, r2);
                    gl_FragColor = vec4(vec3(1.0, 0.83, 0.52), fall * vA * 0.55);
                }
            `,
        });
        const arcs = new THREE.Points(arcGeo, arcMat);
        arcs.frustumCulled = false;
        scene.add(arcs);

        // gl_PointSize is in framebuffer pixels, so a fixed constant would make
        // every flame half the apparent size on a retina display. Tying it to
        // the framebuffer height keeps the fire the same size in frame no matter
        // what it is being rendered on or exported at.
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const setPointScale = (h: number) => {
            const px = h * dpr * 0.52;
            flameMat.uniforms.uPx.value = px;
            arcMat.uniforms.uPx.value = px;
        };
        setPointScale(initialSize.height);

        let arcCursor = 0;
        const strikeArc = (from: number, to: number, now: number) => {
            const s = arcCursor++ % ARC_POOL;
            const dur = 0.30 + Math.random() * 0.22;
            for (let k = 0; k < ARC_MOTES; k++) {
                const o = s * ARC_MOTES + k;
                aStart[o * 3] = field.headX[from]; aStart[o * 3 + 1] = field.headY[from]; aStart[o * 3 + 2] = field.headZ[from];
                aEnd[o * 3] = field.headX[to]; aEnd[o * 3 + 1] = field.headY[to]; aEnd[o * 3 + 2] = field.headZ[to];
                aT0[o] = now;
                aDur[o] = dur;
            }
            arcGeo.attributes.position.needsUpdate = true;
            arcGeo.attributes.aEnd.needsUpdate = true;
            arcGeo.attributes.aT0.needsUpdate = true;
            arcGeo.attributes.aDur.needsUpdate = true;
        };

        // ── Post ──
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), 0.35, 0.45, 0.55);
        composer.addPass(bloomPass);
        composer.setSize(initialSize.width, initialSize.height);

        // ── The rite ────────────────────────────────────────────────────────
        const st = new Uint8Array(n);          // COLD / CATCHING / …
        const tState = new Float32Array(n);    // seconds in the current state
        const fuel = new Float32Array(n);
        const catchDur = new Float32Array(n);
        const burned = new Uint8Array(n);      // has it ever been lit
        const glow = new Float32Array(n);
        const amp = new Float32Array(n);
        const heat = new Float32Array(n);

        let clockT = 0;
        let reveal = 0;
        let rite: 'reveal' | 'burning' | 'dark' = 'reveal';
        let riteT = 0;

        const resetRite = () => {
            for (let i = 0; i < n; i++) {
                st[i] = COLD; tState[i] = 0; burned[i] = 0;
                fuel[i] = FUEL + (Math.random() * 2 - 1) * FUEL_JITTER;
                catchDur[i] = CATCH_MIN + Math.random() * (CATCH_MAX - CATCH_MIN);
                glow[i] = 0; amp[i] = 0; heat[i] = 0;
            }
            aT0.fill(-999);
            arcGeo.attributes.aT0.needsUpdate = true;
        };
        resetRite();

        const ignite = (i: number) => {
            if (st[i] !== COLD) return;
            st[i] = CATCHING;
            tState[i] = 0;
            burned[i] = 1;
        };

        // The first ember is struck somewhere the fire can actually go. A bearer
        // standing alone on the rim would burn its whole fuel load without ever
        // reaching anyone, and the rite would be twenty dark seconds long.
        const firstEmber = () => {
            const seated: number[] = [];
            for (let i = 0; i < field.count; i++) {
                if (field.neighbours[i].length >= 3) seated.push(i);
            }
            const pool = seated.length ? seated : Array.from({ length: field.count }, (_, i) => i);
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const wind = new THREE.Vector3();
        let orbit = Math.random() * 6.283;

        const clock = new THREE.Clock();
        let animationId = 0;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            clockT += dt;
            riteT += dt;
            shared.uTime.value = clockT;

            // Slow gusting crosswind. Low frequency and never strong — it is
            // there to tie the field together, not to blow it sideways.
            wind.set(
                Math.sin(clockT * 0.13) * 0.5 + Math.sin(clockT * 0.041) * 0.3,
                0,
                Math.cos(clockT * 0.107) * 0.45 + Math.sin(clockT * 0.033) * 0.28,
            );
            flameMat.uniforms.uWind.value.copy(wind);

            // ── Rite phases ──
            if (rite === 'reveal') {
                reveal = Math.min(1, riteT / REVEAL);
                if (reveal >= 1) {
                    rite = 'burning'; riteT = 0;
                    ignite(firstEmber());
                }
            } else if (rite === 'dark') {
                reveal = Math.max(0, 1 - riteT / (DARK_HOLD * 0.7));
                if (riteT >= DARK_HOLD) {
                    // A new congregation gathers in the dark. Rebuilding the
                    // field is invisible while nothing is lit, and the rite is
                    // supposed to be the same rite with different people.
                    field = buildField();
                    rebuildGeometry();
                    resetRite();
                    rite = 'reveal'; riteT = 0; reveal = 0;
                }
            }

            // ── Bearer simulation ──
            let active = 0;
            for (let i = 0; i < n; i++) {
                tState[i] += dt;

                if (st[i] === CATCHING) {
                    active++;
                    const k = Math.min(1, tState[i] / catchDur[i]);
                    // Sputtering while it takes: the flame is not yet stable, so
                    // the amplitude staggers rather than ramping cleanly.
                    amp[i] = k * k * (0.55 + 0.45 * Math.sin(tState[i] * 34 + i));
                    heat[i] = 0.55 + k * 0.45;
                    if (k >= 1) { st[i] = BURNING; tState[i] = 0; }
                } else if (st[i] === BURNING) {
                    active++;
                    // A torch flares when it catches, then settles. The overshoot
                    // is short and it is the most legible moment in the whole
                    // spread — it is what your eye follows across the field.
                    const flare = Math.exp(-tState[i] * 2.6) * 0.55;
                    const flick = 0.90 + 0.10 * Math.sin(tState[i] * 7.3 + i * 2.1)
                        + 0.06 * Math.sin(tState[i] * 17.9 + i * 5.7);
                    amp[i] = Math.min(1, (0.70 + flare) * flick);
                    heat[i] = 1;

                    // Pass it on. Reach is physical: the further the neighbour,
                    // the longer the flame takes to cross, and past REACH it
                    // never crosses at all.
                    if (tState[i] > OFFER_DELAY) {
                        for (const j of field.neighbours[i]) {
                            if (st[j] !== COLD) continue;
                            const dx = field.baseX[i] - field.baseX[j];
                            const dz = field.baseZ[i] - field.baseZ[j];
                            const d = Math.sqrt(dx * dx + dz * dz);
                            if (tState[i] > OFFER_DELAY + d / REACH_RATE) {
                                ignite(j);
                                strikeArc(i, j, clockT);
                            }
                        }
                    }

                    if (tState[i] > fuel[i]) { st[i] = GUTTERING; tState[i] = 0; }
                } else if (st[i] === GUTTERING) {
                    active++;
                    const k = Math.min(1, tState[i] / GUTTER);
                    // Guttering is not a fade. The flame keeps snatching at what
                    // fuel is left, so it drops in uneven steps and reddens.
                    const snatch = 0.72 + 0.28 * Math.sin(tState[i] * 9.1 + i * 3.3);
                    amp[i] = (1 - k) * (1 - k) * 0.80 * snatch;
                    heat[i] = (1 - k) * (1 - k);
                    if (k >= 1) { st[i] = SPENT; tState[i] = 0; }
                } else if (st[i] === SPENT) {
                    amp[i] = 0;
                    heat[i] = 0;
                } else {
                    amp[i] = 0;
                    heat[i] = 0;
                }
            }

            // Firelight landing on each staff: its own flame, plus what its
            // neighbours throw on it. A cold staff standing beside a burning one
            // is visibly warmed before it ever catches, which is what makes the
            // approaching front legible ahead of itself.
            for (let i = 0; i < n; i++) {
                let g = amp[i] * 0.95;
                if (st[i] === SPENT && tState[i] < EMBER) {
                    // The head keeps a dull ember after the flame is gone.
                    g += 0.22 * (1 - tState[i] / EMBER) ** 2;
                }
                for (const j of field.neighbours[i]) {
                    if (amp[j] <= 0) continue;
                    const dx = field.headX[i] - field.headX[j];
                    const dz = field.headZ[i] - field.headZ[j];
                    const d2 = dx * dx + dz * dz;
                    const f = Math.max(0, 1 - d2 / (REACH * REACH));
                    g += amp[j] * f * f * 0.45;
                }
                glow[i] = Math.min(1, g);
            }

            // The rite is over when nothing is alight and the last spark is gone.
            if (rite === 'burning' && active === 0 && riteT > 2) {
                rite = 'dark'; riteT = 0;
            }

            // ── Upload state ──
            for (let i = 0; i < n; i++) {
                const o = i * 4;
                stateData[o] = Math.max(0, Math.min(255, amp[i] * 255)) | 0;
                stateData[o + 1] = Math.max(0, Math.min(255, heat[i] * 255)) | 0;
                // Firelight is gated by reveal as well, so the last embers fade
                // with the crowd during the dark hold instead of snapping off
                // when the next congregation is built.
                stateData[o + 2] = Math.max(0, Math.min(255, glow[i] * reveal * 255)) | 0;
                // Spent staffs stay as husks — dimmer than they were, but the
                // crowd should not disappear once the fire has been through it.
                stateData[o + 3] = Math.max(0, Math.min(255, reveal * (burned[i] ? 0.5 : 1) * 255)) | 0;
            }
            stateTex.needsUpdate = true;

            // ── Ground light ──
            lightWarm.fill(0);
            lightHeat.fill(0);
            for (let i = 0; i < n; i++) {
                if (amp[i] <= 0.004) continue;
                splat(lightWarm, field.baseX[i], field.baseZ[i], amp[i], LIGHT_R);
                splat(lightHeat, field.baseX[i], field.baseZ[i], amp[i] * heat[i], LIGHT_R);
            }
            for (let k = 0; k < lightWarm.length; k++) {
                const w = lightWarm[k];
                const o = k * 4;
                lightData[o] = Math.min(255, w * 60) | 0;
                // Mean heat rather than summed, so a bright patch of ground does
                // not also read as a hotter one.
                lightData[o + 1] = w > 0 ? Math.min(255, (lightHeat[k] / w) * 255) | 0 : 0;
                lightData[o + 2] = Math.min(255, lightCold[k] * reveal * 60) | 0;
                lightData[o + 3] = 255;
            }
            lightTex.needsUpdate = true;

            // ── Camera ──
            // A slow walk around the outside of the crowd, high enough that the
            // ignition front reads as a shape crossing a floor. One revolution
            // takes several rites, so no two passes of the fire are watched from
            // the same place.
            orbit += dt * 0.021;
            const bob = Math.sin(clockT * 0.07) * 6;
            camera.position.set(
                Math.cos(orbit) * orbitR,
                orbitY + bob,
                Math.sin(orbit) * orbitR,
            );
            camera.lookAt(0, 4, 0);

            composer.render();
        };

        // Regenerating the crowd changes every static buffer, so the geometry is
        // rewritten in place rather than reallocated — the buffers are sized for
        // NBEARER and the field never exceeds it.
        function rebuildGeometry() {
            for (let i = 0; i < n; i++) {
                const bxv = field.baseX[i], byv = field.baseY[i], bzv = field.baseZ[i];
                const hxv = field.headX[i], hyv = field.headY[i], hzv = field.headZ[i];
                const hh = field.height[i];

                const a = i * 6;
                staffPos[a] = bxv; staffPos[a + 1] = byv; staffPos[a + 2] = bzv;
                staffPos[a + 3] = hxv; staffPos[a + 4] = hyv; staffPos[a + 5] = hzv;

                const s = hh / 8.5;
                for (let k = 0; k < MOTES; k++) {
                    const o = i * MOTES + k;
                    mHead[o * 3] = hxv; mHead[o * 3 + 1] = hyv; mHead[o * 3 + 2] = hzv;
                    mScale[o] = s;
                }
            }
            staffGeo.attributes.position.needsUpdate = true;
            flameGeo.attributes.position.needsUpdate = true;
            flameGeo.attributes.aScale.needsUpdate = true;
            bakeColdLight();
        }

        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            renderer.setSize(width, height, false);
            composer.setSize(width, height);
            bloomPass.setSize(width, height);
            setPointScale(height);
            fitCamera(width / height);
        };
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            staffGeo.dispose(); staffMat.dispose();
            groundGeo.dispose(); groundMat.dispose(); lightTex.dispose();
            flameGeo.dispose(); flameMat.dispose();
            arcGeo.dispose(); arcMat.dispose();
            stateTex.dispose();
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
            <div ref={containerRef} className="torchrite-stage">
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

export default Torchrite;
