import * as THREE from 'three';

export interface TreeData {
    id: string;
    position: THREE.Vector3;
    rotation: number;
    scale: number;
    depth: number;
    phase: number; // For sway offset
}

export interface FireflyData {
    id: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    size: number;
    phase: number;
}

export interface ForestConfig {
    treeCount: number;
    fireflyCount: number;
    maxTreeDepth: number;
    swayAmplitude: number;
    swaySpeed: number;
}

export interface DecisionNode {
    id: string;
    depth: number;
    isLeaf: boolean;
    position: THREE.Vector3; // Relative to parent
    children: [string, string] | null;
}
