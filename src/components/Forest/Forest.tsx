import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { createInstancedForest } from './InstancedForest';
import { createFireflies, updateFireflies } from './Fireflies';
import { ActiveTreeOverlay } from './ActiveTreeOverlay';

const Forest: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // SCENE SETUP
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.FogExp2(0x000000, 0.025);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 30);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // INSTANCED FOREST
        const { mesh: forestMesh, treeData } = createInstancedForest(400, 6);
        scene.add(forestMesh);

        // FIREFLIES
        const fireflies = createFireflies(150);
        scene.add(fireflies);

        // ACTIVE TREE OVERLAY
        const activeOverlay = new ActiveTreeOverlay();
        scene.add(activeOverlay.getGroup());

        // GROUND FOG LAYER
        const planeGeo = new THREE.PlaneGeometry(200, 200);
        const planeMat = new THREE.MeshBasicMaterial({
            color: 0x05080a,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const groundFog = new THREE.Mesh(planeGeo, planeMat);
        groundFog.rotation.x = -Math.PI / 2;
        groundFog.position.y = 0.5;
        scene.add(groundFog);

        // POST PROCESSING
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        // TUNE BLOOM
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2, 0.6, 0.7
        );
        composer.addPass(bloomPass);

        // ANIMATION LOOP
        const clock = new THREE.Clock();

        // Tracking tree activation cooldowns
        const treeCooldowns: Map<string, number> = new Map();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update Forest Shader Uniforms
            const forestMat = forestMesh.material as THREE.ShaderMaterial;
            forestMat.uniforms.uTime.value = elapsedTime;
            forestMat.uniforms.uWindIntensity.value = 0.1 + Math.sin(elapsedTime * 0.3) * 0.05;

            // Update Fireflies
            updateFireflies(fireflies, elapsedTime);

            // Update Trace animations
            activeOverlay.update(elapsedTime);

            // FIREFLY PROXIMITY LOGIC
            const fireflyPos = fireflies.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < 150; i++) {
                const fy = fireflyPos[i * 3 + 1];
                // Only particles near "ground"
                if (fy < 4) {
                    const fx = fireflyPos[i * 3];
                    const fz = fireflyPos[i * 3 + 2];

                    for (const tree of treeData) {
                        const cooldown = treeCooldowns.get(tree.id) || 0;
                        if (elapsedTime > cooldown) {
                            const dx = fx - tree.position.x;
                            const dz = fz - tree.position.z;
                            const distSq = dx * dx + dz * dz;

                            if (distSq < 4) { // 2 unit radius
                                activeOverlay.tracePath(
                                    tree.position,
                                    tree.rotation,
                                    tree.scale,
                                    6,
                                    scene
                                );
                                // Prevent rapid re-activation
                                treeCooldowns.set(tree.id, elapsedTime + 8);
                                break;
                            }
                        }
                    }
                }
            }

            composer.render();
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100vh', background: 'black', overflow: 'hidden' }}
        />
    );
};

export default Forest;
