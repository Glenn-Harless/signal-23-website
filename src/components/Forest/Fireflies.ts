import * as THREE from 'three';

export const createFireflies = (count: number = 150) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = Math.random() * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;

        phases[i] = Math.random() * Math.PI * 2;
        sizes[i] = 3 + Math.random() * 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const fireflyMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffb347) },
        },
        vertexShader: `
      attribute float aPhase;
      attribute float aSize;
      varying float vPhase;
      varying float vBrightness;
      uniform float uTime;

      void main() {
        vPhase = aPhase;
        // Pulsing brightness
        vBrightness = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase * 6.28);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Size attenuation
        gl_PointSize = aSize * (300.0 / -mvPosition.z) * (0.6 + vBrightness * 0.4);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      uniform vec3 uColor;
      varying float vBrightness;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;

        // Soft glow falloff
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        glow = pow(glow, 2.0);

        vec3 coreColor = vec3(1.0);
        vec3 finalColor = mix(uColor, coreColor, glow * 0.5);

        gl_FragColor = vec4(finalColor, glow * vBrightness);
      }
    `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    return new THREE.Points(geometry, fireflyMaterial);
};

export const updateFireflies = (points: THREE.Points, time: number) => {
    const positions = points.geometry.attributes.position.array as Float32Array;
    const phases = points.geometry.attributes.aPhase.array as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const phase = phases[i];

        // Lazy drift with vertical motion
        positions[idx] += Math.sin(time * 0.3 + phase) * 0.015;
        positions[idx + 1] += 0.008 + Math.sin(time * 0.5 + phase * 2.0) * 0.01;
        positions[idx + 2] += Math.cos(time * 0.4 + phase * 1.5) * 0.012;

        // Wrap around
        if (positions[idx + 1] > 25) {
            positions[idx + 1] = 0;
        }
    }

    points.geometry.attributes.position.needsUpdate = true;
    if (points.material instanceof THREE.ShaderMaterial) {
        points.material.uniforms.uTime.value = time;
    }
};
