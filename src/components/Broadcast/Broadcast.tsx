import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import gsap from 'gsap';

import { createTowerGeometry } from './TowerGeometry';
import { WaveRingSystem } from './WaveRingSystem';
import { NumbersStation } from './NumbersStation';
import { BroadcastPostShader } from './BroadcastPostShader';
import { RingParams } from './types';



const dataPayloads = [
    "4 7 2 9 0 3 8 1 6 5",
    "ECHO DELTA FOXTROT",
    "MESSAGE FOLLOWS",
    "BINARY SEARCH COMPLETE",
    "NEURAL PATHWAY DETECTED",
    "SIGNAL EPHEMERAL",
    "NOTHING IN BETWEEN",
    "THIS PLACE IS NOT HONORED",
    "WHAT IS HERE IS DANGEROUS",
    "THE DANGER IS STILL PRESENT",
];

const Broadcast: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const clockRef = useRef(new THREE.Clock());
    const [rings, setRings] = useState<RingParams[]>([]);
    const stateRef = useRef({
        rings: [] as RingParams[],
        audioPaused: true,
    });

    const systems = useMemo(() => ({
        ringSystem: new WaveRingSystem(),
        audioSystem: new NumbersStation(),
    }), []);

    useEffect(() => {
        if (!containerRef.current) return;

        // SCENE SETUP
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 5, 50);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 20);
        camera.lookAt(0, 8, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // TOWER
        const tower = createTowerGeometry();
        scene.add(tower);

        // WAVE RINGS
        scene.add(systems.ringSystem.getGroup());

        // FOG PLANE (Ground)
        const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
        const groundMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        scene.add(ground);

        // POST PROCESSING
        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.6, 0.4, 0.85
        );
        composer.addPass(bloomPass);

        const postPass = new ShaderPass(BroadcastPostShader);
        composer.addPass(postPass);


        // ANIMATION LOOP
        const isMobileRef = { current: window.innerWidth < 768 };
        let animationId: number;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const elapsedTime = clockRef.current.getElapsedTime();
            const avgFreq = systems.audioSystem.getAverageFrequency();

            // More intense aberration on mobile to be visible
            const baseAberration = isMobileRef.current ? 0.02 : 0.005;
            const freqAberration = isMobileRef.current ? 0.08 : 0.02;

            // Update Tower pulse
            tower.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material.opacity = 0.6 + Math.sin(elapsedTime * 2) * 0.2 + avgFreq * 0.5;
                }
            });

            // Update Rings
            systems.ringSystem.update(elapsedTime, avgFreq);

            // Update Post Shader
            postPass.uniforms.uTime.value = elapsedTime;
            postPass.uniforms.uChromAberration.value = baseAberration + avgFreq * freqAberration;

            // Update state for React (Data Fragments)
            stateRef.current.rings.forEach(ring => {
                ring.progress = (elapsedTime - ring.startTime) / 4; // 4 seconds duration
            });
            // Remove finished rings
            stateRef.current.rings = stateRef.current.rings.filter(r => r.progress < 1);
            setRings([...stateRef.current.rings]);

            composer.render();
        };

        animate();

        const handleResize = () => {
            isMobileRef.current = window.innerWidth < 768;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);

            // Kill any active gsap animations
            gsap.killTweensOf(systems.ringSystem);

            // Dispose scene objects
            scene.traverse((obj) => {
                if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                }
            });

            // Dispose ring system resources
            systems.ringSystem.dispose();

            groundMat.dispose();
            groundGeo.dispose();

            scene.clear();
            composer.dispose();
            renderer.dispose();
            systems.audioSystem.stop();
        };
    }, [systems]);

    const spawnRing = async () => {
        if (stateRef.current.audioPaused) {
            await systems.audioSystem.init();
            stateRef.current.audioPaused = false;
        }

        const id = Math.random().toString(36).substr(2, 9);
        const mesh = systems.ringSystem.spawnRing(id);
        const payload = dataPayloads[Math.floor(Math.random() * dataPayloads.length)];

        const newRing: RingParams = {
            id,
            startTime: clockRef.current.getElapsedTime(),
            progress: 0,
            payload,
            radius: 0
        };

        stateRef.current.rings.push(newRing);
        systems.audioSystem.triggerBurst();

        // Animate the ring uniform
        gsap.to(mesh.material.uniforms.uRingProgress, {
            value: 1,
            duration: 4,
            ease: "power1.out",
            onComplete: () => {
                systems.ringSystem.removeRing(id);
            }
        });
    };

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100vh', background: 'black', overflow: 'hidden', position: 'relative' }}
            onClick={spawnRing}
        >
        </div>
    );
};

export default Broadcast;
