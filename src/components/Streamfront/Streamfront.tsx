import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Streamfront.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { streamfrontVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

const makeDotTexture = () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
};

type Node = { x: number; y: number; z: number; children: Node[] };

// A 3D river-delta funnel: one channel at the top that fans radially outward and
// down into branching distributaries — a cone of glowing water you look into.
const buildDelta = (halfH: number) => {
    const segments: number[] = [];
    const root: Node = { x: 0, y: halfH, z: 0, children: [] };
    let nodeCount = 0;
    const MAX_NODES = 3400;

    const grow = (node: Node, dx: number, dy: number, dz: number, stepsFromSplit: number) => {
        if (node.y <= -halfH || nodeCount > MAX_NODES) return;

        const yf = (node.y + halfH) / (2 * halfH); // 1 at source, 0 at the sea
        const radius = Math.hypot(node.x, node.z);
        const widthFrac = Math.min(1, radius / (halfH * 0.95));
        const splittable = stepsFromSplit >= 2 && node.y < halfH - 10;
        const splitProb = 0.6 * Math.pow(1 - yf, 1.2) * (1 - widthFrac * 0.4);
        const willSplit = splittable && Math.random() < splitProb;
        const kids = willSplit ? 2 : 1;

        // radial-out + tangential basis in the XZ plane
        let ox = node.x, oz = node.z;
        const orad = Math.hypot(ox, oz);
        if (orad < 1e-3) {
            const dl = Math.hypot(dx, dz);
            if (dl > 1e-3) { ox = dx / dl; oz = dz / dl; } // follow the seed's heading off-axis
            else { const a = Math.random() * Math.PI * 2; ox = Math.cos(a); oz = Math.sin(a); }
        } else { ox /= orad; oz /= orad; }
        const tx = -oz, tz = ox;

        for (let k = 0; k < kids; k++) {
            let ndx = dx, ndz = dz;
            const out = (willSplit ? 0.32 + Math.random() * 0.2 : 0.05) + 0.1;
            ndx = dx + ox * out * (1 - yf * 0.5);
            ndz = dz + oz * out * (1 - yf * 0.5);
            const swirl = 0.14 * (1 - yf);
            ndx += tx * swirl; ndz += tz * swirl;
            if (willSplit) { const s = k === 0 ? -1 : 1; ndx += tx * s * 0.26; ndz += tz * s * 0.26; }
            ndx += (Math.random() - 0.5) * 0.12; ndz += (Math.random() - 0.5) * 0.12;
            ndx -= node.x * 0.01 * yf; ndz -= node.z * 0.01 * yf; // center the upstream channel
            const ndy = -(0.6 + Math.random() * 0.3);
            const len = Math.hypot(ndx, ndy, ndz) || 1;
            ndx /= len; const ny = ndy / len; ndz /= len;

            const step = 5 + Math.random() * 5;
            const child: Node = {
                x: node.x + ndx * step, y: node.y + ny * step, z: node.z + ndz * step, children: [],
            };
            nodeCount++;
            node.children.push(child);
            segments.push(node.x, node.y, node.z, child.x, child.y, child.z);
            grow(child, ndx, ny, ndz, willSplit ? 0 : stepsFromSplit + 1);
        }
    };

    // Seed several distributaries around the full circle → a complete 360° funnel.
    const SEEDS = 5 + ((Math.random() * 3) | 0);
    for (let s = 0; s < SEEDS; s++) {
        const a = (s / SEEDS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dx0 = Math.cos(a) * 0.32, dz0 = Math.sin(a) * 0.32, dy0 = -0.92;
        const l = Math.hypot(dx0, dy0, dz0);
        grow(root, dx0 / l, dy0 / l, dz0 / l, 99);
    }

    const paths: THREE.Vector3[][] = [];
    const walk = (node: Node, trail: THREE.Vector3[]) => {
        const next = [...trail, new THREE.Vector3(node.x, node.y, node.z)];
        if (node.children.length === 0) {
            if (next.length > 2) paths.push(next);
            return;
        }
        node.children.forEach((c) => walk(c, next));
    };
    walk(root, []);

    return { segments: new Float32Array(segments), paths };
};

export const Streamfront: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const exportSettings = useExportSettings(streamfrontVisualExport);

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
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 8000000,
            });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `streamfront-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
        } catch (err) {
            console.error('Recording failed:', err);
        }
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

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02060c);
        scene.fog = new THREE.FogExp2(0x02060c, 0.0014);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initialSize.width, initialSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountElement.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        const camera = new THREE.PerspectiveCamera(42, initialSize.width / initialSize.height, 0.1, 4000);
        let currentAspect = initialSize.width / initialSize.height;
        const ELEV = (42 * Math.PI) / 180; // camera angle above horizontal — looking down into the funnel
        const center = new THREE.Vector3(0, 0, 0);
        let boundR = HALF_H * 1.4;

        const fitCamera = () => {
            const fovY = (camera.fov * Math.PI) / 180;
            const fovX = 2 * Math.atan(Math.tan(fovY / 2) * currentAspect);
            const half = Math.min(fovY, fovX) / 2;
            const dist = (boundR / Math.sin(half)) * 0.9;
            camera.position.set(
                center.x,
                center.y + Math.sin(ELEV) * dist,
                center.z + Math.cos(ELEV) * dist,
            );
            camera.lookAt(center);
            camera.near = Math.max(0.1, dist - boundR * 2);
            camera.far = dist + boundR * 3;
            camera.updateProjectionMatrix();
        };

        // The funnel spins around its vertical axis.
        const deltaGroup = new THREE.Group();
        scene.add(deltaGroup);

        const channelMat = new THREE.LineBasicMaterial({
            color: 0x3d86ad, transparent: true, opacity: 0.42,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const channels = new THREE.LineSegments(new THREE.BufferGeometry(), channelMat);
        deltaGroup.add(channels);

        const COUNT = 1400;
        const dotTex = makeDotTexture();
        const posArr = new Float32Array(COUNT * 3);
        const colArr = new Float32Array(COUNT * 3);
        const baseCol = new THREE.Color(0x86e6ff);
        let paths: THREE.Vector3[][] = [[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -1, 0)]];
        const flow = new Array(COUNT).fill(0).map(() => ({
            path: paths[0], t: Math.random(), speed: 0.05 + Math.random() * 0.09,
        }));

        let skipQuant = 0; // >0 during the dissolve makes the mote flow stutter
        const writeParticle = (i: number) => {
            const f = flow[i];
            const p = f.path;
            const tt = skipQuant > 0 ? Math.round(f.t / skipQuant) * skipQuant : f.t;
            const seg = tt * (p.length - 1);
            const idx = Math.min(p.length - 2, Math.floor(seg));
            const frac = seg - idx;
            const a = p[idx], b = p[idx + 1];
            posArr[i * 3] = a.x + (b.x - a.x) * frac;
            posArr[i * 3 + 1] = a.y + (b.y - a.y) * frac;
            posArr[i * 3 + 2] = a.z + (b.z - a.z) * frac;
            const bright = Math.min(1, f.t * 6) * (1 - Math.max(0, (f.t - 0.84) / 0.16) * 0.8);
            colArr[i * 3] = baseCol.r * bright;
            colArr[i * 3 + 1] = baseCol.g * bright;
            colArr[i * 3 + 2] = baseCol.b * bright;
        };

        const moteGeo = new THREE.BufferGeometry();
        moteGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        moteGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
        const moteMat = new THREE.PointsMaterial({
            size: 4.2, map: dotTex, vertexColors: true, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        });
        const motes = new THREE.Points(moteGeo, moteMat);
        deltaGroup.add(motes);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), 1.45, 0.8, 0.12,
        );
        composer.addPass(bloom);

        const regenerate = () => {
            const built = buildDelta(HALF_H);
            paths = built.paths.length ? built.paths : paths;
            const segs = built.segments;

            let minY = Infinity, maxY = -Infinity, maxR2 = 0;
            for (let i = 0; i < segs.length; i += 3) {
                minY = Math.min(minY, segs[i + 1]); maxY = Math.max(maxY, segs[i + 1]);
                const r2 = segs[i] * segs[i] + segs[i + 2] * segs[i + 2];
                if (r2 > maxR2) maxR2 = r2;
            }
            center.set(0, (minY + maxY) / 2, 0);
            const halfSpanY = (maxY - minY) / 2;
            boundR = Math.max(1, Math.hypot(Math.sqrt(maxR2), halfSpanY));
            fitCamera();

            channels.geometry.dispose();
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(segs, 3));
            channels.geometry = geo;

            for (let i = 0; i < COUNT; i++) {
                flow[i].path = paths[(Math.random() * paths.length) | 0];
                flow[i].t = Math.random();
                flow[i].speed = 0.05 + Math.random() * 0.09;
                writeParticle(i);
            }
            (moteGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (moteGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        };

        regenerate();

        // Transition state machine: flow → dissolve (stutter + fade out) → reform (fade in).
        const OUT_DUR = 0.75;
        const IN_DUR = 0.9;
        let phase: 'flow' | 'out' | 'in' = 'flow';
        let phaseT = 0;
        let nextShiftIn = 6 + Math.random() * 4;

        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

            // slow rotation, always — keeps it alive so a redraw never feels static
            deltaGroup.rotation.y += 0.16 * dt;

            let alpha = 1;
            phaseT += dt;
            if (phase === 'flow') {
                skipQuant = 0;
                if (phaseT >= nextShiftIn) { phase = 'out'; phaseT = 0; }
            } else if (phase === 'out') {
                const k = Math.min(1, phaseT / OUT_DUR);
                alpha = 1 - k;
                skipQuant = 0.04 + k * 0.14; // increasingly stuttery as it fades
                if (phaseT >= OUT_DUR) { regenerate(); phase = 'in'; phaseT = 0; }
            } else { // 'in'
                const k = Math.min(1, phaseT / IN_DUR);
                alpha = k;
                skipQuant = (1 - k) * 0.08;
                if (phaseT >= IN_DUR) { phase = 'flow'; phaseT = 0; nextShiftIn = 6 + Math.random() * 4; }
            }

            for (let i = 0; i < COUNT; i++) {
                const f = flow[i];
                f.t += f.speed * dt;
                if (f.t >= 1) {
                    f.t = 0;
                    f.path = paths[(Math.random() * paths.length) | 0];
                    f.speed = 0.05 + Math.random() * 0.09;
                }
                writeParticle(i);
            }
            (moteGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
            (moteGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;

            channelMat.opacity = (0.5 + Math.sin(t * 0.6) * 0.08) * alpha;
            moteMat.opacity = alpha;

            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            currentAspect = width / height;
            camera.aspect = currentAspect;
            fitCamera();
            renderer.setSize(width, height);
            composer.setSize(width, height);
        };
        resizeToMount();
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            channels.geometry.dispose(); channelMat.dispose();
            moteGeo.dispose(); moteMat.dispose(); dotTex.dispose();
            scene.clear();
            composer.dispose();
            renderer.dispose();
            if (mountElement.contains(renderer.domElement)) mountElement.removeChild(renderer.domElement);
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, [exportSettings.isExportMode]);

    return (
        <ExportFrame aspect={exportSettings.aspect} active={exportSettings.isExportMode}>
            <div ref={containerRef} className="streamfront-stage">
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

export default Streamfront;
