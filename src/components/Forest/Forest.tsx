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
        scene.fog = new THREE.FogExp2(0x000000, 0.03);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 25);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // INSTANCED FOREST
        const { mesh: forestMesh, treeData } = createInstancedForest(200, 5);
        scene.add(forestMesh);

        // FIREFLIES
        const fireflies = createFireflies(80);
        scene.add(fireflies);

        // ACTIVE TREE OVERLAY
        const activeOverlay = new ActiveTreeOverlay();
        scene.add(activeOverlay.getGroup());

        // POST PROCESSING
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5, 0.4, 0.85
        );
        composer.addPass(bloomPass);

        // ANIMATION LOOP
        const clock = new THREE.Clock();
        let lastTraceTime = 0;

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update Shaders
            (forestMesh.material as THREE.ShaderMaterial).uniforms.uTime = { value: elapsedTime };

            // Update Fireflies
            updateFireflies(fireflies, elapsedTime);

            // Occasional path trace
            if (elapsedTime - lastTraceTime > 5) {
                const randomTree = treeData[Math.floor(Math.random() * treeData.length)];
                activeOverlay.tracePath(
                    randomTree.position,
                    randomTree.rotation,
                    randomTree.scale,
                    5
                );
                lastTraceTime = elapsedTime;
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
            containerRef.current?.removeChild(renderer.domElement);
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
