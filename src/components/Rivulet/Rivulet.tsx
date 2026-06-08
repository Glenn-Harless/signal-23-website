import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './Rivulet.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { rivuletVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// Glitch-art post pass: persistent RGB split + scanlines, with periodic
// horizontal tearing and block corruption driven by uAmount.
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
            if (r > 0.8) { shift = (hash(band * 4.7 + tq) - 0.5) * (0.06 + uAmount * 0.4); }
            uv.x += shift;
            float ca = 0.0016 + uAmount * 0.009 + abs(shift) * 0.4;
            float cr = texture2D(tDiffuse, vec2(uv.x + ca, uv.y)).r;
            float cg = texture2D(tDiffuse, uv).g;
            float cb = texture2D(tDiffuse, vec2(uv.x - ca, uv.y)).b;
            vec3 col = vec3(cr, cg, cb);
            if (r > 0.92) { col += vec3(hash(band + tq * 5.0), hash(band + tq * 9.0), hash(band + tq * 13.0)) * uAmount * 0.45; }
            col *= 0.9 + 0.1 * sin(uv.y * uResolution.y * 3.14159);
            gl_FragColor = vec4(col, 1.0);
        }
    `,
};

// A braided stream as a node + edges graph, twisted into 3D: several channels
// wind around a central axis and cross-link — a braided rope of water, spinning.
const buildBraid = (halfH: number) => {
    const nodes: THREE.Vector3[] = [];
    const edgeSegs: number[] = [];
    const flowPaths: THREE.Vector3[][] = [];

    const TWO_PI = Math.PI * 2;
    const ROWS = 26 + ((Math.random() * 8) | 0);
    const STRANDS = 3 + ((Math.random() * 3) | 0);
    const baseR = halfH * 0.4;
    const twist = TWO_PI * (1.2 + Math.random() * 1.6); // total winding over the descent

    const strands = new Array(STRANDS).fill(0).map((_, s) => ({
        angle0: (TWO_PI * s) / STRANDS,
        ampR: halfH * (0.12 + Math.random() * 0.18),
        freqR: 0.8 + Math.random() * 1.4,
        phaseR: Math.random() * TWO_PI,
    }));

    const paths: THREE.Vector3[][] = strands.map(() => []);
    for (let r = 0; r <= ROWS; r++) {
        const rf = r / ROWS;
        const y = halfH - rf * 2 * halfH;
        strands.forEach((st) => {
            const angle = st.angle0 + twist * rf;
            const radius = baseR * (0.7 + rf * 0.3)
                + st.ampR * Math.sin(st.freqR * rf * TWO_PI + st.phaseR);
            paths[strands.indexOf(st)].push(
                new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle)),
            );
        });
    }

    paths.forEach((p) => {
        p.forEach((n) => nodes.push(n));
        for (let i = 0; i < p.length - 1; i++) {
            edgeSegs.push(p[i].x, p[i].y, p[i].z, p[i + 1].x, p[i + 1].y, p[i + 1].z);
        }
        flowPaths.push(p.slice());
    });

    const linkDist = baseR * 0.72;
    for (let r = 0; r <= ROWS; r++) {
        for (let a = 0; a < STRANDS; a++) {
            for (let b = a + 1; b < STRANDS; b++) {
                const na = paths[a][r], nb = paths[b][r];
                if (na.distanceTo(nb) < linkDist) {
                    edgeSegs.push(na.x, na.y, na.z, nb.x, nb.y, nb.z);
                }
            }
        }
    }

    return { nodes, edgeSegs: new Float32Array(edgeSegs), flowPaths };
};

export const Rivulet: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(rivuletVisualExport);

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
                a.href = url; a.download = `rivulet-${Date.now()}.webm`; a.click();
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
        const HALF_H = 120;
        const PIX = 2; // light digital crunch; the glitch shader carries the look

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050609);

        const { nodes, edgeSegs, flowPaths } = buildBraid(HALF_H);

        // bounding sphere for the camera fit
        let minY = Infinity, maxY = -Infinity, maxR2 = 0;
        nodes.forEach((n) => {
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
            const r2 = n.x * n.x + n.z * n.z;
            if (r2 > maxR2) maxR2 = r2;
        });
        const center = new THREE.Vector3(0, (minY + maxY) / 2, 0);
        const boundR = Math.max(1, Math.hypot(Math.sqrt(maxR2), (maxY - minY) / 2));

        const camera = new THREE.PerspectiveCamera(42, initialSize.width / initialSize.height, 0.1, 4000);
        let currentAspect = initialSize.width / initialSize.height;
        const ELEV = (26 * Math.PI) / 180;
        const fitCamera = () => {
            const fovY = (camera.fov * Math.PI) / 180;
            const fovX = 2 * Math.atan(Math.tan(fovY / 2) * currentAspect);
            const half = Math.min(fovY, fovX) / 2;
            const dist = (boundR / Math.sin(half)) * 1.05;
            camera.position.set(center.x, center.y + Math.sin(ELEV) * dist, center.z + Math.cos(ELEV) * dist);
            camera.lookAt(center);
            camera.near = Math.max(0.1, dist - boundR * 2);
            camera.far = dist + boundR * 3;
            camera.updateProjectionMatrix();
        };
        fitCamera();

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setPixelRatio(1);
        const canvas = renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.imageRendering = 'pixelated';
        mountElement.appendChild(canvas);
        canvasRef.current = canvas;

        const braid = new THREE.Group(); // spins
        scene.add(braid);

        // Edges
        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgeSegs, 3));
        const edgeMat = new THREE.LineBasicMaterial({
            color: 0x9aa4ae, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        braid.add(edges);

        // Nodes — square points (no texture) for a crisp low-res pixel look
        const N = nodes.length;
        const nodePos = new Float32Array(N * 3);
        const nodeCol = new Float32Array(N * 3);
        nodes.forEach((n, i) => { nodePos[i * 3] = n.x; nodePos[i * 3 + 1] = n.y; nodePos[i * 3 + 2] = n.z; });
        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
        nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
        const nodeMat = new THREE.PointsMaterial({
            size: 4.5, vertexColors: true, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        });
        const nodePoints = new THREE.Points(nodeGeo, nodeMat);
        braid.add(nodePoints);

        // Pulses — the current flowing the channels
        const PULSES = 14;
        const pulsePos = new Float32Array(PULSES * 3);
        const pulses = new Array(PULSES).fill(0).map(() => ({
            path: flowPaths[(Math.random() * flowPaths.length) | 0],
            t: Math.random(), speed: 0.06 + Math.random() * 0.06,
        }));
        const pulseGeo = new THREE.BufferGeometry();
        pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
            color: 0xffffff, size: 6, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        });
        const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
        braid.add(pulsePoints);

        const pulseAt = (p: { path: THREE.Vector3[]; t: number }) => {
            const pa = p.path;
            const seg = p.t * (pa.length - 1);
            const idx = Math.min(pa.length - 2, Math.floor(seg));
            const frac = seg - idx;
            const a = pa[idx], b = pa[idx + 1];
            return new THREE.Vector3(
                a.x + (b.x - a.x) * frac, a.y + (b.y - a.y) * frac, a.z + (b.z - a.z) * frac,
            );
        };

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.0, 0.7, 0.1);
        composer.addPass(bloom);
        const glitchPass = new ShaderPass(GlitchArtShader);
        glitchPass.uniforms.uResolution.value.set(initialSize.width, initialSize.height);
        composer.addPass(glitchPass);

        const setLowRes = (w: number, h: number) => {
            const lw = Math.max(1, Math.floor(w / PIX));
            const lh = Math.max(1, Math.floor(h / PIX));
            renderer.setSize(lw, lh, false); // false → leave canvas CSS size at 100%
            composer.setSize(lw, lh);
            glitchPass.uniforms.uResolution.value.set(lw, lh);
        };
        setLowRes(initialSize.width, initialSize.height);

        const nodeBase = new THREE.Color(0xe6ecf2);
        const SIGMA2 = 150;
        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

            braid.rotation.y += 0.22 * dt; // continuous spin

            const ppos: THREE.Vector3[] = [];
            for (let pi = 0; pi < PULSES; pi++) {
                const p = pulses[pi];
                p.t += p.speed * dt;
                if (p.t >= 1) {
                    p.t = 0;
                    p.path = flowPaths[(Math.random() * flowPaths.length) | 0];
                    p.speed = 0.06 + Math.random() * 0.06;
                }
                const v = pulseAt(p);
                ppos.push(v);
                pulsePos[pi * 3] = v.x; pulsePos[pi * 3 + 1] = v.y; pulsePos[pi * 3 + 2] = v.z;
            }
            (pulseGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

            for (let i = 0; i < N; i++) {
                const nx = nodePos[i * 3], ny = nodePos[i * 3 + 1], nz = nodePos[i * 3 + 2];
                let act = 0;
                for (let pi = 0; pi < PULSES; pi++) {
                    const dx = nx - ppos[pi].x, dy = ny - ppos[pi].y, dz = nz - ppos[pi].z;
                    act += Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * SIGMA2));
                }
                act = Math.min(1.3, act);
                const b = 0.46 + 0.12 * Math.sin(t * 1.4 + i * 0.7);
                nodeCol[i * 3] = nodeBase.r * b + act * 0.9;
                nodeCol[i * 3 + 1] = nodeBase.g * b + act * 0.9;
                nodeCol[i * 3 + 2] = nodeBase.b * b + act * 0.9;
            }
            (nodeGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
            edgeMat.opacity = 0.42 + Math.sin(t * 0.5) * 0.07;

            const burst = Math.pow(Math.max(0, Math.sin(t * 0.9 + Math.sin(t * 0.37) * 2.0)), 10);
            glitchPass.uniforms.uTime.value = t;
            glitchPass.uniforms.uAmount.value = 0.12 + burst * 0.85;

            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            currentAspect = width / height;
            camera.aspect = currentAspect;
            fitCamera();
            setLowRes(width, height);
        };
        resizeToMount();
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            edgeGeo.dispose(); edgeMat.dispose();
            nodeGeo.dispose(); nodeMat.dispose();
            pulseGeo.dispose(); pulseMat.dispose();
            scene.clear();
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
            <div ref={containerRef} className="rivulet-stage">
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

export default Rivulet;
