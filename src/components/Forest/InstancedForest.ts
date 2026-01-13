import * as THREE from 'three';
import { ForestShader } from './ForestShader';
import { TreeData } from './types';

export const createInstancedForest = (treeCount: number = 400, maxDepth: number = 6) => {
    const branchesPerTree = Math.pow(2, maxDepth + 1) - 1;
    const totalInstances = treeCount * branchesPerTree;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.ShaderMaterial({
        ...ForestShader,
        transparent: true,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.InstancedMesh(geometry, material, totalInstances);
    const treeData: TreeData[] = [];

    const dummy = new THREE.Object3D();
    let instanceIdx = 0;

    for (let i = 0; i < treeCount; i++) {
        const treePos = new THREE.Vector3(
            (Math.random() - 0.5) * 120,
            0,
            (Math.random() - 0.5) * 80 - 40
        );

        const treeScale = 0.5 + Math.random() * 0.5;
        const treeRotation = Math.random() * Math.PI * 2;

        treeData.push({
            id: `tree-${i}`,
            position: treePos,
            rotation: treeRotation,
            scale: treeScale,
            depth: maxDepth,
            phase: Math.random() * Math.PI * 2
        });

        const recursiveBranch = (pos: THREE.Vector3, rot: THREE.Euler, depth: number) => {
            if (depth > maxDepth) return;

            const length = 5 * Math.pow(0.7, depth) * treeScale;
            dummy.position.copy(pos);
            dummy.rotation.copy(rot);
            dummy.scale.set(0.04 * (1 - depth * 0.1), length, 0.04 * (1 - depth * 0.1));

            dummy.translateY(length / 2);
            dummy.updateMatrix();
            mesh.setMatrixAt(instanceIdx++, dummy.matrix);

            const nextPos = new THREE.Vector3(0, length, 0).applyEuler(rot).add(pos);
            const angle = (0.2 + Math.random() * 0.2) * Math.PI;

            // Binary split
            recursiveBranch(nextPos, new THREE.Euler(rot.x, rot.y, rot.z + angle), depth + 1);
            recursiveBranch(nextPos, new THREE.Euler(rot.x, rot.y, rot.z - angle), depth + 1);
        };

        recursiveBranch(treePos, new THREE.Euler(0, treeRotation, 0), 0);
    }

    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, treeData };
};
