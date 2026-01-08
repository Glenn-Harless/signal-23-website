import * as THREE from 'three';


// Re-checking project structure... wait, App.tsx used raw Three.js with WebGLRenderer in useEffect.
// I should stick to raw Three.js style since I didn't see @react-three/fiber in package.json.

export const createFireflies = (count: number) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = Math.random() * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

        phases[i] = Math.random() * Math.PI * 2;
        sizes[i] = 2 + Math.random() * 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.5,
        color: 0xffb347,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    // Custom shader for blinking would be better, but PointsMaterial is a start
    return new THREE.Points(geometry, material);
};

export const updateFireflies = (points: THREE.Points, time: number) => {
    const positions = points.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
        // Lazy drift
        positions[i * 3 + 1] += Math.sin(time + i) * 0.01 + 0.005;
        positions[i * 3] += Math.cos(time * 0.5 + i) * 0.01;

        // Pulse size/opacity (simulated with material for simple points, 
        // or we'd use a ShaderMaterial)
        if (positions[i * 3 + 1] > 25) positions[i * 3 + 1] = 0;
    }

    points.geometry.attributes.position.needsUpdate = true;
};
