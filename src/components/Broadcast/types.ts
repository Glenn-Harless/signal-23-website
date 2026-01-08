import * as THREE from 'three';

export interface RingParams {
    id: string;
    startTime: number;
    progress: number;
    payload: string;
    radius: number;
}

export interface BroadcastState {
    isActive: boolean;
    rings: RingParams[];
    audioInitialized: boolean;
}

export interface BroadcastUniforms {
    uTime: { value: number };
    uRingProgress: { value: number };
    uFrequencyData: { value: number };
    uResolution: { value: THREE.Vector2 };
    uDegradation: { value: number };
}
