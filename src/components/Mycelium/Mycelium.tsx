import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Mycelium.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { myceliumVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// Glitch-art post pass: persistent RGB split + scanlines, with horizontal
// tearing and block corruption driven by uAmount (bursts on node events).
const GlitchArtShader = {
    uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        uTime: { value: 0 },
        uAmount: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uAmount;
        uniform vec2 uResolution;
        varying vec2 vUv;
        float hash(float n){ return fract(sin(n) * 43758.5453123); }
        void main() {
            vec2 uv = vUv;
            float band = floor(uv.y * 26.0);
            float tq = floor(uTime * 11.0);
            float r = hash(band * 1.3 + tq * 2.1);
            float shift = 0.0;
            if (r > 0.9) { shift = (hash(band * 4.7 + tq) - 0.5) * (0.02 + uAmount * 0.3); }
            uv.x += shift;
            float ca = 0.0012 + uAmount * 0.004 + abs(shift) * 0.4;
            float cr = texture2D(tDiffuse, vec2(uv.x + ca, uv.y)).r;
            float cg = texture2D(tDiffuse, uv).g;
            float cb = texture2D(tDiffuse, vec2(uv.x - ca, uv.y)).b;
            vec3 col = vec3(cr, cg, cb);
            if (r > 0.94) { col += vec3(hash(band + tq * 5.0), hash(band + tq * 9.0), hash(band + tq * 13.0)) * uAmount * 0.22; }
            col *= 0.92 + 0.08 * sin(uv.y * uResolution.y * 3.14159);
            gl_FragColor = vec4(col, 1.0);
        }
    `,
};

// Physarum step: each agent senses the trail ahead / left / right, steers
// toward the strongest signal (pheromone + weighted food), advances, wraps.
const agentUpdateFrag = `
    uniform sampler2D uAgents;
    uniform sampler2D uTrail;
    uniform vec2 uTrailSize;
    uniform float uTime;
    uniform float uDt;
    uniform vec4 uNodes[10];
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float senseAt(vec2 uv) {
        vec2 s = texture2D(uTrail, fract(uv)).rg;
        // saturated far-field pull draws agents toward nodes without a deep
        // well; the small unsaturated term keeps highways passing through the
        // node itself instead of ringing around it
        return s.r + 1.2 * min(s.g, 0.3) + 0.15 * s.g;
    }
    void main() {
        vec4 a = texture2D(uAgents, vUv);
        vec2 pos = a.xy;
        float ang = a.z;
        vec2 texel = 1.0 / uTrailSize;
        // classic Jones (2010) kinetics, normalized to 60 steps/sec
        float steps = clamp(uDt * 60.0, 0.25, 2.0);
        float SD = 18.0;
        float SA = 0.785;
        float TURN = 0.45 * steps;
        float sf = senseAt(pos + vec2(cos(ang), sin(ang)) * SD * texel);
        float sl = senseAt(pos + vec2(cos(ang + SA), sin(ang + SA)) * SD * texel);
        float sr = senseAt(pos + vec2(cos(ang - SA), sin(ang - SA)) * SD * texel);
        float rnd = hash(vUv * 761.3 + vec2(fract(uTime * 0.731), fract(uTime * 1.137)));
        // occasional full reorientation: keeps an exploratory fringe of faint
        // hyphae alive around the established highways
        float pr = hash(vUv * 431.7 + vec2(fract(uTime * 1.93), fract(uTime * 0.61)));
        if (pr < 0.012 * steps) {
            ang = rnd * 6.28318;
        } else if (sf >= sl && sf >= sr) {
            ang += (rnd - 0.5) * 0.2 * TURN; // slight wander on the highway
        } else if (sl > sr) {
            ang += TURN;
        } else if (sr > sl) {
            ang -= TURN;
        } else {
            ang += (rnd - 0.5) * 2.0 * TURN;
        }
        pos += vec2(cos(ang), sin(ang)) * 1.0 * steps * texel;
        pos = fract(pos);
        // nodes emit hyphae: a small fraction of agents respawns at a random
        // active node each frame, anchoring the network to every source
        float tp = hash(vUv * 913.7 + vec2(fract(uTime * 2.71), fract(uTime * 0.913)));
        if (tp < 0.0006 * steps) {
            int slot = int(mod(floor(hash(vUv * 331.1 + tp) * 10.0), 10.0));
            vec4 n = uNodes[slot];
            if (n.z > 0.01) {
                pos = n.xy + (vec2(rnd, hash(vUv * 57.3 + rnd)) - 0.5) * 8.0 * texel;
                ang = rnd * 6.28318;
            }
        }
        gl_FragColor = vec4(pos, ang, a.w);
    }
`;

// Trail evolution: 3x3 diffusion + exponential decay on pheromone (R);
// food field (G) is stamped fresh each frame from the node uniforms.
const trailUpdateFrag = `
    uniform sampler2D uTrail;
    uniform vec2 uTexel;
    uniform vec2 uTrailSize;
    uniform float uDecay;
    uniform vec4 uNodes[10];
    varying vec2 vUv;
    void main() {
        float sum = 0.0;
        for (int dx = -1; dx <= 1; dx++) {
            for (int dy = -1; dy <= 1; dy++) {
                sum += texture2D(uTrail, vUv + vec2(float(dx), float(dy)) * uTexel).r;
            }
        }
        float r = min((sum / 9.0) * uDecay, 3.0);
        float g = 0.0;
        for (int i = 0; i < 10; i++) {
            float s = uNodes[i].z;
            if (s > 0.001) {
                vec2 d = (vUv - uNodes[i].xy) * uTrailSize;
                g += s * exp(-dot(d, d) / 5000.0); // sigma ~50px
            }
        }
        gl_FragColor = vec4(r, g, 0.0, 1.0);
    }
`;

// Deposit: agents rendered as points, additively marking the pheromone channel.
const depositVert = `
    uniform sampler2D uAgents;
    void main() {
        vec4 a = texture2D(uAgents, position.xy);
        gl_Position = vec4(a.xy * 2.0 - 1.0, 0.0, 1.0);
        gl_PointSize = 1.0;
    }
`;
const depositFrag = `
    void main() { gl_FragColor = vec4(0.035, 0.0, 0.0, 1.0); }
`;

// Display: trail density through the cold house ramp, plus node cores/halos.
const displayFrag = `
    uniform sampler2D uTrail;
    uniform vec2 uTrailSize;
    uniform vec4 uNodes[10];
    uniform float uTime;
    varying vec2 vUv;
    void main() {
        vec2 tr = texture2D(uTrail, vUv).rg;
        float d = 1.0 - exp(-tr.r * 0.55);
        vec3 bg    = vec3(0.008, 0.024, 0.047);
        vec3 slate = vec3(0.239, 0.525, 0.678);
        vec3 cyan  = vec3(0.525, 0.902, 1.0);
        vec3 bone  = vec3(0.902, 0.925, 0.949);
        vec3 col = bg + slate * tr.g * 0.06;
        col = mix(col, slate, smoothstep(0.01, 0.24, d));
        col = mix(col, cyan,  smoothstep(0.28, 0.70, d));
        col = mix(col, bone,  smoothstep(0.72, 0.98, d));
        for (int i = 0; i < 10; i++) {
            float s = uNodes[i].z;
            if (s > 0.001) {
                vec2 dpx = (vUv - uNodes[i].xy) * uTrailSize;
                float d2 = dot(dpx, dpx);
                float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + uNodes[i].w * 6.2831);
                col += vec3(1.2) * s * pulse * exp(-d2 / 14.0);
                col += cyan * s * pulse * 0.35 * exp(-d2 / 260.0);
            }
        }
        gl_FragColor = vec4(col, 1.0);
    }
`;

const copyFrag = `
    uniform sampler2D uSrc;
    varying vec2 vUv;
    void main() { gl_FragColor = texture2D(uSrc, vUv); }
`;

const passVert = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

type FoodNode = {
    id: number;
    x: number; y: number;      // uv space
    energy: number;            // 1 → 0
    drainMul: number;          // per-node consumption variance
    phase: number;             // display pulse offset
    colonizing: boolean;
    linked: boolean;
    depleting: boolean;
    lastSampleT: number;
    slot: number;              // index into the uNodes uniform array
};

const NODE_SLOTS = 10;

export const Mycelium: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(myceliumVisualExport);
    const [logs, setLogs] = useState<string[]>([]);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
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
                a.href = url; a.download = `mycelium-${Date.now()}.webm`; a.click();
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
        const PIX = 1.5; // sim + display below CSS resolution; canvas upscales pixelated
        const isSmall = initialSize.width < 768;
        const AGENT_DIM = isSmall ? 160 : 320; // 25k / 102k agents
        const AGENT_COUNT = AGENT_DIM * AGENT_DIM;
        const NODE_COUNT = isSmall ? 6 : 10;

        const simSize = (w: number, h: number) => ({
            w: Math.max(64, Math.floor(w / PIX)),
            h: Math.max(64, Math.floor(h / PIX)),
        });
        let { w: simW, h: simH } = simSize(initialSize.width, initialSize.height);

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
        renderer.setPixelRatio(1);
        renderer.setSize(simW, simH, false);
        const canvas = renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.imageRendering = 'pixelated';
        mountElement.appendChild(canvas);
        canvasRef.current = canvas;

        const makeTarget = (w: number, h: number) => new THREE.WebGLRenderTarget(w, h, {
            type: THREE.FloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            depthBuffer: false,
            stencilBuffer: false,
        });

        let agentA = makeTarget(AGENT_DIM, AGENT_DIM);
        let agentB = makeTarget(AGENT_DIM, AGENT_DIM);
        let trailA = makeTarget(simW, simH);
        let trailB = makeTarget(simW, simH);

        // Seed agents: random position, heading, per-agent phase seed.
        const seed = new Float32Array(AGENT_COUNT * 4);
        for (let i = 0; i < AGENT_COUNT; i++) {
            seed[i * 4] = Math.random();
            seed[i * 4 + 1] = Math.random();
            seed[i * 4 + 2] = Math.random() * Math.PI * 2;
            seed[i * 4 + 3] = Math.random();
        }
        const seedTex = new THREE.DataTexture(seed, AGENT_DIM, AGENT_DIM, THREE.RGBAFormat, THREE.FloatType);
        seedTex.needsUpdate = true;

        // Fullscreen-quad pass helper
        const passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const quadGeo = new THREE.PlaneGeometry(2, 2);
        const makePass = (material: THREE.ShaderMaterial) => {
            const scene = new THREE.Scene();
            const mesh = new THREE.Mesh(quadGeo, material);
            mesh.frustumCulled = false;
            scene.add(mesh);
            return scene;
        };

        const nodeUniform = Array.from({ length: NODE_SLOTS }, () => new THREE.Vector4(0, 0, 0, 0));

        const copyMat = new THREE.ShaderMaterial({
            uniforms: { uSrc: { value: seedTex } },
            vertexShader: passVert, fragmentShader: copyFrag, depthTest: false, depthWrite: false,
        });
        const agentMat = new THREE.ShaderMaterial({
            uniforms: {
                uAgents: { value: null }, uTrail: { value: null },
                uTrailSize: { value: new THREE.Vector2(simW, simH) },
                uTime: { value: 0 }, uDt: { value: 0 },
                uNodes: { value: nodeUniform },
            },
            vertexShader: passVert, fragmentShader: agentUpdateFrag, depthTest: false, depthWrite: false,
        });
        const trailMat = new THREE.ShaderMaterial({
            uniforms: {
                uTrail: { value: null },
                uTexel: { value: new THREE.Vector2(1 / simW, 1 / simH) },
                uTrailSize: { value: new THREE.Vector2(simW, simH) },
                uDecay: { value: 0.93 },
                uNodes: { value: nodeUniform },
            },
            vertexShader: passVert, fragmentShader: trailUpdateFrag, depthTest: false, depthWrite: false,
        });
        const displayMat = new THREE.ShaderMaterial({
            uniforms: {
                uTrail: { value: null },
                uTrailSize: { value: new THREE.Vector2(simW, simH) },
                uNodes: { value: nodeUniform },
                uTime: { value: 0 },
            },
            vertexShader: passVert, fragmentShader: displayFrag, depthTest: false, depthWrite: false,
        });

        const copyScene = makePass(copyMat);
        const agentScene = makePass(agentMat);
        const trailScene = makePass(trailMat);
        const displayScene = makePass(displayMat);

        // Deposit points: position.xy is each agent's uv in the agent texture.
        const refs = new Float32Array(AGENT_COUNT * 3);
        for (let i = 0; i < AGENT_COUNT; i++) {
            refs[i * 3] = ((i % AGENT_DIM) + 0.5) / AGENT_DIM;
            refs[i * 3 + 1] = (Math.floor(i / AGENT_DIM) + 0.5) / AGENT_DIM;
        }
        const depositGeo = new THREE.BufferGeometry();
        depositGeo.setAttribute('position', new THREE.BufferAttribute(refs, 3));
        const depositMat = new THREE.ShaderMaterial({
            uniforms: { uAgents: { value: null } },
            vertexShader: depositVert, fragmentShader: depositFrag,
            blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
        });
        const depositPoints = new THREE.Points(depositGeo, depositMat);
        depositPoints.frustumCulled = false;
        const depositScene = new THREE.Scene();
        depositScene.add(depositPoints);

        // Prime: seed → agentA, clear trails.
        renderer.setRenderTarget(agentA);
        renderer.render(copyScene, passCam);
        renderer.setClearColor(0x000000, 1);
        renderer.setRenderTarget(trailA); renderer.clear();
        renderer.setRenderTarget(trailB); renderer.clear();
        renderer.setRenderTarget(null);

        // Post chain
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(displayScene, passCam));
        const glitchPass = new ShaderPass(GlitchArtShader);
        glitchPass.uniforms.uResolution.value.set(simW, simH);
        composer.addPass(glitchPass);
        composer.setSize(simW, simH);

        // ── Node lifecycle (CPU) ────────────────────────────────────────────
        const pushLog = (msg: string) => setLogs((prev) => [...prev.slice(-8), msg]);
        const fmtId = (id: number) => String(id).padStart(2, '0');

        const nodes: FoodNode[] = [];
        const respawnQueue: { at: number; slot: number }[] = [];
        let nextId = 1;
        const readBuf = new Float32Array(4);

        const spawnNode = (t: number, slot: number) => {
            let x = 0.5, y = 0.5;
            for (let attempt = 0; attempt < 24; attempt++) {
                x = 0.1 + Math.random() * 0.8;
                y = 0.12 + Math.random() * 0.76;
                const ok = nodes.every((n) => {
                    const dx = n.x - x, dy = n.y - y;
                    return dx * dx + dy * dy > 0.16 * 0.16;
                });
                if (ok) break;
            }
            const node: FoodNode = {
                id: nextId++, x, y,
                energy: 0.8 + Math.random() * 0.2,
                drainMul: 0.7 + Math.random() * 0.45,
                phase: Math.random(),
                colonizing: false, linked: false, depleting: false,
                lastSampleT: t, slot,
            };
            nodes.push(node);
            nodeUniform[slot].set(x, y, 1, node.phase);
            pushLog(`> NODE_${fmtId(node.id)} DETECTED [${x.toFixed(2)}, ${y.toFixed(2)}]`);
        };

        const killNode = (node: FoodNode, t: number) => {
            nodeUniform[node.slot].set(0, 0, 0, 0);
            nodes.splice(nodes.indexOf(node), 1);
            pushLog(`> SOURCE_${fmtId(node.id)} EXHAUSTED`);
            pushLog('> REROUTING FLOW...');
            glitchBoost = Math.max(glitchBoost, 0.6);
            respawnQueue.push({ at: t + 3 + Math.random() * 5, slot: node.slot });
        };

        // Stagger initial nodes over the first seconds — a slow reveal.
        pushLog('> SUBSTRATE MAPPED');
        pushLog(`> DEPLOYING SPORES: ${AGENT_COUNT}`);
        for (let s = 0; s < NODE_COUNT; s++) {
            respawnQueue.push({ at: 0.6 + s * 0.7, slot: s });
        }

        // Density thresholds (pheromone units at the node's pixel)
        const COLONIZE_D = 0.25;
        const LINK_D = 0.8;
        const DRAIN_RATE = 0.018; // energy/sec at full density once linked → ~45-80s per node
        const SAMPLE_INTERVAL = 0.15;
        let sampleCursor = 0;
        let lastSampleAt = 0;
        let lastEfficiencyAt = 12;
        let glitchBoost = 0;

        const sampleNode = (node: FoodNode, t: number, trail: THREE.WebGLRenderTarget) => {
            const px = Math.min(simW - 1, Math.max(0, Math.floor(node.x * simW)));
            const py = Math.min(simH - 1, Math.max(0, Math.floor(node.y * simH)));
            renderer.readRenderTargetPixels(trail, px, py, 1, 1, readBuf);
            const density = readBuf[0];
            const dtNode = Math.min(5, t - node.lastSampleT);
            node.lastSampleT = t;

            if (!node.colonizing && density > COLONIZE_D) {
                node.colonizing = true;
                pushLog(`> COLONIZING NODE_${fmtId(node.id)}...`);
                glitchBoost = Math.max(glitchBoost, 0.12);
            }
            if (!node.linked && density > LINK_D) {
                node.linked = true;
                pushLog(`> LINK ESTABLISHED <-> NODE_${fmtId(node.id)}`);
                glitchBoost = Math.max(glitchBoost, 0.25);
            }
            // sources are only consumed once the network reaches them
            if (node.linked) {
                node.energy -= Math.min(1, density / 1.5) * DRAIN_RATE * node.drainMul * dtNode;
            }
            if (!node.depleting && node.linked && node.energy < 0.3) {
                node.depleting = true;
                pushLog(`> SOURCE_${fmtId(node.id)} DEPLETING (${Math.round(node.energy * 100)}%)`);
            }
            if (node.energy <= 0) {
                killNode(node, t);
            } else {
                nodeUniform[node.slot].set(node.x, node.y, Math.max(0.15, node.energy), node.phase);
            }
        };

        // ── Main loop ───────────────────────────────────────────────────────
        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

            // node spawns
            while (respawnQueue.length && respawnQueue[0].at <= t) {
                const { slot } = respawnQueue.shift()!;
                spawnNode(t, slot);
            }
            respawnQueue.sort((a, b) => a.at - b.at);

            // 1. agent update: read agentA + trailA → write agentB
            agentMat.uniforms.uAgents.value = agentA.texture;
            agentMat.uniforms.uTrail.value = trailA.texture;
            agentMat.uniforms.uTime.value = t;
            agentMat.uniforms.uDt.value = dt;
            renderer.setRenderTarget(agentB);
            renderer.render(agentScene, passCam);
            [agentA, agentB] = [agentB, agentA];

            // 2. trail diffuse/decay + food stamp: trailA → trailB
            trailMat.uniforms.uTrail.value = trailA.texture;
            renderer.setRenderTarget(trailB);
            renderer.render(trailScene, passCam);

            // 3. deposit agents into trailB (no clear)
            depositMat.uniforms.uAgents.value = agentA.texture;
            renderer.autoClear = false;
            renderer.render(depositScene, passCam);
            renderer.autoClear = true;
            [trailA, trailB] = [trailB, trailA];

            // staggered node telemetry: one tiny readback per interval
            if (t - lastSampleAt > SAMPLE_INTERVAL && nodes.length > 0) {
                lastSampleAt = t;
                sampleCursor = (sampleCursor + 1) % nodes.length;
                sampleNode(nodes[sampleCursor], t, trailA);
            }

            if (t > lastEfficiencyAt) {
                lastEfficiencyAt = t + 25;
                const linked = nodes.filter((n) => n.linked).length;
                const eff = nodes.length ? linked / nodes.length : 0;
                pushLog(`> NETWORK EFFICIENCY ${(0.52 + eff * 0.46).toFixed(2)}`);
            }

            // 4. display + glitch to screen
            displayMat.uniforms.uTrail.value = trailA.texture;
            displayMat.uniforms.uTime.value = t;
            glitchBoost *= Math.exp(-dt * 2.2);
            glitchPass.uniforms.uTime.value = t;
            glitchPass.uniforms.uAmount.value = 0.03 + glitchBoost;
            renderer.setRenderTarget(null);
            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            const s = simSize(width, height);
            if (s.w === simW && s.h === simH) return;
            simW = s.w; simH = s.h;
            renderer.setSize(simW, simH, false);
            composer.setSize(simW, simH);
            trailA.dispose(); trailB.dispose();
            trailA = makeTarget(simW, simH);
            trailB = makeTarget(simW, simH);
            renderer.setRenderTarget(trailA); renderer.clear();
            renderer.setRenderTarget(trailB); renderer.clear();
            renderer.setRenderTarget(null);
            trailMat.uniforms.uTexel.value.set(1 / simW, 1 / simH);
            trailMat.uniforms.uTrailSize.value.set(simW, simH);
            agentMat.uniforms.uTrailSize.value.set(simW, simH);
            displayMat.uniforms.uTrailSize.value.set(simW, simH);
            glitchPass.uniforms.uResolution.value.set(simW, simH);
            glitchBoost = 1; // mask the re-condensation
        };
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            agentA.dispose(); agentB.dispose();
            trailA.dispose(); trailB.dispose();
            seedTex.dispose();
            quadGeo.dispose(); depositGeo.dispose();
            copyMat.dispose(); agentMat.dispose(); trailMat.dispose();
            displayMat.dispose(); depositMat.dispose();
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
            <div ref={containerRef} className="mycelium-stage">
                {!exportSettings.isExportMode && (
                    <>
                        <button
                            className={`record-button ${isRecording ? 'recording' : ''}`}
                            onClick={toggleRecording}
                            title={isRecording ? 'Stop Recording' : 'Start Recording'}
                        >
                            <span className="record-icon" />
                            {isRecording && <span className="record-time">{formatTime(recordingTime)}</span>}
                        </button>
                        <div className="mycelium-log">
                            {logs.map((line, i) => (
                                <div key={`${i}-${line}`} className="mycelium-log-line">{line}</div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </ExportFrame>
    );
};

export default Mycelium;
