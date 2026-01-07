import * as THREE from 'three';
import { RingParams } from './types';
import { BroadcastShader } from './BroadcastShader';

export class WaveRingSystem {
    private rings: THREE.Mesh[] = [];
    private group: THREE.Group;
    private maxRings = 12;

    constructor() {
        this.group = new THREE.Group();
    }

    getGroup() {
        return this.group;
    }

    spawnRing(id: string) {
        if (this.rings.length >= this.maxRings) {
            const oldRing = this.rings.shift();
            if (oldRing) this.group.remove(oldRing);
        }

        const geometry = new THREE.TorusGeometry(1, 0.05, 16, 100);
        const material = new THREE.ShaderMaterial({
            ...BroadcastShader,
            uniforms: THREE.UniformsUtils.clone(BroadcastShader.uniforms),
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = Math.PI / 2;
        mesh.name = id;

        this.rings.push(mesh);
        this.group.add(mesh);
        return mesh;
    }

    update(time: number, frequencyData: number) {
        this.rings.forEach((ring, index) => {
            const material = ring.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = time;
            material.uniforms.uFrequencyData.value = frequencyData;

            // Progress is handled by GSAP externally or incremented here
            // For now, let's assume we update uRingProgress via uniforms

            const progress = material.uniforms.uRingProgress.value;
            const scale = 1 + progress * 20; // Expand outward
            ring.scale.set(scale, scale, 1);

            // If progress is 1, we could flag for removal
        });
    }

    removeRing(id: string) {
        const ringIndex = this.rings.findIndex(r => r.name === id);
        if (ringIndex > -1) {
            const ring = this.rings[ringIndex];
            this.group.remove(ring);
            this.rings.splice(ringIndex, 1);
        }
    }
}
