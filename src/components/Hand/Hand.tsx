import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './Hand.css';

export const Hand: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
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
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 3000000 });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hand-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            mediaRecorderRef.current = recorder;
            recorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
        } catch (err) { console.error('Recording failed:', err); }
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

        let abortController = new AbortController();
        let loadedGltf: any = null;
        let isComponentMounted = true;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.015);

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        const handleContextLost = (event: Event) => {
            event.preventDefault();
            console.warn('WebGL context lost');
            if (animationId) cancelAnimationFrame(animationId);
        };

        const handleContextRestored = () => {
            console.log('WebGL context restored');
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (!animationId && isComponentMounted) animate();
        };

        renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

        const handGroup = new THREE.Group();
        scene.add(handGroup);

        // Point sprite texture
        const nodeSprite = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            grad.addColorStop(0, 'white');
            grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        })();

        const pointsMat = new THREE.PointsMaterial({
            size: 0.12,
            map: nodeSprite,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const lineMat = new THREE.LineBasicMaterial({
            color: 0x8899aa,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });

        let points: THREE.Points | null = null;
        let wireframe: THREE.LineSegments | null = null;
        let bones: THREE.Bone[] = [];
        let mixer: THREE.AnimationMixer | null = null;

        // Loading indicator
        const loadingGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const loadingMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
        const loadingCube = new THREE.Mesh(loadingGeom, loadingMat);
        scene.add(loadingCube);

        const loader = new GLTFLoader();
        const modelPath = '/models/skeleton_hand.glb'; // Ensure this matches the File provided

        loader.load(
            modelPath,
            (gltf) => {
                if (abortController.signal.aborted || !isComponentMounted) {
                    // Cleanup if unmounted
                    return;
                }

                console.log('Hand Model loaded:', gltf);
                loadedGltf = gltf;

                scene.remove(loadingCube);
                loadingGeom.dispose();
                loadingMat.dispose();

                const model = gltf.scene;

                // 1. Setup Mesh (Nodes and Edges)
                let meshFound = false;
                model.traverse((child) => {
                    // Find SkinnedMesh or Mesh for visual representation
                    if (child instanceof THREE.Mesh && !meshFound && child.geometry) {
                        meshFound = true;
                        const geometry = child.geometry as THREE.BufferGeometry;
                        // We do NOT center geometry here if we are using bones, because centering geometry might decouple it from the skeleton.
                        // However, for the node/wireframe effect, we sort of need to just use the vertices.
                        // But wait, if we want to animate bones, we need the SkinnedMesh to react to bones.
                        // The 'Face' component uses static geometry (sampled into Points). Points does NOT support skinning by default.
                        // To support opening/closing fingers, we have two options:
                        // A: Use the SkinnedMesh itself but render it as points/lines.
                        // B: Use the Points/Lines and manually animate vertices (hard).
                        // C: Use the actual SkinnedMesh but with a custom ShaderMaterial or just PointsMaterial?
                        // Actually, SkinnedMesh can use PointsMaterial, but it won't be "nodes".
                        // BUT, if the user provided a "skeleton_hand.glb", it likely has a skeleton.

                        // If we want "similar node and edge structure", we usually create a separate object (Points/LineSegments).
                        // BUT standard Points/LineSegments do NOT follow bones.
                        // So we should probably keep the original SkinnedMesh visible but maybe with a wireframe material or custom look?
                        // OR, we can try to bind the Points/LineSegments to the skeleton.

                        // "Face" doesn't have skinning. It just rotates the whole group.

                        // If I simple traverse and find bones, I can animate the bones.
                        // But the Points I create need to be "skinned". 
                        // Creating a SkinnedMesh with Points mode:
                        // THREE.SkinnedMesh actually extends Mesh.
                        // If we want points that follow bones, we can set the material to PointsMaterial on the SkinnedMesh?
                        // Let's try to just use the SkinnedMesh itself, but change its material to show nodes/edges?
                        // Or, we can duplicate the geometry, make a SkinnedMesh with PointsMaterial, and another with Wireframe.
                    }
                });

                // Add the whole scene to the group
                handGroup.add(model);

                // 1. Setup Material Look - Traverse and modify materials in-place or clone
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Create a wireframe version that follows the bone hierarchy
                        const wireMat = new THREE.MeshBasicMaterial({
                            color: 0x8899aa,
                            transparent: true,
                            opacity: 0.4,
                            blending: THREE.AdditiveBlending,
                            wireframe: true,
                            // skinning: true // Needed for older Three.js versions, handled automatically in newer.
                        } as any);

                        // If it's a SkinnedMesh, cloning it preserves the skeleton binding
                        // If it's a regular Mesh, it just clones the geometry and transform
                        const wireframeClone = child.clone();
                        wireframeClone.material = wireMat;

                        // Add to child's parent to inherit identical transforms
                        if (child.parent) {
                            child.parent.add(wireframeClone);
                        } else {
                            handGroup.add(wireframeClone);
                        }

                        // Hide the original opaque mesh
                        child.visible = false;

                        // For non-skinned meshes, we can also add points
                        if (!(child instanceof THREE.SkinnedMesh)) {
                            const p = new THREE.Points(child.geometry, pointsMat);
                            wireframeClone.add(p);
                        }
                    }
                });

                // Find Bones for Animation
                handGroup.traverse((child) => {
                    if (child instanceof THREE.Bone) {
                        bones.push(child);
                    }
                });

                // Animation Mixer
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(gltf.animations[0]).play();
                }

                // 2. Centering Logic
                // IMPORTANT: Calculate box from the model content
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Offset the model so its visual center is at (0,0,0) in local space
                model.position.sub(center);

                // Scale to fit
                const maxDim = Math.max(size.x, size.y, size.z) || 1;
                const targetScale = 3.5 / maxDim;
                handGroup.scale.setScalar(targetScale);

                // 3. Debug Object (Remove once verified)
                const debugBox = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.1, 0.1),
                    new THREE.MeshBasicMaterial({ color: 0xff0000 })
                );
                scene.add(debugBox);

                if (!isAnimating && isComponentMounted) {
                    isAnimating = true;
                    animate();
                }
            },
            undefined,
            (error) => {
                console.error('Error loading hand model:', error);
                loadingMat.color.setHex(0xff0000);
            }
        );

        // Animation state
        let animationId: number = 0;
        let isAnimating = false;

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            // Continuous rotation like Face
            handGroup.rotation.y = time * 0.3;

            // Update Mixer
            if (mixer) {
                mixer.update(0.016); // delta time
            } else {
                // PROCEDURAL ANIMATION (Finger Curl)
                // If no baked animation, we animate bones manually.
                // We look for bones that might be phalanges.
                // Simple heuristic: rotate all bones that are not root?
                // Or looking for names like "Proximal", "Mid", "Distal", "Phal"

                const angle = (Math.sin(time * 2) + 1) * 0.4; // 0 to 0.8 radians

                bones.forEach(bone => {
                    // Filter for finger joints based on common naming conventions or hierarchy depth
                    // Assuming standard rig: Hand -> Finger1 -> Finger1_01 ...
                    // We'll just animate everything deep in the hierarchy slightly
                    // OR specifically look for names.
                    const name = bone.name.toLowerCase();
                    if (name.includes('hand') || name.includes('root') || name.includes('wrist')) return;

                    // Rotate on Z or X axis (depends on rig orientation)
                    // We'll try Z axis which is common for curling
                    // We blend it to be safe
                    bone.rotation.z = -angle; // Curl in?
                });
            }

            // Material pulse (from Face.tsx)
            pointsMat.opacity = 0.7 + Math.sin(time * 2.0) * 0.2;
            lineMat.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;

            // Camera sway
            camera.position.x = Math.sin(time * 0.15) * 0.3;
            camera.position.y = Math.cos(time * 0.12) * 0.2;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            isComponentMounted = false;
            abortController.abort();
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();

            // Dispose logic similar to Face
            if (loadedGltf) { /* dispose traversal */ }
            if (mountRef.current && renderer.domElement) {
                if (mountRef.current.contains(renderer.domElement)) {
                    mountRef.current.removeChild(renderer.domElement);
                }
            }
        };
    }, []);

    return (
        <div className="hand-container">
            <div ref={mountRef} className="hand-canvas" />
            {/* Record Button */}
            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                    <span className="record-icon" />
                    {isRecording && <span className="record-time">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>}
                </button>
            )}
        </div>
    );
};
