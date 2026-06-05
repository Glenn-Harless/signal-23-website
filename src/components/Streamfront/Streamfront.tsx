import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import './Streamfront.css';

import { ExportFrame } from '../ExportFrame/ExportFrame';
import { streamfrontVisualExport } from '../../data/transmissions';
import { useExportSettings } from '../../lib/exportSettings';

// Soft round sprite so the flowing motes read as glowing dots, not squares.
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

type Node = { x: number; y: number; children: Node[] };

// A river delta: one channel up top that fans into many distributaries as it
// nears the "front" (the sea, at the bottom). The downward mirror of a tree.
const buildDelta = (halfH: number) => {
    const segments: number[] = []; // flat [x1,y1,0, x2,y2,0, ...] for LineSegments
    const root: Node = { x: 0, y: halfH, children: [] };
    let nodeCount = 0;
    const MAX_NODES = 3200;

    const grow = (node: Node, dirX: number, dirY: number, stepsFromSplit: number) => {
        if (node.y <= -halfH || nodeCount > MAX_NODES) return;

        // yf = 1 at the source, 0 at the front. Splitting ramps up toward the sea
        // so the upstream stays a river and the mouth fans into a delta.
        const yf = (node.y + halfH) / (2 * halfH);
        const widthFrac = Math.min(1, Math.abs(node.x) / (halfH * 0.95));
        const splittable = stepsFromSplit >= 2 && node.y < halfH - 10;
        const splitProb = 0.66 * Math.pow(1 - yf, 1.25) * (1 - widthFrac * 0.45);
        const willSplit = splittable && Math.random() < splitProb;
        const kids = willSplit ? 2 : 1;

        for (let k = 0; k < kids; k++) {
            let nx = dirX;
            if (willSplit) nx += (k === 0 ? -1 : 1) * (0.42 + Math.random() * 0.32);
            nx += (Math.random() - 0.5) * (yf > 0.55 ? 0.07 : 0.2); // calm trunk, lively mouth
            nx -= node.x * 0.011 * yf;        // keep the upstream channel centered
            nx += node.x * 0.004 * (1 - yf);  // fan outward as it nears the sea
            let ny = -(0.6 + Math.random() * 0.32); // always flowing down
            const len = Math.hypot(nx, ny) || 1;
            nx /= len; ny /= len;

            const step = 5 + Math.random() * 5;
            const child: Node = { x: node.x + nx * step, y: node.y + ny * step, children: [] };
            nodeCount++;
            node.children.push(child);
            segments.push(node.x, node.y, 0, child.x, child.y, 0);
            grow(child, nx, ny, willSplit ? 0 : stepsFromSplit + 1);
        }
    };

    grow(root, 0, -1, 99);

    // Collect every source->leaf path (point lists) for the flowing motes.
    const paths: THREE.Vector2[][] = [];
    const walk = (node: Node, trail: THREE.Vector2[]) => {
        const next = [...trail, new THREE.Vector2(node.x, node.y)];
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

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x02060c);
        scene.fog = new THREE.FogExp2(0x02060c, 0.0016);

        const HALF_H = 120;
        const { segments, paths } = buildDelta(HALF_H);

        // Fit an orthographic camera to the generated delta bounds for any aspect.
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < segments.length; i += 3) {
            minX = Math.min(minX, segments[i]); maxX = Math.max(maxX, segments[i]);
            minY = Math.min(minY, segments[i + 1]); maxY = Math.max(maxY, segments[i + 1]);
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const boundW = (maxX - minX) || 1;
        const boundH = (maxY - minY) || 1;

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        camera.position.set(cx, cy, 100);
        camera.lookAt(cx, cy, 0);

        const fitCamera = (aspect: number) => {
            const pad = 1.16;
            const worldW = boundW * pad;
            const worldH = boundH * pad;
            let viewW: number, viewH: number;
            if (aspect >= worldW / worldH) { viewH = worldH; viewW = viewH * aspect; }
            else { viewW = worldW; viewH = viewW / aspect; }
            camera.left = -viewW / 2; camera.right = viewW / 2;
            camera.top = viewH / 2; camera.bottom = -viewH / 2;
            camera.updateProjectionMatrix();
        };
        fitCamera(initialSize.width / initialSize.height);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(initialSize.width, initialSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountElement.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // Static channel map — dim glowing distributaries.
        const channelGeo = new THREE.BufferGeometry();
        channelGeo.setAttribute('position', new THREE.BufferAttribute(segments, 3));
        const channelMat = new THREE.LineBasicMaterial({
            color: 0x3d86ad, transparent: true, opacity: 0.42,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const channels = new THREE.LineSegments(channelGeo, channelMat);
        scene.add(channels);

        // The "front" — a soft band where the delta meets the sea.
        const frontGeo = new THREE.PlaneGeometry(boundW * 1.5, 14);
        const frontMat = new THREE.MeshBasicMaterial({
            color: 0x0c3d5c, transparent: true, opacity: 0.2,
            blending: THREE.AdditiveBlending, depthWrite: false,
        });
        const front = new THREE.Mesh(frontGeo, frontMat);
        front.position.set(cx, minY + 4, -1);
        scene.add(front);

        // Flowing motes that trace the branching as they run to the sea.
        const COUNT = Math.min(1700, paths.length * 8);
        const dotTex = makeDotTexture();
        const posArr = new Float32Array(COUNT * 3);
        const colArr = new Float32Array(COUNT * 3);
        const flow = new Array(COUNT).fill(0).map(() => ({
            path: paths[(Math.random() * paths.length) | 0],
            t: Math.random(),
            speed: 0.05 + Math.random() * 0.09,
        }));
        const baseCol = new THREE.Color(0x86e6ff);

        const writeParticle = (i: number) => {
            const f = flow[i];
            const p = f.path;
            const seg = f.t * (p.length - 1);
            const idx = Math.min(p.length - 2, Math.floor(seg));
            const frac = seg - idx;
            const a = p[idx], b = p[idx + 1];
            posArr[i * 3] = a.x + (b.x - a.x) * frac;
            posArr[i * 3 + 1] = a.y + (b.y - a.y) * frac;
            posArr[i * 3 + 2] = 0;
            // fade in at the source, dissolve into the sea near the front
            const bright = Math.min(1, f.t * 6) * (1 - Math.max(0, (f.t - 0.84) / 0.16) * 0.8);
            colArr[i * 3] = baseCol.r * bright;
            colArr[i * 3 + 1] = baseCol.g * bright;
            colArr[i * 3 + 2] = baseCol.b * bright;
        };
        for (let i = 0; i < COUNT; i++) writeParticle(i);

        const moteGeo = new THREE.BufferGeometry();
        moteGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        moteGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
        const moteMat = new THREE.PointsMaterial({
            size: 3.6, map: dotTex, vertexColors: true, transparent: true,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        });
        const motes = new THREE.Points(moteGeo, moteMat);
        scene.add(motes);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(initialSize.width, initialSize.height), 1.05, 0.78, 0.13,
        );
        composer.addPass(bloom);

        const clock = new THREE.Clock();
        let animationId = 0;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());
            const t = clock.elapsedTime;

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

            channelMat.opacity = 0.36 + Math.sin(t * 0.6) * 0.07;
            frontMat.opacity = 0.18 + Math.sin(t * 0.9) * 0.07;

            composer.render();
        };
        animate();

        const resizeToMount = () => {
            const { width, height } = getMountSize();
            fitCamera(width / height);
            renderer.setSize(width, height);
            composer.setSize(width, height);
        };
        resizeToMount();
        const resizeObserver = new ResizeObserver(resizeToMount);
        resizeObserver.observe(mountElement);

        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            channelGeo.dispose(); channelMat.dispose();
            moteGeo.dispose(); moteMat.dispose(); dotTex.dispose();
            frontGeo.dispose(); frontMat.dispose();
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
                    <div className="streamfront-hud">STREAMFRONT // DELTA</div>
                )}
                {process.env.NODE_ENV !== 'production' && !exportSettings.isExportMode && (
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
