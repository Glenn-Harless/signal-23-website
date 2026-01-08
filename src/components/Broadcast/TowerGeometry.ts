import * as THREE from 'three';

export const createTowerGeometry = () => {
    const group = new THREE.Group();

    // Material for the skeletal lattice
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        wireframe: true,
        blending: THREE.AdditiveBlending
    });

    // Base: 4 legs converging upward
    const height = 15;
    const baseWidth = 4;
    const topWidth = 0.5;

    const legsGeometry = new THREE.CylinderGeometry(topWidth, baseWidth, height, 4, 1, true);
    const legs = new THREE.Mesh(legsGeometry, material);
    legs.position.y = height / 2;
    legs.rotation.y = Math.PI / 4;
    group.add(legs);

    // Cross-bracing (Diagonal struts)
    const segments = 6;
    for (let i = 0; i < segments; i++) {
        const y = (height / segments) * i;
        const nextY = (height / segments) * (i + 1);
        const radius = baseWidth - (baseWidth - topWidth) * (i / segments);
        const nextRadius = baseWidth - (baseWidth - topWidth) * ((i + 1) / segments);

        // Horizontal ring
        const ringGeo = new THREE.TorusGeometry(radius, 0.05, 4, 4);
        const ring = new THREE.Mesh(ringGeo, material);
        ring.position.y = y;
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = Math.PI / 4;
        group.add(ring);

        // Diagonal bracing
        // (Simplified by adding a few slanted lines or using the wireframe of the cylinder)
    }

    // Antenna array: Central mast
    const mastHeight = 5;
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.2, mastHeight, 4);
    const mast = new THREE.Mesh(mastGeo, material);
    mast.position.y = height + mastHeight / 2;
    group.add(mast);

    // Horizontal elements at top
    const crossbarGeo = new THREE.BoxGeometry(2, 0.05, 0.05);
    for (let j = 0; j < 3; j++) {
        const bar = new THREE.Mesh(crossbarGeo, material);
        bar.position.y = height + mastHeight - j * 0.5;
        bar.rotation.y = (j * Math.PI) / 3;
        group.add(bar);
    }

    return group;
};
