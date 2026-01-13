import * as THREE from 'three';
import gsap from 'gsap';

export class ActiveTreeOverlay {
    private group: THREE.Group;
    private traceMaterial: THREE.ShaderMaterial;

    constructor() {
        this.group = new THREE.Group();

        // Material for the "Digital Moss" branches
        this.traceMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uRevealAmount: { value: 0.0 }, // 0 to 1
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x00ccaa) }, // Muted Teal
                uOpacity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vHeight;
void main() {
    vUv = uv;
    vHeight = position.y;
                    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`,
            fragmentShader: `
                uniform float uRevealAmount;
                uniform float uTime;
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                varying float vHeight;

                float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
                    // Reveal calculation based on uRevealAmount and vertical height
                    // Adding noise to the threshold for a jagged "growth" feel
                    float noise = hash(vec2(vUv.x * 10.0, floor(vUv.y * 50.0)));
                    float threshold = uRevealAmount * 1.2 - noise * 0.2;

    // Remap vUv.y to be relative to the reveal progress
    if (vUv.y > threshold) discard;

                    // Digital "jitter" transparency
                    float alphaNoise = hash(vec2(floor(vWorldPosition.y * 100.0), floor(uTime * 30.0)));
                    float glitchAlpha = step(0.1, alphaNoise);

                    // Fade at the growth edge
                    float edge = smoothstep(threshold - 0.1, threshold, vUv.y);

                    // Wireframe-like detail
                    float gridX = step(0.9, fract(vUv.x * 2.0));
                    float gridY = step(0.9, fract(vUv.y * 10.0));
                    float wire = max(gridX, gridY);

                    vec3 color = uColor;
    // Flash at the growth edge
    color += edge * vec3(0.5, 1.0, 0.8) * 0.5;

                    // Occasional digital "sparks"
                    float spark = step(0.999, hash(vec2(vWorldPosition.x, uTime))) * 2.0;
    color += spark;

                    float finalAlpha = (0.3 + wire * 0.7) * glitchAlpha * uOpacity;

    gl_FragColor = vec4(color, finalAlpha);
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
        // More subtle "data pulse" flare
        const flareGeo = new THREE.RingGeometry(0.05, 0.1, 12);
        const flareMat = new THREE.MeshBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const flare = new THREE.Mesh(flareGeo, flareMat);
        flare.position.copy(position);
        scene.add(flare);

        gsap.timeline()
            .to(flareMat, { opacity: 0.6, duration: 0.1 })
            .to(flare.scale, { x: 5, y: 5, duration: 0.4, ease: "power2.out" }, 0)
            .to(flareMat, {
                opacity: 0, duration: 0.3, onComplete: () => {
                    scene.remove(flare);
                    flareGeo.dispose();
                    flareMat.dispose();
                }
            }, 0.1);
    }

    tracePath(rootPos: THREE.Vector3, rotation: number, scale: number, maxDepth: number, scene: THREE.Scene) {
        const segments: THREE.Mesh[] = [];
        const traceGroup = new THREE.Group();
        traceGroup.position.copy(rootPos);
        this.group.add(traceGroup);

        const buildPath = (pos: THREE.Vector3, rot: THREE.Euler, depth: number) => {
            if (depth > maxDepth) return;

            const length = 5 * Math.pow(0.7, depth) * scale;
            const geo = new THREE.CylinderGeometry(0.025, 0.045, length, 6);
            const mat = this.traceMaterial.clone();
            const mesh = new THREE.Mesh(geo, mat);

            mesh.position.copy(pos);
            mesh.rotation.copy(rot);
            mesh.translateY(length / 2);

            traceGroup.add(mesh);
            segments.push(mesh);

            const nextPos = new THREE.Vector3(0, length, 0).applyEuler(rot).add(pos);

            // Random chance for flare at junction
            if (Math.random() > 0.7) {
                this.createNodeFlare(nextPos.clone().add(rootPos), scene);
            }

            const angle = Math.PI / 6;
            const nextRot = new THREE.Euler(rot.x, rot.y, rot.z + angle * (Math.random() > 0.5 ? 1 : -1));

            buildPath(nextPos, nextRot, depth + 1);
        };

        buildPath(new THREE.Vector3(0, 0, 0), new THREE.Euler(0, rotation, 0), 0);

        const tl = gsap.timeline();

        // Growth animation: stagger the reveal of segments
        segments.forEach((seg, i) => {
            const mat = seg.material as THREE.ShaderMaterial;
            tl.to(mat.uniforms.uRevealAmount, {
                value: 1.0,
                duration: 1.2,
                ease: "power1.inOut"
            }, i * 0.15);
        });

        // Hold, then glitch away
        tl.to({}, { duration: 2.0 });

        tl.to(segments.map(s => (s.material as THREE.ShaderMaterial).uniforms.uOpacity), {
            value: 0,
            duration: 0.8,
            stagger: {
                each: 0.05,
                from: "end"
            },
            onUpdate: () => {
                // Flickering fade
                segments.forEach(s => {
                    const m = s.material as THREE.ShaderMaterial;
                    if (Math.random() > 0.8) m.uniforms.uOpacity.value *= 0.5;
                });
            }
        });

        tl.call(() => {
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
