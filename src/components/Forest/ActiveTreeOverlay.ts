import * as THREE from 'three';
import gsap from 'gsap';

export class ActiveTreeOverlay {
    private group: THREE.Group;
    private traceMaterial: THREE.ShaderMaterial;

    constructor() {
        this.group = new THREE.Group();

        this.traceMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uProgress: { value: 0 },
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x00ff88) },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
          // Energy pulse traveling along UV.y (length of cylinder)
          float pulse = smoothstep(0.0, 0.2, uProgress - (1.0 - vUv.y)) * 
                        (1.0 - smoothstep(0.0, 0.5, uProgress - (1.0 - vUv.y)));
          
          // Core glow
          float core = 1.0 - abs(vUv.x - 0.5) * 2.0;
          core = pow(core, 2.0);

          float flicker = 0.8 + 0.2 * sin(uTime * 15.0 + vUv.y * 30.0);
          
          vec3 finalColor = uColor * (1.0 + core * 0.5) * flicker;
          float alpha = pulse * (0.6 + core * 0.4);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }

    getGroup() {
        return this.group;
    }

    private createNodeFlare(position: THREE.Vector3, scene: THREE.Scene) {
        const flareGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const flareMat = new THREE.MeshBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        const flare = new THREE.Mesh(flareGeo, flareMat);
        flare.position.copy(position);
        scene.add(flare);

        gsap.timeline()
            .to(flareMat, { opacity: 0.8, duration: 0.1 })
            .to(flare.scale, { x: 3, y: 3, z: 3, duration: 0.4, ease: "power2.out" }, 0)
            .to(flareMat, {
                opacity: 0, duration: 0.5, onComplete: () => {
                    scene.remove(flare);
                    flareGeo.dispose();
                    flareMat.dispose();
                }
            }, 0.1);
    }

    tracePath(rootPos: THREE.Vector3, rotation: number, scale: number, maxDepth: number, scene: THREE.Scene) {
        const segments: THREE.Mesh[] = [];

        // Clear previous group children after they've faded out or immediately
        // For simplicity here, we create a new sub-group for this trace
        const traceGroup = new THREE.Group();
        this.group.add(traceGroup);

        const buildPath = (pos: THREE.Vector3, rot: THREE.Euler, depth: number) => {
            if (depth > maxDepth) return;

            const length = 5 * Math.pow(0.7, depth) * scale;
            // Cylinder geo for lines
            const geo = new THREE.CylinderGeometry(0.015, 0.025, length, 6);
            const mesh = new THREE.Mesh(geo, this.traceMaterial.clone());

            mesh.position.copy(pos);
            mesh.rotation.copy(rot);
            mesh.translateY(length / 2);

            traceGroup.add(mesh);
            segments.push(mesh);

            const nextPos = new THREE.Vector3(0, length, 0).applyEuler(rot).add(pos);
            const angle = Math.PI / 6;
            const nextDir = Math.random() > 0.5 ? 1 : -1;
            const nextRot = new THREE.Euler(rot.x, rot.y, rot.z + angle * nextDir);

            buildPath(nextPos, nextRot, depth + 1);
        };

        buildPath(rootPos, new THREE.Euler(0, rotation, 0), 0);

        const tl = gsap.timeline();
        segments.forEach((seg, i) => {
            const mat = seg.material as THREE.ShaderMaterial;
            tl.to(mat.uniforms.uProgress, {
                value: 1.5, // Go beyond 1 to fully clear the segment
                duration: 0.8,
                ease: "none",
                onStart: () => {
                    if (i > 0) this.createNodeFlare(seg.position, scene);
                }
            }, i * 0.2);
        });

        // Cleanup entire trace group after animation
        tl.to({}, { duration: 2 }).call(() => {
            this.group.remove(traceGroup);
            segments.forEach(s => {
                s.geometry.dispose();
                (s.material as THREE.ShaderMaterial).dispose();
            });
        });
    }

    update(time: number) {
        this.group.traverse(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
                child.material.uniforms.uTime.value = time;
            }
        });
    }
}
