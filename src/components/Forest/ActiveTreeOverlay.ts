import * as THREE from 'three';
import gsap from 'gsap';

export class ActiveTreeOverlay {
    private group: THREE.Group;
    private material: THREE.MeshBasicMaterial;

    constructor() {
        this.group = new THREE.Group();
        this.material = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
    }

    getGroup() {
        return this.group;
    }

    tracePath(rootPos: THREE.Vector3, rotation: number, scale: number, maxDepth: number) {
        // Clear previous
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const segments: THREE.Mesh[] = [];

        // Reconstruction logic similar to InstancedForest but with separate meshes
        const buildPath = (pos: THREE.Vector3, rot: THREE.Euler, depth: number) => {
            if (depth > maxDepth) return;

            const length = 5 * Math.pow(0.7, depth) * scale;
            const geo = new THREE.BoxGeometry(0.06, length, 0.06);
            const mesh = new THREE.Mesh(geo, this.material.clone());
            mesh.material.opacity = 0;

            mesh.position.copy(pos);
            mesh.rotation.copy(rot);
            mesh.translateY(length / 2);

            this.group.add(mesh);
            segments.push(mesh);

            // Random path selection
            const nextPos = new THREE.Vector3(0, length, 0).applyEuler(rot).add(pos);
            const angle = Math.PI / 6;
            const nextDir = Math.random() > 0.5 ? 1 : -1;
            const nextRot = new THREE.Euler(rot.x, rot.y, rot.z + angle * nextDir);

            buildPath(nextPos, nextRot, depth + 1);
        };

        buildPath(rootPos, new THREE.Euler(0, rotation, 0), 0);

        // Animate segments sequentially
        const tl = gsap.timeline();
        segments.forEach((seg, i) => {
            tl.to(seg.material, {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out"
            }, i * 0.3);
        });

        tl.to(segments.map(s => s.material), {
            opacity: 0,
            duration: 2,
            delay: 1,
            onComplete: () => {
                // cleanup
            }
        });
    }
}
