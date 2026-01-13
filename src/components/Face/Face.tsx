import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './Face.css';

export const Face: React.FC = () => {
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
            const stream = canvasRef.current.captureStream(30); // Reduced from 60fps
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 3000000 }); // Reduced from 8Mbps to 3Mbps
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `face-${Date.now()}.webm`;
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
            // Clear chunks after download to free memory
            chunksRef.current = [];
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;

        // Track resources for cleanup
        let abortController = new AbortController();
        let loadedGltf: any = null;
        let isComponentMounted = true;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.015);

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;  // Pulled back a bit more

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        canvasRef.current = renderer.domElement;

        // Handle WebGL context loss
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

        const faceGroup = new THREE.Group();
        scene.add(faceGroup);

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

        // Materials (created before loading)
        const pointsMat = new THREE.PointsMaterial({
            size: 0.12, // Much smaller to prevent blobbing
            map: nodeSprite,
            transparent: true,
            opacity: 0.6, // Lower opacity
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const lineMat = new THREE.LineBasicMaterial({
            color: 0x8899aa,
            transparent: true,
            opacity: 0.03, // Very faint wireframe
            blending: THREE.AdditiveBlending
        });


        // Storage for animation
        let points: THREE.Points | null = null;
        let wireframe: THREE.LineSegments | null = null;
        let originalPositions: Float32Array | null = null;
        let vertexCount = 0;

        // Add a loading indicator (simple rotating cube)
        const loadingGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const loadingMat = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
        const loadingCube = new THREE.Mesh(loadingGeom, loadingMat);
        scene.add(loadingCube);

        // Load the GLTF model
        const loader = new GLTFLoader();
        const modelPath = '/models/retopoed_head.glb';

        console.log('Attempting to load model from:', modelPath);

        loader.load(
            modelPath,
            (gltf) => {
                // Check if component was unmounted during loading
                if (abortController.signal.aborted || !isComponentMounted) {
                    // Dispose loaded resources immediately
                    gltf.scene.traverse((child: any) => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach((mat: any) => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                    return;
                }

                console.log('Model loaded successfully:', gltf);
                loadedGltf = gltf; // Store for cleanup

                // Remove loading indicator
                scene.remove(loadingCube);
                loadingGeom.dispose();
                loadingMat.dispose();

                const model = gltf.scene;
                let meshFound = false;

                // Find the mesh in the loaded model
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.geometry && !meshFound) {
                        meshFound = true;
                        const geometry = child.geometry as THREE.BufferGeometry;

                        console.log('Found mesh with', geometry.attributes.position.count, 'vertices');

                        // Get vertex positions
                        const positions = geometry.attributes.position;
                        vertexCount = positions.count;

                        // Store original positions for animation
                        const fullPositions = positions.array;

                        // Downsample points to avoid "blob" effect
                        // Target roughly 1500-2000 points for a clean "node" look
                        const targetPointCount = 2000;
                        const totalVertices = positions.count;
                        const samplingRate = Math.min(1, targetPointCount / totalVertices);

                        const sampledPositions: number[] = [];

                        for (let i = 0; i < totalVertices; i++) {
                            if (Math.random() < samplingRate) {
                                sampledPositions.push(
                                    fullPositions[i * 3],
                                    fullPositions[i * 3 + 1],
                                    fullPositions[i * 3 + 2]
                                );
                            }
                        }

                        const sampledFloat32 = new Float32Array(sampledPositions);
                        vertexCount = sampledPositions.length / 3;

                        // Create points from SAMPLED vertices
                        const pointsGeom = new THREE.BufferGeometry();
                        pointsGeom.setAttribute('position', new THREE.BufferAttribute(
                            sampledFloat32, 3
                        ));

                        points = new THREE.Points(pointsGeom, pointsMat);
                        faceGroup.add(points);

                        // Create wireframe from edges (keep original geometry for wireframe but it will be faint)
                        const wireframeGeom = new THREE.WireframeGeometry(geometry);
                        wireframe = new THREE.LineSegments(wireframeGeom, lineMat);
                        faceGroup.add(wireframe);

                        // Center the model
                        geometry.computeBoundingBox();
                        const box = geometry.boundingBox!;
                        const center = new THREE.Vector3();
                        box.getCenter(center);

                        console.log('Bounding box:', box.min, box.max);
                        console.log('Center:', center);

                        // Apply centering to the group
                        faceGroup.position.set(-center.x, -center.y, -center.z);

                        // Scale to fit view
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 3.5 / maxDim; // Slightly larger
                        faceGroup.scale.setScalar(scale);

                        // Apply initial rotation to orient face toward camera
                        // Rotate -90 degrees on X to look up/forward
                        points.rotation.x = -Math.PI / 2;
                        // Add a slight tilt
                        points.rotation.z = -Math.PI / 18;

                        if (wireframe) {
                            wireframe.rotation.x = -Math.PI / 2;
                            wireframe.rotation.z = -Math.PI / 18;
                        }

                        // Update originalPositions after setup with the SAMPLED data
                        const currentPointsPositions = points.geometry.attributes.position.array as Float32Array;
                        originalPositions = new Float32Array(currentPointsPositions);

                        console.log('Applied scale:', scale, '- Face oriented toward camera');

                        // Start animation now that model is loaded
                        if (!isAnimating && isComponentMounted) {
                            isAnimating = true;
                            animate();
                        }
                    }
                });

                if (!meshFound) {
                    console.error('No mesh found in loaded model!');
                }
            },
            (progress) => {
                if (progress.total > 0) {
                    console.log('Loading:', Math.round(progress.loaded / progress.total * 100) + '%');
                }
                // Rotate loading cube
                loadingCube.rotation.x += 0.05;
                loadingCube.rotation.y += 0.05;
            },
            (error) => {
                console.error('Error loading model:', error);
                // Show error visually
                loadingMat.color.setHex(0xff0000);
            }
        );

        // Animation state
        let animationId: number = 0;
        let glitchIntensity = 0;
        let targetGlitch = 0;
        let isAnimating = false;

        const animate = () => {
            if (!isComponentMounted) return;
            animationId = requestAnimationFrame(animate);
            const time = performance.now() * 0.001;

            // Subtle animation - geometry is already oriented correctly
            faceGroup.rotation.x = Math.sin(time * 0.08) * 0.1;  // Gentle nod
            faceGroup.rotation.y = Math.sin(time * 0.1) * 0.3;   // Slow turn

            // Subtle breathing scale
            const baseScale = faceGroup.scale.x; // Preserve loaded scale
            const breath = 1 + Math.sin(time * 0.8) * 0.01;

            // Random glitch triggers
            if (Math.random() > 0.997) {
                targetGlitch = 0.6 + Math.random() * 0.4;
            }
            glitchIntensity += (targetGlitch - glitchIntensity) * 0.1;
            if (targetGlitch > 0 && Math.random() > 0.92) {
                targetGlitch = 0;
            }

            // Update materials
            pointsMat.opacity = 0.7 + Math.sin(time * 2.0) * 0.2;
            lineMat.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;


            // Animate point positions if loaded
            if (points && originalPositions) {
                const positions = points.geometry.attributes.position.array as Float32Array;

                for (let i = 0; i < vertexCount; i++) {
                    const ox = originalPositions[i * 3];
                    const oy = originalPositions[i * 3 + 1];
                    const oz = originalPositions[i * 3 + 2];

                    // Subtle organic movement
                    const freq = 0.8;
                    const amp = 0.003;
                    const moveX = Math.sin(time * freq + oy * 5.0) * amp;
                    const moveY = Math.cos(time * freq * 0.8 + ox * 5.0) * amp;
                    const moveZ = Math.sin(time * freq * 1.2 + (ox + oy) * 3.0) * amp;

                    positions[i * 3] = ox + moveX;
                    positions[i * 3 + 1] = oy + moveY;
                    positions[i * 3 + 2] = oz + moveZ;
                }
                points.geometry.attributes.position.needsUpdate = true;
            }

            // Camera subtle movement
            camera.position.x = Math.sin(time * 0.15) * 0.3;
            camera.position.y = Math.cos(time * 0.12) * 0.2;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        // Don't start animation yet - wait for model to load

        // Throttled resize handler
        let resizeTimeout: NodeJS.Timeout | null = null;
        const handleResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 150); // Throttle to max once per 150ms
        };
        window.addEventListener('resize', handleResize);

        return () => {
            // Mark component as unmounted
            isComponentMounted = false;

            // Abort any ongoing model loading
            abortController.abort();

            // Stop animation
            if (animationId) cancelAnimationFrame(animationId);

            // Clear resize timeout
            if (resizeTimeout) clearTimeout(resizeTimeout);

            // Stop recording if active
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }

            // Remove event listeners
            window.removeEventListener('resize', handleResize);
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

            // Dispose loaded GLTF model
            if (loadedGltf) {
                loadedGltf.scene.traverse((child: any) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((mat: any) => {
                                // Dispose textures in material
                                if (mat.map) mat.map.dispose();
                                if (mat.normalMap) mat.normalMap.dispose();
                                if (mat.roughnessMap) mat.roughnessMap.dispose();
                                if (mat.metalnessMap) mat.metalnessMap.dispose();
                                mat.dispose();
                            });
                        } else {
                            // Dispose textures in material
                            if (child.material.map) child.material.map.dispose();
                            if (child.material.normalMap) child.material.normalMap.dispose();
                            if (child.material.roughnessMap) child.material.roughnessMap.dispose();
                            if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                            child.material.dispose();
                        }
                    }
                });
            }

            // Remove renderer from DOM
            if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }

            // Dispose all geometries and materials
            if (points) points.geometry.dispose();
            if (wireframe) wireframe.geometry.dispose();
            if (loadingCube.parent) {
                scene.remove(loadingCube);
                loadingGeom.dispose();
                loadingMat.dispose();
            }
            pointsMat.dispose();
            lineMat.dispose();
            nodeSprite.dispose();

            // Dispose renderer and clear canvas reference
            renderer.dispose();
            canvasRef.current = null;

            // Clear recording chunks
            chunksRef.current = [];
        };
    }, []);

    return (
        <div className="face-container">
            <div ref={mountRef} className="face-canvas" />

            {/* Record Button */}
            {process.env.NODE_ENV !== 'production' && (
                <button
                    className={`face-record-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                >
                    <span className="face-record-icon" />
                    {isRecording && <span className="face-record-time">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>}
                </button>
            )}
        </div>
    );
};
